"""
NeuroVision — Supabase Migration & Seed Script
Run once:  python migrate.py
Creates all missing tables and seeds initial data from the pkl dataset.
"""

import os
import sys
import pickle
import uuid
import numpy as np
from datetime import date, datetime
from supabase_client import supabase

# ── helpers ──────────────────────────────────────────────────────────────────

def info(msg):
    print(f"  ✓  {msg}")

def warn(msg):
    print(f"  ⚠  {msg}")

def run_sql(sql: str, label: str):
    """Execute raw SQL via Supabase's rpc/query endpoint."""
    try:
        supabase.rpc("run_sql", {"query": sql}).execute()
        info(label)
    except Exception as e:
        warn(f"{label} — {e}")

# ── 1. Create tables ─────────────────────────────────────────────────────────

print("\n═══ Step 1 — Creating missing tables ═══\n")

CREATE_TEACHERS = """
CREATE TABLE IF NOT EXISTS teachers (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    teacher_id    TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL,
    phone         TEXT,
    department    TEXT,
    designation   TEXT,
    avatar_url    TEXT,
    assigned_subjects  TEXT[],
    assigned_classes   TEXT[],
    assigned_divisions TEXT[],
    created_at    TIMESTAMPTZ DEFAULT now()
);
"""

CREATE_TIMETABLE = """
CREATE TABLE IF NOT EXISTS timetable (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    lecture_no    INTEGER,
    subject       TEXT NOT NULL,
    subject_code  TEXT,
    class_name    TEXT NOT NULL,
    division      TEXT NOT NULL,
    classroom     TEXT,
    teacher_id    TEXT,
    teacher_name  TEXT,
    day           TEXT,
    date          DATE,
    start_time    TEXT,
    end_time      TEXT,
    status        TEXT DEFAULT 'Scheduled',
    attendance_session_id TEXT,
    created_at    TIMESTAMPTZ DEFAULT now()
);
"""

CREATE_ATTENDANCE_SESSIONS = """
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id                   TEXT PRIMARY KEY,
    lecture_id           TEXT,
    subject              TEXT NOT NULL,
    class_name           TEXT NOT NULL,
    division             TEXT NOT NULL,
    classroom            TEXT,
    teacher_id           TEXT,
    teacher_name         TEXT,
    date                 DATE NOT NULL,
    time                 TEXT,
    total_students       INTEGER DEFAULT 0,
    present_count        INTEGER DEFAULT 0,
    absent_count         INTEGER DEFAULT 0,
    attendance_percentage NUMERIC(5,2) DEFAULT 0,
    is_locked            BOOLEAN DEFAULT true,
    locked_at            TIMESTAMPTZ DEFAULT now(),
    image_url            TEXT,
    geo_verification     JSONB,
    anomalies            TEXT[],
    created_at           TIMESTAMPTZ DEFAULT now()
);
"""

CREATE_ATTENDANCE_RECORDS = """
CREATE TABLE IF NOT EXISTS attendance_records (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id          TEXT NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id          TEXT NOT NULL,
    student_name        TEXT,
    roll_no             TEXT,
    class_name          TEXT,
    division            TEXT,
    status              TEXT NOT NULL,
    confidence_score    NUMERIC(5,2) DEFAULT 0,
    confidence_tier     TEXT,
    ai_result           TEXT,
    verification_status TEXT DEFAULT 'AI Generated',
    modified            BOOLEAN DEFAULT false,
    modification_reason TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
"""

CREATE_MODIFICATION_REQUESTS = """
CREATE TABLE IF NOT EXISTS modification_requests (
    id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    request_id       TEXT UNIQUE,
    session_id       TEXT,
    student_id       TEXT NOT NULL,
    student_name     TEXT,
    roll_no          TEXT,
    class_name       TEXT,
    division         TEXT,
    subject          TEXT,
    teacher_id       TEXT,
    teacher_name     TEXT,
    previous_status  TEXT,
    requested_status TEXT,
    reason           TEXT,
    date             DATE,
    time             TEXT,
    status           TEXT DEFAULT 'Pending',
    admin_comment    TEXT,
    reviewed_by      TEXT,
    reviewed_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT now()
);
"""

