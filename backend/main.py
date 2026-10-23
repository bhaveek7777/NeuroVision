"""
NeuroVision Backend — FastAPI + Supabase
All data stored in Supabase. Falls back to local JSON if a table doesn't exist yet.
Run the SQL in supabase_schema.sql once in Supabase Dashboard to create all tables.
"""
from fastapi import FastAPI, UploadFile, File, Form, HTTPException,Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from supabase import create_client
from datetime import datetime, date
import os, shutil, json, uuid, pickle, numpy as np
import re
import pdfplumber
from supabase_client import supabase
# ---------------------------------------------------------
# Supabase Admin client
# IMPORTANT: service role key must stay in backend only
# ---------------------------------------------------------

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("WARNING: Supabase service-role environment variables are missing.")

supabase_admin = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
)

from recognition import recognize_faces, students as pkl_students, reload_embeddings

app = FastAPI(title="NeuroVision API")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"
DATA_FOLDER   = "data"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER,   exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_FOLDER), name="uploads")

# ── Supabase helper: returns None instead of raising on missing table ─────────

def sb_select(table: str, query="*", filters: dict = None, limit: int = 1000):
    try:
        q = supabase.table(table).select(query).limit(limit)
        if filters:
            for k, v in filters.items():
                q = q.eq(k, v)
        return q.execute().data
    except Exception as e:
        print(f"[sb_select] {table} error: {e}")
        return None   # table missing or network error

def sb_insert(table: str, data: dict):
    try:
        return supabase.table(table).insert(data).execute().data
    except Exception as e:
        print(f"[sb_insert] {table} error: {e}")
        return None

def sb_update(table: str, data: dict, filters: dict):
    try:
        q = supabase.table(table).update(data)
        for k, v in filters.items():
            q = q.eq(k, v)
        return q.execute().data
    except Exception as e:
        print(f"[sb_update] {table} error: {e}")
        return None

def sb_delete(table: str, filters: dict):
    try:
        q = supabase.table(table).delete()
        for k, v in filters.items():
            q = q.eq(k, v)
        return q.execute().data
    except Exception as e:
        print(f"[sb_delete] {table} error: {e}")
        return None

# ── Local JSON fallback ───────────────────────────────────────────────────────

def _jpath(name): return os.path.join(DATA_FOLDER, f"{name}.json")
def _jread(name, default):
    p = _jpath(name)
    if os.path.exists(p):
        with open(p) as f: return json.load(f)
    return default
def _jwrite(name, data):
    with open(_jpath(name), "w") as f:
        json.dump(data, f, indent=2, default=str)

# ── Parse pkl key ─────────────────────────────────────────────────────────────

def parse_key(key: str):
    parts = key.split("_")
    roll_no    = parts[-1]
    name       = " ".join(parts[:-1])
    student_id = f"ST{roll_no.zfill(3)}"
    return name, roll_no, student_id

# ── Students from pkl (used as fallback when Supabase students are incomplete) ──

def build_students_from_pkl():
    result = []
    for key in pkl_students.keys():
        name, roll_no, student_id = parse_key(key)
        result.append({
            "id": student_id, "student_id": student_id,
            "roll_no": roll_no, "name": name, "pkl_key": key,
            "class_id": "TE Computer", "division": "C",
            "email": f"{name.lower().replace(' ', '.')}@college.edu",
            "phone": "N/A",
            "avatar_url": f"https://ui-avatars.com/api/?name={name.replace(' ','+')}&background=6366f1&color=fff&size=128",
            "status": "Active",
            "parent_id": f"PAR{roll_no.zfill(3)}",
            "parent_name": f"Parent of {name}",
            "parent_phone": "N/A",
            "parent_email": f"parent.{name.lower().replace(' ','.')}@gmail.com",
            "parent_pref": "WhatsApp",
            "overall_attendance": 85,
            "subject_attendance": {"DBMS": 85, "Operating Systems": 80, "Computer Networks": 78, "Machine Learning": 88},
        })
    return result

def get_students():
    rows = sb_select("students")
    if rows is not None and len(rows) > 0:
        # Enrich with pkl-only fields if missing
        pkl_map = {parse_key(k)[1]: k for k in pkl_students.keys()}
        for s in rows:
            rn = str(s.get("roll_no", ""))
            if not s.get("student_id"):
                s["student_id"] = f"ST{rn.zfill(3)}"
            if not s.get("id"):
                s["id"] = s["student_id"]
            if not s.get("pkl_key") and rn in pkl_map:
                s["pkl_key"] = pkl_map[rn]
            if not s.get("avatar_url"):
                n = s.get("name","Student")
                s["avatar_url"] = f"https://ui-avatars.com/api/?name={n.replace(' ','+')}&background=6366f1&color=fff&size=128"
            if not s.get("subject_attendance"):
                s["subject_attendance"] = {"DBMS": 85, "Operating Systems": 80, "Computer Networks": 78, "Machine Learning": 88}
            if not s.get("overall_attendance"):
                s["overall_attendance"] = 85
            if not s.get("class_id"):
                s["class_id"] = "TE Computer"
            if not s.get("division"):
                s["division"] = "C"
            if not s.get("parent_name"):
                s["parent_name"] = f"Parent of {s.get('name','')}"
            if not s.get("parent_phone"):
                s["parent_phone"] = "N/A"
            if not s.get("parent_pref"):
                s["parent_pref"] = "WhatsApp"
            if not s.get("status"):
                s["status"] = "Active"
        return rows
    # Fallback: build from pkl
    return build_students_from_pkl()

