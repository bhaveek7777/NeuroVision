-- ═══════════════════════════════════════════════════════════════════
-- NeuroVision — Full Supabase Schema
-- Paste this ENTIRE file into:
--   Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════

-- 1. Students (create fresh with all columns)
CREATE TABLE IF NOT EXISTS public.students (
    id                  BIGSERIAL PRIMARY KEY,
    name                TEXT NOT NULL,
    roll_no             TEXT,
    student_id          TEXT,
    pkl_key             TEXT,
    class_id            TEXT        DEFAULT 'TE Computer',
    division            TEXT        DEFAULT 'C',
    email               TEXT,
    phone               TEXT        DEFAULT 'N/A',
    avatar_url          TEXT,
    status              TEXT        DEFAULT 'Active',
    parent_name         TEXT,
    parent_phone        TEXT        DEFAULT 'N/A',
    parent_email        TEXT,
    parent_pref         TEXT        DEFAULT 'WhatsApp',
    overall_attendance  NUMERIC(5,2) DEFAULT 85,
    subject_attendance  JSONB        DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ  DEFAULT now()
);

-- 2. Face Embeddings
CREATE TABLE IF NOT EXISTS public.face_embeddings (
    id          BIGSERIAL PRIMARY KEY,
    student_id  BIGINT REFERENCES public.students(id) ON DELETE CASCADE,
    embedding   FLOAT8[],
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. Teachers
CREATE TABLE IF NOT EXISTS public.teachers (
    id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    teacher_id         TEXT UNIQUE NOT NULL,
    name               TEXT NOT NULL,
    email              TEXT NOT NULL,
    phone              TEXT,
    department         TEXT,
    designation        TEXT,
    avatar_url         TEXT,
    assigned_subjects  TEXT[],
    assigned_classes   TEXT[],
    assigned_divisions TEXT[],
    created_at         TIMESTAMPTZ DEFAULT now()
);

-- 4. Timetable
CREATE TABLE IF NOT EXISTS public.timetable (
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

-- 5. Attendance Sessions
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id                    TEXT PRIMARY KEY,
    lecture_id            TEXT,
    subject               TEXT NOT NULL,
    class_name            TEXT NOT NULL,
    division              TEXT NOT NULL,
    classroom             TEXT,
    teacher_id            TEXT,
    teacher_name          TEXT,
    date                  DATE NOT NULL,
    time                  TEXT,
    total_students        INTEGER      DEFAULT 0,
    present_count         INTEGER      DEFAULT 0,
    absent_count          INTEGER      DEFAULT 0,
    attendance_percentage NUMERIC(5,2) DEFAULT 0,
    is_locked             BOOLEAN      DEFAULT true,
    locked_at             TIMESTAMPTZ  DEFAULT now(),
    image_url             TEXT,
    geo_verification      JSONB,
    anomalies             TEXT[],
    created_at            TIMESTAMPTZ  DEFAULT now()
);

-- 6. Attendance Records
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id          TEXT NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    student_id          TEXT NOT NULL,
    student_name        TEXT,
    roll_no             TEXT,
    class_name          TEXT,
    division            TEXT,
    status              TEXT NOT NULL,
    confidence_score    NUMERIC(5,2) DEFAULT 0,
    confidence_tier     TEXT,
    ai_result           TEXT,
    verification_status TEXT    DEFAULT 'AI Generated',
    modified            BOOLEAN DEFAULT false,
    modification_reason TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- 7. Modification Requests
CREATE TABLE IF NOT EXISTS public.modification_requests (
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

-- 8. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "user"           TEXT NOT NULL,
    role             TEXT NOT NULL,
    action           TEXT NOT NULL,
    affected_student TEXT,
    previous_value   TEXT,
    new_value        TEXT,
    reason           TEXT,
    date             DATE        DEFAULT CURRENT_DATE,
    time             TEXT,
    ip_address       TEXT,
    created_at       TIMESTAMPTZ DEFAULT now()
);

-- 9. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type           TEXT NOT NULL,
    category       TEXT,
    title          TEXT NOT NULL,
    message        TEXT NOT NULL,
    recipient_type TEXT,
    recipient_name TEXT,
    channel        TEXT    DEFAULT 'App',
    status         TEXT    DEFAULT 'Unread',
    read           BOOLEAN DEFAULT false,
    timestamp      TEXT,
    student_name   TEXT,
    student_id     TEXT,
    details        JSONB,
    created_at     TIMESTAMPTZ DEFAULT now()
);

-- 10. Settings (single row)
CREATE TABLE IF NOT EXISTS public.settings (
    id                             SERIAL PRIMARY KEY,
    min_attendance_threshold       INTEGER DEFAULT 75,
    ai_confidence_high_threshold   INTEGER DEFAULT 90,
    ai_confidence_medium_threshold INTEGER DEFAULT 75,
    academic_year                  TEXT    DEFAULT '2026-2027 (Odd Semester)',
    college_name                   TEXT    DEFAULT 'Imperial Institute of Technology & Engineering',
    college_code                   TEXT    DEFAULT 'IIT-ENG-304',
    department                     TEXT    DEFAULT 'Department of Computer Engineering',
    allow_offline_sync             BOOLEAN DEFAULT true,
    enable_parent_notifications    BOOLEAN DEFAULT true,
    parent_channels                JSONB   DEFAULT '{"whatsapp":true,"sms":true,"email":true,"app":true}',
    anomaly_sensitivity            TEXT    DEFAULT 'Medium',
    updated_at                     TIMESTAMPTZ DEFAULT now()
);

-- 11. Disable RLS on all tables (dev mode)
ALTER TABLE public.students              DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_embeddings       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers              DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.modification_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings              DISABLE ROW LEVEL SECURITY;

-- ── User Profiles (linked to Supabase Auth users) ────────────────────────────
-- Run this in Supabase Dashboard → SQL Editor
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email         TEXT NOT NULL,
    name          TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'Teacher',   -- 'Teacher' | 'Admin'
    designation   TEXT,
    department    TEXT,
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Auto-create a profile row when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Teacher')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