CREATE_AUDIT_LOGS = """
CREATE TABLE IF NOT EXISTS audit_logs (
    id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "user"           TEXT NOT NULL,
    role             TEXT NOT NULL,
    action           TEXT NOT NULL,
    affected_student TEXT,
    previous_value   TEXT,
    new_value        TEXT,
    reason           TEXT,
    date             DATE DEFAULT CURRENT_DATE,
    time             TEXT,
    ip_address       TEXT,
    created_at       TIMESTAMPTZ DEFAULT now()
);
"""

CREATE_NOTIFICATIONS = """
CREATE TABLE IF NOT EXISTS notifications (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type            TEXT NOT NULL,
    category        TEXT,
    title           TEXT NOT NULL,
    message         TEXT NOT NULL,
    recipient_type  TEXT,
    recipient_name  TEXT,
    channel         TEXT DEFAULT 'App',
    status          TEXT DEFAULT 'Unread',
    read            BOOLEAN DEFAULT false,
    timestamp       TEXT,
    student_name    TEXT,
    student_id      TEXT,
    details         JSONB,
    created_at      TIMESTAMPTZ DEFAULT now()
);
"""

CREATE_SETTINGS = """
CREATE TABLE IF NOT EXISTS settings (
    id                              SERIAL PRIMARY KEY,
    min_attendance_threshold        INTEGER DEFAULT 75,
    ai_confidence_high_threshold    INTEGER DEFAULT 90,
    ai_confidence_medium_threshold  INTEGER DEFAULT 75,
    academic_year                   TEXT DEFAULT '2026-2027 (Odd Semester)',
    college_name                    TEXT DEFAULT 'Imperial Institute of Technology & Engineering',
    college_code                    TEXT DEFAULT 'IIT-ENG-304',
    department                      TEXT DEFAULT 'Department of Computer Engineering',
    allow_offline_sync              BOOLEAN DEFAULT true,
    enable_parent_notifications     BOOLEAN DEFAULT true,
    parent_channels                 JSONB DEFAULT '{"whatsapp":true,"sms":true,"email":true,"app":true}',
    anomaly_sensitivity             TEXT DEFAULT 'Medium',
    updated_at                      TIMESTAMPTZ DEFAULT now()
);
"""

# Add extra columns to existing students table if missing
ALTER_STUDENTS = """
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='student_id') THEN
        ALTER TABLE students ADD COLUMN student_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='pkl_key') THEN
        ALTER TABLE students ADD COLUMN pkl_key TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='class_id') THEN
        ALTER TABLE students ADD COLUMN class_id TEXT DEFAULT 'TE Computer';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='division') THEN
        ALTER TABLE students ADD COLUMN division TEXT DEFAULT 'C';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='email') THEN
        ALTER TABLE students ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='phone') THEN
        ALTER TABLE students ADD COLUMN phone TEXT DEFAULT 'N/A';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='avatar_url') THEN
        ALTER TABLE students ADD COLUMN avatar_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='status') THEN
        ALTER TABLE students ADD COLUMN status TEXT DEFAULT 'Active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='parent_name') THEN
        ALTER TABLE students ADD COLUMN parent_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='parent_phone') THEN
        ALTER TABLE students ADD COLUMN parent_phone TEXT DEFAULT 'N/A';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='parent_email') THEN
        ALTER TABLE students ADD COLUMN parent_email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='parent_pref') THEN
        ALTER TABLE students ADD COLUMN parent_pref TEXT DEFAULT 'WhatsApp';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='overall_attendance') THEN
        ALTER TABLE students ADD COLUMN overall_attendance NUMERIC(5,2) DEFAULT 85;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='subject_attendance') THEN
        ALTER TABLE students ADD COLUMN subject_attendance JSONB DEFAULT '{}';
    END IF;
END $$;
"""