# ── Default teachers / timetable for fallback ────────────────────────────────

def default_teachers():
    return [
        {"id":"T001","teacher_id":"T001","name":"Prof. Ramesh Sharma","email":"ramesh.sharma@college.edu","phone":"9876543210","department":"Computer Engineering","designation":"Associate Professor","avatar_url":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80","assigned_subjects":["DBMS","Operating Systems"],"assigned_classes":["TE Computer"],"assigned_divisions":["C"]},
        {"id":"T002","teacher_id":"T002","name":"Dr. Priya Mehta","email":"priya.mehta@college.edu","phone":"9876543211","department":"Computer Engineering","designation":"Assistant Professor","avatar_url":"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80","assigned_subjects":["Computer Networks","Machine Learning"],"assigned_classes":["TE Computer"],"assigned_divisions":["C"]},
    ]

def default_timetable():
    today = date.today().isoformat()
    return [
        {"id":"LEC-001","lecture_no":24,"subject":"DBMS","subject_code":"CS401","class_name":"TE Computer","division":"C","classroom":"Smart Lab 304","teacher_id":"T001","teacher_name":"Prof. Ramesh Sharma","day":"Tuesday","date":today,"start_time":"10:00 AM","end_time":"11:00 AM","status":"Scheduled"},
        {"id":"LEC-002","lecture_no":18,"subject":"Operating Systems","subject_code":"CS402","class_name":"TE Computer","division":"C","classroom":"Room 201","teacher_id":"T001","teacher_name":"Prof. Ramesh Sharma","day":"Tuesday","date":today,"start_time":"11:00 AM","end_time":"12:00 PM","status":"Scheduled"},
        {"id":"LEC-003","lecture_no":12,"subject":"Computer Networks","subject_code":"CS403","class_name":"TE Computer","division":"C","classroom":"Lab 102","teacher_id":"T002","teacher_name":"Dr. Priya Mehta","day":"Tuesday","date":today,"start_time":"2:00 PM","end_time":"3:00 PM","status":"Scheduled"},
    ]

DEFAULT_SETTINGS = {
    "min_attendance_threshold":75,"ai_confidence_high_threshold":90,
    "ai_confidence_medium_threshold":75,"academic_year":"2026-2027 (Odd Semester)",
    "college_name":"Imperial Institute of Technology & Engineering",
    "college_code":"IIT-ENG-304","department":"Department of Computer Engineering",
    "allow_offline_sync":True,"enable_parent_notifications":True,
    "parent_channels":{"whatsapp":True,"sms":True,"email":True,"app":True},
    "anomaly_sensitivity":"Medium",
}

# ════════════════════════════════════════════════════════
#  ROUTES
# ════════════════════════════════════════════════════════

@app.get("/")
def home():
    return {"message": "NeuroVision API is running"}

@app.get("/api/health")
def health():
    n = len(pkl_students)
    sb_ok = sb_select("students", limit=1) is not None
    return {
        "status":"ok","ready":True,
        "api":{"status":"online","port":8000},
        "database":{"status":"online" if sb_ok else "offline","provider":"Supabase / PostgreSQL","connected":sb_ok},
        "ml_engine":{"status":"online","model":"InsightFace Buffalo_L","connected":True,"students_in_model":n},
    }

# ── Auth ──────────────────────────────────────────────────────────────────────
class LoginBody(BaseModel):
    email: str
    role:  str

@app.post("/api/auth/login")
def login(body: LoginBody):
    user = {"id":"ADM-01","name":"Dr. Arvind Kulkarni","email":body.email,"role":"Admin","avatar":"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80","designation":"Dean of Academics","department":"Academic Affairs"} if body.role=="Admin" else {"id":"T001","name":"Prof. Ramesh Sharma","email":body.email,"role":"Teacher","avatar":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80","designation":"Associate Professor","department":"Computer Engineering"}
    return {"success":True,"user":user}

# ── Students ─────────────────────────────────────────────

@app.get("/api/students")
def list_students():
    rows = sb_select("students")

    if rows is not None:
        pkl_map = {
            parse_key(k)[1]: k
            for k in pkl_students.keys()
        }

        for student in rows:
            roll_no = str(student.get("roll_no", ""))

            student.setdefault(
                "student_id",
                f"ST{roll_no.zfill(3)}"
            )

            student.setdefault("id", student["student_id"])

            # Support the existing frontend status field
            if "is_active" not in student:
                student["is_active"] = True

            student["status"] = (
                "Active" if student["is_active"]
                else "Inactive"
            )

            if not student.get("pkl_key") and roll_no in pkl_map:
                student["pkl_key"] = pkl_map[roll_no]

        return rows

    # Fallback when Supabase is unavailable
    students = _jread("students", build_students_from_pkl())

    for student in students:
        student.setdefault("is_active", True)
        student["status"] = (
            "Active" if student["is_active"]
            else "Inactive"
        )

    return students


@app.post("/api/students")
def add_student(data: dict):
    data.setdefault("is_active", True)
    data["status"] = "Active"

    result = sb_insert("students", data)

    if result is None:
        rows = _jread("students", [])
        rows.append(data)
        _jwrite("students", rows)

    return {"success": True, "student": data}


@app.put("/api/students/{sid}")
def update_student(sid: str, data: dict):
    result = sb_update(
        "students",
        data,
        {"student_id": sid}
    )

    if result is None or not result:
        result = sb_update(
            "students",
            data,
            {"roll_no": sid}
        )

    if result is None:
        raise HTTPException(
            status_code=500,
            detail="Could not update student."
        )

    return {"success": True}


@app.put("/api/students/{sid}/activate")
def activate_student(sid: str):
    return set_student_active(sid, True)


@app.put("/api/students/{sid}/deactivate")
def deactivate_student(sid: str):
    return set_student_active(sid, False)


def set_student_active(sid: str, active: bool):
    # Try the student ID first
    result = sb_update(
        "students",
        {"is_active": active},
        {"student_id": sid}
    )

    # If student_id isn't populated, try the roll number
    if result is None or not result:
        result = sb_update(
            "students",
            {"is_active": active},
            {"roll_no": sid}
        )

    if result is None:
        raise HTTPException(
            status_code=500,
            detail="Could not update student status."
        )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Student not found."
        )

    return {
        "success": True,
        "is_active": active,
        "status": "Active" if active else "Inactive"
    }


@app.delete("/api/students/{sid}")
def delete_student(sid: str):
    # Soft-delete: deactivate without deleting the database row
    return set_student_active(sid, False)

# ── Teachers ──────────────────────────────────────────────────────────────────
@app.get("/api/teachers")
def list_teachers():
    rows = sb_select("teachers")
    return rows if rows else default_teachers()

@app.post("/api/teachers")
def add_teacher(data: dict):
    sb_insert("teachers", data)
    return data

# ── Timetable ─────────────────────────────────────────────────────────────────

# ── Timetable ────────────────────────────────────────────────────────────────

@app.get("/api/timetable")
def list_timetable():
    rows = sb_select("timetable")

    if rows is None:
        raise HTTPException(
            status_code=500,
            detail="Could not load timetable from Supabase."
        )

    subjects = {
        str(s["id"]): s
        for s in (sb_select("subjects") or [])
    }
    teachers = {
        str(t["id"]): t
        for t in (sb_select("teachers") or [])
    }
    divisions = {
        str(d["id"]): d
        for d in (sb_select("divisions") or [])
    }
    classes = {
        str(c["id"]): c
        for c in (sb_select("classes") or [])
    }

    for entry in rows:
        subject = subjects.get(str(entry.get("subject_id")), {})
        teacher = teachers.get(str(entry.get("teacher_id")), {})
        division = divisions.get(str(entry.get("division_id")), {})
        class_info = classes.get(str(division.get("class_id")), {})

        entry["subjects"] = {"name": subject.get("name")}
        entry["teachers"] = {"name": teacher.get("name")}
        entry["divisions"] = {
            "name": division.get("name"),
            "classes": {"name": class_info.get("name")}
        }

    return rows


@app.post("/api/timetable")
def create_timetable_entry(data: dict):
    required = [
        "day_of_week",
        "start_time",
        "end_time",
        "subject_id",
        "division_id"
    ]

    missing = [
        field for field in required
        if data.get(field) in (None, "")
    ]

    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required fields: {', '.join(missing)}"
        )

    if data["end_time"] <= data["start_time"]:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time."
        )

    payload = {
        "day_of_week": data["day_of_week"],
        "start_time": data["start_time"],
        "end_time": data["end_time"],
        "subject_id": int(data["subject_id"]),
        "division_id": int(data["division_id"]),
        "teacher_id": (
            int(data["teacher_id"])
            if data.get("teacher_id") not in (None, "")
            else None
        ),
        "room": data.get("room") or None,
        "lecture_no": data.get("lecture_no"),
        "lab_group": data.get("lab_group") or None,
        "subject_code": data.get("subject_code") or None,
        "effective_from": data.get("effective_from") or None,
        "effective_to": data.get("effective_to") or None,
        "status": data.get("status", "draft")
    }

    result = sb_insert("timetable", payload)

    if result is None:
        raise HTTPException(
            status_code=500,
            detail="Failed to save timetable entry to Supabase."
        )

    return {"success": True, "entry": result[0] if result else payload}
 
