-- ============================================================
-- ATTENDANCE MANAGEMENT SYSTEM - COMPLETE SUPABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- 2. DEPARTMENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. CLASSES (Year level, e.g. TYIT, SYIT)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,          -- e.g. "TYIT", "SYIT"
  year INT NOT NULL,           -- 1,2,3,4
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, department_id)
);

-- ─────────────────────────────────────────────
-- 4. DIVISIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS divisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,          -- e.g. "A", "B"
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, class_id)
);

-- ─────────────────────────────────────────────
-- 5. SUBJECTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 6. TEACHERS (profile data, linked to auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  teacher_id_code TEXT NOT NULL UNIQUE,  -- e.g. "TCH001"
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  designation TEXT DEFAULT 'Assistant Professor',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 7. TEACHER → SUBJECT → DIVISION ASSIGNMENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, subject_id, division_id)
);

-- ─────────────────────────────────────────────
-- 8. STUDENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id_code TEXT NOT NULL UNIQUE,  -- e.g. "STU001"
  name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  email TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  face_embedding JSONB,   -- store float array as JSON, NOT raw image
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 9. STUDENT ↔ DIVISION ENROLLMENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL DEFAULT '2026-27',
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, division_id, academic_year)
);

-- ─────────────────────────────────────────────
-- 10. TIMETABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timetable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week TEXT NOT NULL CHECK (day_of_week IN
    ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
  room TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(day_of_week, start_time, division_id)
);

-- ─────────────────────────────────────────────
-- 11. ATTENDANCE SESSIONS (one per lecture)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timetable_id UUID REFERENCES timetable(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_locked BOOLEAN DEFAULT FALSE,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, subject_id, division_id, date, start_time)
);

-- ─────────────────────────────────────────────
-- 12. ATTENDANCE RECORDS (per student per session)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present','absent','late')),
  marked_by TEXT DEFAULT 'manual',  -- 'manual' or 'face_recognition'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- ─────────────────────────────────────────────
-- 13. SYSTEM SETTINGS (attendance cutoff, etc.)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default attendance cutoff
INSERT INTO system_settings (key, value)
VALUES ('attendance_cutoff', '75')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────
-- 14. USER ROLES TABLE (maps auth.users → role)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin','teacher')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 15. UPDATED_AT TRIGGER for attendance_records
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attendance_records_updated_at
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- 16. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE departments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE students                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable                ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records       ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles               ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current user's teacher id
CREATE OR REPLACE FUNCTION get_my_teacher_id()
RETURNS UUID AS $$
  SELECT id FROM teachers WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── DEPARTMENTS ──
CREATE POLICY "Admin full access departments"
  ON departments FOR ALL
  USING (get_my_role() = 'admin');
CREATE POLICY "Anyone read departments"
  ON departments FOR SELECT
  USING (auth.role() = 'authenticated');

-- ── CLASSES ──
CREATE POLICY "Admin full access classes"
  ON classes FOR ALL
  USING (get_my_role() = 'admin');
CREATE POLICY "Anyone read classes"
  ON classes FOR SELECT
  USING (auth.role() = 'authenticated');

-- ── DIVISIONS ──
CREATE POLICY "Admin full access divisions"
  ON divisions FOR ALL
  USING (get_my_role() = 'admin');
CREATE POLICY "Anyone read divisions"
  ON divisions FOR SELECT
  USING (auth.role() = 'authenticated');

-- ── SUBJECTS ──
CREATE POLICY "Admin full access subjects"
  ON subjects FOR ALL
  USING (get_my_role() = 'admin');
CREATE POLICY "Anyone read subjects"
  ON subjects FOR SELECT
  USING (auth.role() = 'authenticated');

-- ── TEACHERS ──
CREATE POLICY "Admin full access teachers"
  ON teachers FOR ALL
  USING (get_my_role() = 'admin');
CREATE POLICY "Teacher reads own record"
  ON teachers FOR SELECT
  USING (user_id = auth.uid());

-- ── TEACHER ASSIGNMENTS ──
CREATE POLICY "Admin full access teacher_assignments"
  ON teacher_assignments FOR ALL
  USING (get_my_role() = 'admin');
CREATE POLICY "Teacher reads own assignments"
  ON teacher_assignments FOR SELECT
  USING (teacher_id = get_my_teacher_id());

-- ── STUDENTS ──
CREATE POLICY "Admin full access students"
  ON students FOR ALL
  USING (get_my_role() = 'admin');
CREATE POLICY "Teacher reads students"
  ON students FOR SELECT
  USING (get_my_role() IN ('admin','teacher'));

-- ── STUDENT ENROLLMENTS ──
CREATE POLICY "Admin full access enrollments"
  ON student_enrollments FOR ALL
  USING (get_my_role() = 'admin');
CREATE POLICY "Teacher reads enrollments"
  ON student_enrollments FOR SELECT
  USING (get_my_role() IN ('admin','teacher'));

-- ── TIMETABLE ──
CREATE POLICY "Admin full access timetable"
  ON timetable FOR ALL
  USING (get_my_role() = 'admin');
CREATE POLICY "Anyone reads timetable"
  ON timetable FOR SELECT
  USING (auth.role() = 'authenticated');

-- ── ATTENDANCE SESSIONS ──
CREATE POLICY "Admin full access sessions"
  ON attendance_sessions FOR ALL
  USING (get_my_role() = 'admin');
CREATE POLICY "Teacher manages own sessions"
  ON attendance_sessions FOR ALL
  USING (teacher_id = get_my_teacher_id());
CREATE POLICY "Teacher reads all sessions"
  ON attendance_sessions FOR SELECT
  USING (get_my_role() = 'teacher');

-- ── ATTENDANCE RECORDS ──
CREATE POLICY "Admin full access records"
  ON attendance_records FOR ALL
  USING (get_my_role() = 'admin');
CREATE POLICY "Teacher manages records for own sessions"
  ON attendance_records FOR ALL
  USING (
    session_id IN (
      SELECT id FROM attendance_sessions
      WHERE teacher_id = get_my_teacher_id()
    )
  );

-- ── SYSTEM SETTINGS ──
CREATE POLICY "Admin full access settings"
  ON system_settings FOR ALL
  USING (get_my_role() = 'admin');
CREATE POLICY "Anyone reads settings"
  ON system_settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- ── USER ROLES ──
CREATE POLICY "Admin manages roles"
  ON user_roles FOR ALL
  USING (get_my_role() = 'admin');
CREATE POLICY "User reads own role"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- 17. CREATE INITIAL ADMIN USER
-- ─────────────────────────────────────────────
-- After running this schema, create an admin user via Supabase Auth
-- (Dashboard → Authentication → Users → Add User)
-- Then run this to assign admin role (replace the UUID with the actual user UUID):
--
-- INSERT INTO user_roles (user_id, role)
-- VALUES ('YOUR-ADMIN-USER-UUID-HERE', 'admin');
--
-- For teacher users: create via Auth, then:
-- 1. INSERT INTO teachers (user_id, teacher_id_code, name, email, ...) VALUES (...)
-- 2. INSERT INTO user_roles (user_id, role) VALUES (teacher_user_id, 'teacher')

-- ─────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────