# Try creating tables via raw SQL using Supabase's pg function if available,
# otherwise fall back to direct insert-based detection
def safe_create(sql, label):
    try:
        result = supabase.rpc("exec_sql", {"sql": sql}).execute()
        info(label)
    except Exception as e1:
        # Try alternative RPC name
        try:
            result = supabase.rpc("run_sql", {"query": sql}).execute()
            info(label)
        except Exception as e2:
            warn(f"{label} — SQL RPC unavailable ({e2}). Will use direct API fallback.")

safe_create(ALTER_STUDENTS,              "students table — columns extended")
safe_create(CREATE_TEACHERS,             "teachers table")
safe_create(CREATE_TIMETABLE,            "timetable table")
safe_create(CREATE_ATTENDANCE_SESSIONS,  "attendance_sessions table")
safe_create(CREATE_ATTENDANCE_RECORDS,   "attendance_records table")
safe_create(CREATE_MODIFICATION_REQUESTS,"modification_requests table")
safe_create(CREATE_AUDIT_LOGS,           "audit_logs table")
safe_create(CREATE_NOTIFICATIONS,        "notifications table")
safe_create(CREATE_SETTINGS,             "settings table")

# ── 2. Parse pkl key helper ──────────────────────────────────────────────────

def parse_key(key: str):
    parts = key.split("_")
    roll_no    = parts[-1]
    name       = " ".join(parts[:-1])
    student_id = f"ST{roll_no.zfill(3)}"
    return name, roll_no, student_id

# ── 3. Sync students from pkl ────────────────────────────────────────────────

print("\n═══ Step 2 — Syncing students from pkl ═══\n")

pkl_path = os.path.join(os.path.dirname(__file__), "../embeddings/students.pkl")
if not os.path.exists(pkl_path):
    pkl_path = "../embeddings/students.pkl"

with open(pkl_path, "rb") as f:
    pkl_students = pickle.load(f)

existing_students = supabase.table("students").select("roll_no, name").execute().data
existing_roll_nos = {s["roll_no"] for s in existing_students}

for pkl_key, embeddings in pkl_students.items():
    name, roll_no, student_id = parse_key(pkl_key)

    if roll_no in existing_roll_nos:
        # Update with extra fields
        supabase.table("students").update({
            "student_id": student_id,
            "pkl_key":    pkl_key,
            "class_id":   "TE Computer",
            "division":   "C",
            "email":      f"{name.lower().replace(' ', '.')}@college.edu",
            "avatar_url": f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=6366f1&color=fff&size=128",
            "parent_name":  f"Parent of {name}",
            "parent_email": f"parent.{name.lower().replace(' ', '.')}@gmail.com",
            "subject_attendance": {"DBMS": 85, "Operating Systems": 80, "Computer Networks": 78, "Machine Learning": 88},
            "overall_attendance": 85,
        }).eq("roll_no", roll_no).execute()
        info(f"Updated student: {name} (Roll {roll_no})")
    else:
        supabase.table("students").insert({
            "name":       name,
            "roll_no":    roll_no,
            "student_id": student_id,
            "pkl_key":    pkl_key,
            "class_id":   "TE Computer",
            "division":   "C",
            "email":      f"{name.lower().replace(' ', '.')}@college.edu",
            "phone":      "N/A",
            "avatar_url": f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=6366f1&color=fff&size=128",
            "status":     "Active",
            "parent_name":  f"Parent of {name}",
            "parent_phone": "N/A",
            "parent_email": f"parent.{name.lower().replace(' ', '.')}@gmail.com",
            "parent_pref":  "WhatsApp",
            "overall_attendance": 85,
            "subject_attendance": {"DBMS": 85, "Operating Systems": 80, "Computer Networks": 78, "Machine Learning": 88},
        }).execute()
        info(f"Inserted student: {name} (Roll {roll_no})")

# ── 4. Seed teachers ─────────────────────────────────────────────────────────

print("\n═══ Step 3 — Seeding teachers ═══\n")