# ── Timetable PDF upload and extraction preview ──────────────────────────────

@app.post("/api/timetable/preview-pdf")
async def preview_timetable_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file."
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded PDF is empty."
        )

    # Prevent excessively large uploads.
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="PDF must be smaller than 15 MB."
        )

    try:
        import io

        extracted_pages = []
        extracted_tables = []

        with pdfplumber.open(io.BytesIO(content)) as pdf:
            if len(pdf.pages) > 100:
                raise HTTPException(
                    status_code=400,
                    detail="PDF must contain no more than 100 pages."
                )

            for page_number, page in enumerate(pdf.pages, start=1):
                page_text = page.extract_text() or ""

                extracted_pages.append({
                    "page": page_number,
                    "text": page_text
                })

                for table_number, table in enumerate(
                    page.extract_tables() or [],
                    start=1
                ):
                    extracted_tables.append({
                        "page": page_number,
                        "table_number": table_number,
                        "rows": table
                    })

        full_text = "\n\n".join(
            page["text"] for page in extracted_pages
        )

        if not full_text.strip() and not extracted_tables:
            raise HTTPException(
                status_code=422,
                detail=(
                    "No readable text or tables were found. "
                    "This may be a scanned PDF requiring OCR."
                )
            )

        # Preserve extracted lines for review. Timetable grids often
        # require layout-specific parsing before rows can be published.
        lines = [
            line.strip()
            for line in full_text.splitlines()
            if line.strip()
        ]

        return {
            "success": True,
            "filename": file.filename,
            "page_count": len(extracted_pages),
            "extracted_text": full_text,
            "lines": lines,
            "tables": extracted_tables,
            "message": (
                "PDF extracted successfully. Review the extracted "
                "content before converting it into timetable entries."
            )
        }

    except HTTPException:
        raise
    except Exception as exc:
        print("TIMETABLE PDF ERROR:", exc)
        raise HTTPException(
            status_code=422,
            detail="Could not read this PDF. Please check the file."
        )
    finally:
        await file.close()


