"""
NeuroVision — Seed Script
Run AFTER applying supabase_schema.sql in the Supabase Dashboard.

Usage:
    cd backend
    python seed.py
"""
import os, pickle, json, numpy as np
from datetime import date
from supabase_client import supabase

def ok(msg):  print(f"  ✓  {msg}")
def skip(msg):print(f"  –  {msg}")
def err(msg): print(f"  ✗  {msg}")

# ── helpers ───────────────────────────────────────────────────────────────────
def parse_key(key):
    parts   = key.split("_")
    roll_no = parts[-1]
    name    = " ".join(parts[:-1])
    sid     = f"ST{roll_no.zfill(3)}"
    return name, roll_no, sid

# ── load pkl ──────────────────────────────────────────────────────────────────
pkl_path = os.path.join(os.path.dirname(__file__), "../embeddings/students.pkl")
if not os.path.exists(pkl_path):
    pkl_path = "../embeddings/students.pkl"
with open(pkl_path, "rb") as f:
    pkl_students = pickle.load(f)

print(f"\n══════════════════════════════════════════")
print(f"  NeuroVision Seed — {len(pkl_students)} students in pkl")
print(f"══════════════════════════════════════════\n")

# ── 1. Students ───────────────────────────────────────────────────────────────
print("── 1. Students ──")
existing = supabase.table("students").select("roll_no").execute().data
existing_rolls = {str(s["roll_no"]) for s in existing}

for key, embeddings in pkl_students.items():
    name, roll_no, sid = parse_key(key)
    subj_att = {"DBMS": 85, "Operating Systems": 80, "Computer Networks": 78, "Machine Learning": 88}
    payload = {
        "name":       name,
        "roll_no":    roll_no,
        "student_id": sid,
        "pkl_key":    key,
        "class_id":   "TE Computer",
        "division":   "C",
        "email":      f"{name.lower().replace(' ', '.')}@college.edu",
        "phone":      "N/A",
        "avatar_url": f"https://ui-avatars.com/api/?name={name.replace(' ','+')}&background=6366f1&color=fff&size=128",
        "status":     "Active",
        "parent_name":  f"Parent of {name}",
        "parent_phone": "N/A",
        "parent_email": f"parent.{name.lower().replace(' ','.')}@gmail.com",
        "parent_pref":  "WhatsApp",
        "overall_attendance":  85,
        "subject_attendance":  subj_att,
    }
    if roll_no in existing_rolls:
        supabase.table("students").update(payload).eq("roll_no", roll_no).execute()
        ok(f"Updated  {name}  (roll {roll_no})")
    else:
        supabase.table("students").insert(payload).execute()
        ok(f"Inserted {name}  (roll {roll_no})")

# ── 2. Face embeddings (upsert from pkl) ──────────────────────────────────────
print("\n── 2. Face embeddings ──")
for key, embeddings in pkl_students.items():
    name, roll_no, sid = parse_key(key)
    # Get the student db id
    rows = supabase.table("students").select("id").eq("roll_no", roll_no).execute().data
    if not rows:
        err(f"Student not found for roll {roll_no}"); continue
    db_id = rows[0]["id"]
    # Remove old embeddings for this student and re-insert
    supabase.table("face_embeddings").delete().eq("student_id", db_id).execute()
    for emb in embeddings:
        emb_norm = emb / np.linalg.norm(emb)
        supabase.table("face_embeddings").insert({
            "student_id": db_id,
            "embedding":  emb_norm.tolist(),
        }).execute()
    ok(f"Embeddings for {name}: {len(embeddings)} vectors")

# ── 3. Teachers ───────────────────────────────────────────────────────────────
print("\n── 3. Teachers ──")
teachers = [
    {
        "id": "T001", "teacher_id": "T001",
        "name": "Prof. Ramesh Sharma", "email": "ramesh.sharma@college.edu",
        "phone": "9876543210", "department": "Computer Engineering",
        "designation": "Associate Professor",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
        "assigned_subjects": ["DBMS", "Operating Systems"],
        "assigned_classes": ["TE Computer"], "assigned_divisions": ["C"],
    },
    {
        "id": "T002", "teacher_id": "T002",
        "name": "Dr. Priya Mehta", "email": "priya.mehta@college.edu",
        "phone": "9876543211", "department": "Computer Engineering",
        "designation": "Assistant Professor",
        "avatar_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80",
        "assigned_subjects": ["Computer Networks", "Machine Learning"],
        "assigned_classes": ["TE Computer"], "assigned_divisions": ["C"],
    },
]
existing_t = {t["teacher_id"] for t in supabase.table("teachers").select("teacher_id").execute().data}
for t in teachers:
    if t["teacher_id"] in existing_t:
        skip(f"Teacher already exists: {t['name']}")
    else:
        supabase.table("teachers").insert(t).execute()
        ok(f"Inserted teacher: {t['name']}")

# ── 4. Timetable ──────────────────────────────────────────────────────────────
print("\n── 4. Timetable ──")
today = date.today().isoformat()
slots = [
    {"id":"LEC-001","lecture_no":24,"subject":"DBMS","subject_code":"CS401","class_name":"TE Computer","division":"C","classroom":"Smart Lab 304","teacher_id":"T001","teacher_name":"Prof. Ramesh Sharma","day":"Tuesday","date":today,"start_time":"10:00 AM","end_time":"11:00 AM","status":"Scheduled"},
    {"id":"LEC-002","lecture_no":18,"subject":"Operating Systems","subject_code":"CS402","class_name":"TE Computer","division":"C","classroom":"Room 201","teacher_id":"T001","teacher_name":"Prof. Ramesh Sharma","day":"Tuesday","date":today,"start_time":"11:00 AM","end_time":"12:00 PM","status":"Scheduled"},
    {"id":"LEC-003","lecture_no":12,"subject":"Computer Networks","subject_code":"CS403","class_name":"TE Computer","division":"C","classroom":"Lab 102","teacher_id":"T002","teacher_name":"Dr. Priya Mehta","day":"Tuesday","date":today,"start_time":"2:00 PM","end_time":"3:00 PM","status":"Scheduled"},
]
existing_tt = {t["id"] for t in supabase.table("timetable").select("id").execute().data}
for s in slots:
    if s["id"] in existing_tt:
        skip(f"Timetable slot already exists: {s['subject']}")
    else:
        supabase.table("timetable").insert(s).execute()
        ok(f"Inserted slot: {s['subject']} at {s['start_time']}")

# ── 5. Settings ───────────────────────────────────────────────────────────────
print("\n── 5. Settings ──")
existing_s = supabase.table("settings").select("id").execute().data
if existing_s:
    skip("Settings row already exists")
else:
    supabase.table("settings").insert({
        "min_attendance_threshold": 75,
        "ai_confidence_high_threshold": 90,
        "ai_confidence_medium_threshold": 75,
        "academic_year": "2026-2027 (Odd Semester)",
        "college_name": "Imperial Institute of Technology & Engineering",
        "college_code": "IIT-ENG-304",
        "department": "Department of Computer Engineering",
        "allow_offline_sync": True,
        "enable_parent_notifications": True,
        "parent_channels": {"whatsapp": True, "sms": True, "email": True, "app": True},
        "anomaly_sensitivity": "Medium",
    }).execute()
    ok("Settings row inserted")

print("\n══════════════════════════════════════════")
print("  Seed complete!")
print("══════════════════════════════════════════\n")