def seed_teachers():
    try:
        existing = supabase.table("teachers").select("teacher_id").execute().data
        existing_ids = {t["teacher_id"] for t in existing}
    except:
        existing_ids = set()

    teachers = [
        {
            "id": "T001", "teacher_id": "T001",
            "name": "Prof. Ramesh Sharma",
            "email": "ramesh.sharma@college.edu",
            "phone": "9876543210",
            "department": "Computer Engineering",
            "designation": "Associate Professor",
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
            "assigned_subjects": ["DBMS", "Operating Systems"],
            "assigned_classes": ["TE Computer"],
            "assigned_divisions": ["C"],
        },
        {
            "id": "T002", "teacher_id": "T002",
            "name": "Dr. Priya Mehta",
            "email": "priya.mehta@college.edu",
            "phone": "9876543211",
            "department": "Computer Engineering",
            "designation": "Assistant Professor",
            "avatar_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80",
            "assigned_subjects": ["Computer Networks", "Machine Learning"],
            "assigned_classes": ["TE Computer"],
            "assigned_divisions": ["C"],
        },
    ]
    for t in teachers:
        if t["teacher_id"] not in existing_ids:
            supabase.table("teachers").insert(t).execute()
            info(f"Inserted teacher: {t['name']}")
        else:
            info(f"Teacher already exists: {t['name']}")

try:
    seed_teachers()
except Exception as e:
    warn(f"Teachers seeding failed — table may not exist yet. Run SQL manually. ({e})")

# ── 5. Seed timetable ────────────────────────────────────────────────────────

print("\n═══ Step 4 — Seeding timetable ═══\n")

def seed_timetable():
    try:
        existing = supabase.table("timetable").select("id").execute().data
        if existing:
            info(f"Timetable already has {len(existing)} rows, skipping seed.")
            return
    except:
        pass

    today = date.today().isoformat()
    slots = [
        {
            "id": "LEC-001", "lecture_no": 24,
            "subject": "DBMS", "subject_code": "CS401",
            "class_name": "TE Computer", "division": "C",
            "classroom": "Smart Lab 304",
            "teacher_id": "T001", "teacher_name": "Prof. Ramesh Sharma",
            "day": "Tuesday", "date": today,
            "start_time": "10:00 AM", "end_time": "11:00 AM",
            "status": "Scheduled",
        },
        {
            "id": "LEC-002", "lecture_no": 18,
            "subject": "Operating Systems", "subject_code": "CS402",
            "class_name": "TE Computer", "division": "C",
            "classroom": "Room 201",
            "teacher_id": "T001", "teacher_name": "Prof. Ramesh Sharma",
            "day": "Tuesday", "date": today,
            "start_time": "11:00 AM", "end_time": "12:00 PM",
            "status": "Scheduled",
        },
        {
            "id": "LEC-003", "lecture_no": 12,
            "subject": "Computer Networks", "subject_code": "CS403",
            "class_name": "TE Computer", "division": "C",
            "classroom": "Lab 102",
            "teacher_id": "T002", "teacher_name": "Dr. Priya Mehta",
            "day": "Tuesday", "date": today,
            "start_time": "2:00 PM", "end_time": "3:00 PM",
            "status": "Scheduled",
        },
    ]
    for slot in slots:
        supabase.table("timetable").insert(slot).execute()
        info(f"Inserted timetable slot: {slot['subject']} at {slot['start_time']}")

try:
    seed_timetable()
except Exception as e:
    warn(f"Timetable seeding failed — table may not exist yet. ({e})")

# ── 6. Seed settings ─────────────────────────────────────────────────────────

print("\n═══ Step 5 — Seeding settings ═══\n")

def seed_settings():
    try:
        existing = supabase.table("settings").select("id").execute().data
        if existing:
            info(f"Settings row already exists (id={existing[0]['id']}), skipping.")
            return
    except:
        pass

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
    info("Settings row inserted.")

try:
    seed_settings()
except Exception as e:
    warn(f"Settings seeding failed — table may not exist yet. ({e})")

print("\n═══════════════════════════════════════════")
print("  Migration complete.")
print("  NOTE: If tables still don't exist, run the")
print("  SQL in supabase_schema.sql manually in the")
print("  Supabase Dashboard → SQL Editor.")
print("═══════════════════════════════════════════\n")