# ── Dashboard Stats ───────────────────────────────────────────────────────────
@app.get("/api/dashboard/stats")
def dashboard_stats():
    students  = get_students()
    teachers  = list_teachers()
    sessions  = list_sessions()
    mods_data = list_modifications()
    cfg       = get_settings()
    threshold = cfg.get("min_attendance_threshold", 75)

    low_att       = [s for s in students if (s.get("overall_attendance") or 100) < threshold]
    today_str     = date.today().isoformat()
    today_sessions= [s for s in sessions if str(s.get("date",""))[:10] == today_str]
    today_present = sum(s.get("present_count",0) for s in today_sessions)
    pending_mods  = len([m for m in mods_data if m.get("status")=="Pending"])

    audit = sb_select("audit_logs") or []
    return {
        "total_students":          len(students),
        "total_teachers":          len(teachers),
        "todays_lectures":         len(list_timetable()),
        "todays_attendance":       today_present,
        "pending_requests":        pending_mods,
        "defaulters_count":        len(low_att),
        "low_attendance_students": low_att[:10],
        "recent_activity":         audit[-5:],
        "recent_sessions":         sessions[-5:],
    }


# ── Attendance Sessions ───────────────────────────────────────────────────────

@app.get("/api/attendance/sessions")
def list_sessions():
    rows = sb_select("attendance_sessions")

    if rows is None:
        raise HTTPException(
            status_code=500,
            detail="Could not load attendance sessions from Supabase."
        )

    for session in rows:
        records = sb_select(
            "attendance_records",
            filters={"session_id": session["id"]}
        )
        session["records"] = records if records is not None else []

    return rows


@app.get("/api/attendance/sessions/by-timetable/{timetable_id}")
def get_session_by_timetable(timetable_id: int, attendance_date: str):
    """Return an existing attendance session and its records for a lecture/date."""
    try:
        normalized_date = date.fromisoformat(str(attendance_date)[:10]).isoformat()
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Invalid attendance date. Use YYYY-MM-DD.",
        )

    try:
        result = (
            supabase_admin.table("attendance_sessions")
            .select("*")
            .eq("timetable_id", timetable_id)
            .eq("attendance_date", normalized_date)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        print("EXISTING ATTENDANCE LOOKUP ERROR:", repr(exc))
        raise HTTPException(
            status_code=500,
            detail="Could not check existing attendance for this lecture.",
        )

    if not result.data:
        return {"exists": False, "session": None}

    session = result.data[0]
    try:
        records_result = (
            supabase_admin.table("attendance_records")
            .select("*")
            .eq("session_id", session["id"])
            .execute()
        )
        records = records_result.data or []
    except Exception as exc:
        print("EXISTING ATTENDANCE RECORDS ERROR:", repr(exc))
        raise HTTPException(
            status_code=500,
            detail="The session exists, but its student records could not be loaded.",
        )

    session["records"] = records
    session["present_count"] = sum(
        1 for record in records
        if str(record.get("status", "")).strip().lower() == "present"
    )
    session["absent_count"] = sum(
        1 for record in records
        if str(record.get("status", "")).strip().lower() == "absent"
    )
    return {"exists": True, "session": session}


@app.post("/api/attendance/sessions")
def create_session(data: dict):
    records = data.get("records") or data.get("student_records") or []

    timetable_id = data.get("timetable_id") or data.get("timetableId")

    if timetable_id in (None, ""):
        raise HTTPException(
            status_code=400,
            detail="Select a scheduled timetable lecture before saving attendance."
        )

    try:
        timetable_id = int(timetable_id)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid timetable ID.")

    # Verify the selected timetable lecture.
    try:
        timetable_result = (
            supabase_admin.table("timetable")
            .select(
                "id, subject_id, division_id, teacher_id, "
                "day_of_week, start_time, end_time, status"
            )
            .eq("id", timetable_id)
            .maybe_single()
            .execute()
        )
        lecture = timetable_result.data
    except Exception as exc:
        print("TIMETABLE LOOKUP ERROR:", repr(exc))
        raise HTTPException(
            status_code=500,
            detail="Could not verify the selected timetable lecture."
        )

    if not lecture:
        raise HTTPException(
            status_code=404,
            detail="The selected timetable lecture was not found."
        )

    if lecture.get("status") != "published":
        raise HTTPException(
            status_code=400,
            detail="Attendance can only be saved for a published lecture."
        )

    # Validate subject and division.
    incoming_subject = data.get("subject_id") or data.get("subjectId")
    incoming_division = data.get("division_id") or data.get("divisionId")

    try:
        if (
            incoming_subject is not None
            and int(incoming_subject) != int(lecture["subject_id"])
        ):
            raise HTTPException(
                status_code=400,
                detail="The selected subject does not match the timetable lecture."
            )

        if (
            incoming_division is not None
            and int(incoming_division) != int(lecture["division_id"])
        ):
            raise HTTPException(
                status_code=400,
                detail="The selected division does not match the timetable lecture."
            )
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Invalid subject or division ID."
        )

    # Validate the attendance date.
    attendance_date_input = (
        data.get("attendance_date")
        or data.get("date")
        or date.today().isoformat()
    )

    try:
        attendance_date = date.fromisoformat(
            str(attendance_date_input)[:10]
        ).isoformat()
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Invalid attendance date. Use YYYY-MM-DD."
        )

    # Prevent duplicate sessions for the same timetable entry and date.
    try:
        existing_result = (
            supabase_admin.table("attendance_sessions")
            .select("id")
            .eq("timetable_id", timetable_id)
            .eq("attendance_date", attendance_date)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        print("DUPLICATE SESSION CHECK ERROR:", repr(exc))
        raise HTTPException(
            status_code=500,
            detail="Could not check for an existing attendance session."
        )

    if existing_result.data:
        raise HTTPException(
            status_code=409,
            detail=(
                "Attendance already exists for this lecture and date. "
                "Open the existing session instead of submitting again."
            )
        )

    # Map numeric timetable teacher ID to teachers.user_id (UUID).
    teacher_uuid = None
    numeric_teacher_id = lecture.get("teacher_id")

    if numeric_teacher_id is not None:
        try:
            teacher_result = (
                supabase_admin.table("teachers")
                .select("user_id")
                .eq("id", numeric_teacher_id)
                .maybe_single()
                .execute()
            )

            if teacher_result.data:
                teacher_uuid = teacher_result.data.get("user_id")

        except Exception as exc:
            print("TEACHER UUID LOOKUP ERROR:", repr(exc))
            raise HTTPException(
                status_code=500,
                detail="Could not verify the teacher assigned to this lecture."
            )

    # Create the attendance session.
    session_payload = {
        "timetable_id": timetable_id,
        "subject_id": int(lecture["subject_id"]),
        "division_id": int(lecture["division_id"]),
        "attendance_date": attendance_date,
        "date": attendance_date,
        "start_time": lecture["start_time"],
        "end_time": lecture["end_time"],
        "teacher_id": teacher_uuid,
        "is_locked": True,
        "locked_at": datetime.now().isoformat(),
    }

    try:
        inserted = (
            supabase_admin.table("attendance_sessions")
            .insert(session_payload)
            .execute()
        )
    except Exception as exc:
        print("ATTENDANCE SESSION INSERT ERROR:", repr(exc))
        raise HTTPException(
            status_code=500,
            detail=f"Could not create attendance session: {str(exc)}"
        )

    if not inserted.data:
        raise HTTPException(
            status_code=500,
            detail="Supabase did not return the created attendance session."
        )

    saved_session = inserted.data[0]
    session_id = saved_session["id"]

    # Validate all student records before inserting them.
    prepared_records = []
    seen_student_ids = set()

    for record in records:
        try:
            student_id = int(record["student_id"])
        except (KeyError, TypeError, ValueError):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Each record must contain a numeric student_id "
                    "matching students.id. The session has already been created; "
                    "do not resubmit."
                )
            )

        if student_id in seen_student_ids:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Duplicate student_id {student_id}. "
                    "The session has already been created."
                )
            )

        seen_student_ids.add(student_id)

        status_value = (
            "Present"
            if str(record.get("status", "")).strip().lower() == "present"
            else "Absent"
        )

        prepared_records.append({
            "session_id": session_id,
            "student_id": student_id,
            "status": status_value,
            "marked_by": record.get("marked_by", "face_recognition"),
        })

    # Save student attendance records.
    saved_records = []

    for record_payload in prepared_records:
        try:
            record_result = (
                supabase_admin.table("attendance_records")
                .insert(record_payload)
                .execute()
            )

            saved_records.extend(record_result.data or [])

        except Exception as exc:
            print("ATTENDANCE RECORD INSERT ERROR:", repr(exc))
            raise HTTPException(
                status_code=500,
                detail=(
                    f"Session {session_id} was created, but a student record "
                    f"could not be saved: {str(exc)}. Do not submit again; "
                    "recover this session before retrying."
                )
            )

    # Audit logging is best-effort.
    try:
        supabase_admin.table("audit_logs").insert({
            "id": str(uuid.uuid4()),
            "user": data.get("teacher_name", "Teacher"),
            "role": "Teacher",
            "action": f"Attendance saved for timetable lecture {timetable_id}",
            "date": attendance_date,
            "time": datetime.now().strftime("%I:%M %p"),
            "ip_address": "127.0.0.1",
        }).execute()
    except Exception as exc:
        print("AUDIT LOG INSERT ERROR:", repr(exc))

    present_count = sum(
        1 for row in saved_records if row.get("status") == "Present"
    )
    absent_count = sum(
        1 for row in saved_records if row.get("status") == "Absent"
    )

    return {
        "success": True,
        "message": "Attendance saved successfully.",
        "session": {
            **saved_session,
            "records": saved_records,
            "present_count": present_count,
            "absent_count": absent_count,
        },
    }


# ---------------------------------------------------------
# ADMIN: CHANGE TEACHER PASSWORD
# ---------------------------------------------------------
# ---------------------------------------------------------

class ChangeTeacherPasswordBody(BaseModel):
    teacher_id: int
    new_password: str


@app.post("/api/admin/teacher/change-password")
def change_teacher_password(
    body: ChangeTeacherPasswordBody,
    authorization: str = Header(None)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    access_token = authorization.replace("Bearer ", "", 1)

    try:
        # Verify the currently logged-in user
        current_user = supabase_admin.auth.get_user(access_token)

        if not current_user or not current_user.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication."
            )

        admin_user_id = current_user.user.id

        # Make sure the caller is actually an admin
        role_result = (
            supabase_admin
            .table("user_roles")
            .select("role")
            .eq("user_id", admin_user_id)
            .eq("role", "admin")
            .maybe_single()
            .execute()
        )

        if not role_result.data:
            raise HTTPException(
                status_code=403,
                detail="Only administrators can change teacher passwords."
            )

        # Find the teacher's Supabase Auth user ID
        teacher_result = (
            supabase_admin
            .table("teachers")
            .select("user_id, name, email")
            .eq("id", body.teacher_id)
            .single()
            .execute()
        )

        teacher = teacher_result.data

        if not teacher or not teacher.get("user_id"):
            raise HTTPException(
                status_code=404,
                detail="Teacher account not found."
            )

        # Basic password validation
        if len(body.new_password) < 6:
            raise HTTPException(
                status_code=400,
                detail="Password must contain at least 6 characters."
            )

        # Change Supabase Auth password
        supabase_admin.auth.admin.update_user_by_id(
            teacher["user_id"],
            {
                "password": body.new_password
            }
        )

        return {
            "success": True,
            "message": f"Password changed for {teacher['name']}."
        }

    except HTTPException:
        raise

    except Exception as e:
        print("CHANGE PASSWORD ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ---------------------------------------------------------
# ADMIN: CREATE TEACHER
# ---------------------------------------------------------

class CreateTeacherBody(BaseModel):
    name: str
    email: str
    password: str
    phone: str = ""
    department_id: int | None = None
    designation: str = "Assistant Professor"
    teacher_id_code: str = ""


@app.post("/api/admin/teacher/create")
def create_teacher(
    body: CreateTeacherBody,
    authorization: str = Header(None)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    access_token = authorization.replace("Bearer ", "", 1)

    try:
        # Verify the currently logged-in user
        current_user = supabase_admin.auth.get_user(access_token)

        if not current_user or not current_user.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication."
            )

        admin_user_id = current_user.user.id

        # Make sure the caller is actually an admin
        role_result = (
            supabase_admin
            .table("user_roles")
            .select("role")
            .eq("user_id", admin_user_id)
            .eq("role", "admin")
            .maybe_single()
            .execute()
        )

        if not role_result.data:
            raise HTTPException(
                status_code=403,
                detail="Only administrators can create teachers."
            )

        # Validate password
        if len(body.password) < 6:
            raise HTTPException(
                status_code=400,
                detail="Password must contain at least 6 characters."
            )

        # Create Supabase Auth user
        # Email is automatically confirmed
        auth_result = supabase_admin.auth.admin.create_user({
            "email": body.email.strip(),
            "password": body.password,
            "email_confirm": True,
        })

        new_user = auth_result.user

        if not new_user:
            raise HTTPException(
                status_code=500,
                detail="Failed to create authentication account."
            )

        user_id = new_user.id

        try:
            # Create teacher profile
            teacher_result = (
                supabase_admin
                .table("teachers")
                .insert({
                    "user_id": user_id,
                    "name": body.name.strip(),
                    "email": body.email.strip(),
                    "phone": body.phone.strip(),
                    "department_id": body.department_id,
                    "designation": body.designation,
                    "teacher_id_code": body.teacher_id_code.strip(),
                })
                .execute()
            )

            if not teacher_result.data:
                raise Exception("Failed to create teacher profile.")

            # Create teacher role
            role_result = (
                supabase_admin
                .table("user_roles")
                .insert({
                    "user_id": user_id,
                    "role": "teacher",
                })
                .execute()
            )

            if not role_result.data:
                raise Exception("Failed to create teacher role.")

        except Exception as profile_error:

            # Delete Auth user if database creation fails
            try:
                supabase_admin.auth.admin.delete_user(user_id)
            except Exception as cleanup_error:
                print("AUTH CLEANUP ERROR:", cleanup_error)

            raise profile_error

        return {
            "success": True,
            "message": "Teacher created successfully.",
            "user_id": user_id,
        }

    except HTTPException:
        raise

    except Exception as e:
        print("CREATE TEACHER ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )






# ── Modification Requests ─────────────────────────────────────────────────────
@app.get("/api/attendance/modifications")
def list_modifications():
    rows = sb_select("modification_requests")
    return rows if rows is not None else _jread("modifications", [])

@app.post("/api/attendance/modifications")
def create_modification(data: dict):
    mods   = list_modifications()
    req_id = f"REQ-{1000 + len(mods) + 1}"
    data["id"]         = str(uuid.uuid4())
    data["request_id"] = req_id
    data["status"]     = "Pending"
    data["created_at"] = datetime.now().isoformat()
    sb_insert("modification_requests", data)
    return {"success": True, "request": data}

@app.put("/api/attendance/modifications/{req_id}/approve")
async def approve_modification(req_id: str, body: dict = {}):
    payload = {"status":"Approved","admin_comment":body.get("comment","Approved"),"reviewed_at":datetime.now().isoformat()}
    sb_update("modification_requests", payload, {"id": req_id})
    sb_update("modification_requests", payload, {"request_id": req_id})
    return {"success": True}

@app.put("/api/attendance/modifications/{req_id}/reject")
async def reject_modification(req_id: str, body: dict = {}):
    payload = {"status":"Rejected","admin_comment":body.get("comment","Rejected"),"reviewed_at":datetime.now().isoformat()}
    sb_update("modification_requests", payload, {"id": req_id})
    sb_update("modification_requests", payload, {"request_id": req_id})
    return {"success": True}

# ── Audit Logs ────────────────────────────────────────────────────────────────
@app.get("/api/audit-logs")
def list_audit_logs():
    rows = sb_select("audit_logs")
    return rows if rows is not None else _jread("audit_logs", [])

# ── Notifications ─────────────────────────────────────────────────────────────
@app.get("/api/notifications")
def list_notifications():
    rows = sb_select("notifications")
    return rows if rows is not None else _jread("notifications", [])

@app.put("/api/notifications/{notif_id}/read")
def mark_read(notif_id: str):
    result = sb_update("notifications", {"read": True}, {"id": notif_id})
    if result is None:
        notifs = _jread("notifications", [])
        for n in notifs:
            if n["id"] == notif_id: n["read"] = True
        _jwrite("notifications", notifs)
    return {"success": True}

@app.put("/api/notifications/read-all")
def mark_all_read():
    try:
        supabase.table("notifications").update({"read": True}).neq("read", True).execute()
    except:
        notifs = _jread("notifications", [])
        for n in notifs: n["read"] = True
        _jwrite("notifications", notifs)
    return {"success": True}

# ── Settings ──────────────────────────────────────────────────────────────────
@app.get("/api/settings")
def get_settings():
    rows = sb_select("settings")
    if rows:
        s = rows[0]
        # Normalise parent_channels from DB
        if isinstance(s.get("parent_channels"), str):
            try: s["parent_channels"] = json.loads(s["parent_channels"])
            except: s["parent_channels"] = DEFAULT_SETTINGS["parent_channels"]
        return {**DEFAULT_SETTINGS, **s}
    return DEFAULT_SETTINGS

@app.put("/api/settings")
def update_settings(data: dict):
    rows = sb_select("settings")
    if rows:
        sb_update("settings", {**data, "updated_at": datetime.now().isoformat()}, {"id": rows[0]["id"]})
    else:
        sb_insert("settings", data)
    return {"success": True, "settings": {**DEFAULT_SETTINGS, **data}}

# ── Recognition ───────────────────────────────────────────────────────────────

@app.post("/api/recognize")
async def recognize(images: list[UploadFile] = File(...)):
    if not images:
        raise HTTPException(status_code=400, detail="Upload at least one image.")

    if len(images) > 15:
        raise HTTPException(
            status_code=400,
            detail="Please upload no more than 15 classroom photos at once."
        )

    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    uploaded_paths = []
    combined = {}
    all_face_results = []
    total_faces = 0

    try:
        # Refresh active student embeddings before processing the session.
        reload_embeddings()

        if not pkl_students:
            raise HTTPException(
                status_code=400,
                detail="No active students with face embeddings are available."
            )

        for photo_number, image in enumerate(images, start=1):
            extension = os.path.splitext(image.filename or "")[1].lower()

            if extension not in allowed_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported image format: {image.filename}"
                )

            file_path = os.path.join(
                UPLOAD_FOLDER,
                f"{uuid.uuid4().hex}{extension}"
            )

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)

            uploaded_paths.append(file_path)

            result = recognize_faces(file_path)

            if result is None:
                raise HTTPException(
                    status_code=422,
                    detail=f"Could not read photo {photo_number}."
                )

            total_faces += result.get("total_faces", 0)

            # Keep face results separate by photo for review/debugging.
            for face in result.get("face_results", []):
                all_face_results.append({
                    **face,
                    "photo_number": photo_number
                })

            # Merge attendance using the unique recognition key.
            for attendance in result.get("attendance", []):
                key = attendance["student"]
                is_present = attendance["status"] == "Present"

                if key not in combined:
                    combined[key] = {
                        "present": False,
                        "best_similarity": 0.0
                    }

                if is_present:
                    combined[key]["present"] = True

                    matching_faces = [
                        face for face in result.get("face_results", [])
                        if face.get("name") == key
                    ]

                    best_for_photo = max(
                        (
                            float(face.get("similarity", 0.0))
                            for face in matching_faces
                        ),
                        default=0.0
                    )

                    combined[key]["best_similarity"] = max(
                        combined[key]["best_similarity"],
                        best_for_photo
                    )

        students_list = get_students()
        cfg = DEFAULT_SETTINGS

        high_t = cfg.get("ai_confidence_high_threshold", 90)
        med_t = cfg.get("ai_confidence_medium_threshold", 75)

        mapped = []

        for key, info in combined.items():
            # The key contains the student's name and roll number.
            name, roll_no, fallback_id = parse_key(key)

            sobj = next(
                (
                    student for student in students_list
                    if str(student.get("roll_no", "")) == str(roll_no)
                    or student.get("pkl_key") == key
                ),
                None
            )

            # A student is present if recognized in at least one photo.
            status = "Present" if info["present"] else "Absent"
            similarity = info["best_similarity"]
            confidence = round(similarity * 100, 1)

            tier = (
                "High Confidence" if confidence >= high_t
                else "Medium Confidence" if confidence >= med_t
                else "Needs Review"
            )

            mapped.append({
                "student_id": (
                    sobj.get("student_id") or sobj.get("id")
                    if sobj else fallback_id
                ),
                "student_name": sobj["name"] if sobj else name,
                "roll_no": sobj.get("roll_no", roll_no) if sobj else roll_no,
                "pkl_key": key,
                "status": status,
                "confidence": confidence,
                "tier": tier,
                "verification_status": "AI Generated",
                "similarity": similarity
            })

        return {
            "photos_processed": len(uploaded_paths),
            "total_faces": total_faces,
            "matched_faces": sum(
                1 for student in mapped
                if student["status"] == "Present"
            ),
            "students": mapped,
            "face_results": all_face_results
        }

    finally:
        # Remove temporary uploaded photos after processing.
        for path in uploaded_paths:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except OSError as exc:
                print(f"Could not remove temporary photo {path}: {exc}")

# ── Student Registration ──────────────────────────────────────────────────────
@app.post("/api/register-student")
async def register_student_faces(
    student_id: str = Form(...),
    images: list[UploadFile] = File(...),
):
    from registration import register_student

    if len(images) < 1 or len(images) > 10:
        raise HTTPException(
            status_code=400,
            detail="Please upload between 1 and 10 images."
        )

    os.makedirs("student_uploads", exist_ok=True)

    paths = []

    for index, image in enumerate(images):
        extension = os.path.splitext(image.filename)[1].lower()

        if extension not in [".jpg", ".jpeg", ".png", ".webp"]:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported image format: {extension}"
            )

        filename = f"{student_id}_{index}{extension}"
        file_path = os.path.join("student_uploads", filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        paths.append(file_path)

    return register_student(student_id, paths)

