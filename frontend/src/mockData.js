// ================================================================
// MOCK DATA — realistic demo data for all tables
// ================================================================

export const MOCK_DEPARTMENTS = [
  { id: "dept-1", name: "Information Technology", code: "IT", created_at: "2026-01-01" },
  { id: "dept-2", name: "Computer Engineering",   code: "CE", created_at: "2026-01-01" },
];

export const MOCK_CLASSES = [
  { id: "cls-1", name: "TYIT", year: 3, department_id: "dept-1", departments: { name: "Information Technology" } },
  { id: "cls-2", name: "SYIT", year: 2, department_id: "dept-1", departments: { name: "Information Technology" } },
  { id: "cls-3", name: "TYCE", year: 3, department_id: "dept-2", departments: { name: "Computer Engineering" } },
];

export const MOCK_DIVISIONS = [
  { id: "div-1", name: "A", class_id: "cls-1", classes: { name: "TYIT", departments: { name: "Information Technology" } } },
  { id: "div-2", name: "B", class_id: "cls-1", classes: { name: "TYIT", departments: { name: "Information Technology" } } },
  { id: "div-3", name: "A", class_id: "cls-2", classes: { name: "SYIT", departments: { name: "Information Technology" } } },
  { id: "div-4", name: "A", class_id: "cls-3", classes: { name: "TYCE", departments: { name: "Computer Engineering" } } },
];

export const MOCK_SUBJECTS = [
  { id: "sub-1", name: "Database Management System", code: "DBMS", department_id: "dept-1", departments: { name: "Information Technology" } },
  { id: "sub-2", name: "Operating Systems",          code: "OS",   department_id: "dept-1", departments: { name: "Information Technology" } },
  { id: "sub-3", name: "Machine Learning",           code: "ML",   department_id: "dept-1", departments: { name: "Information Technology" } },
  { id: "sub-4", name: "Computer Networks",          code: "CN",   department_id: "dept-1", departments: { name: "Information Technology" } },
  { id: "sub-5", name: "Data Structures",            code: "DS",   department_id: "dept-2", departments: { name: "Computer Engineering" } },
];

export const MOCK_TEACHERS = [
  {
    id: "tch-1", user_id: "user-teacher-1",
    teacher_id_code: "TCH001", name: "Ms. Poonam Patil",
    email: "poonam@college.edu", phone: "9876543210",
    department_id: "dept-1", designation: "Assistant Professor",
    is_active: true, departments: { name: "Information Technology" },
  },
  {
    id: "tch-2", user_id: "user-teacher-2",
    teacher_id_code: "TCH002", name: "Ms. Swapnali Jagtap",
    email: "swapnali@college.edu", phone: "9876543211",
    department_id: "dept-1", designation: "Associate Professor",
    is_active: true, departments: { name: "Information Technology" },
  },
  {
    id: "tch-3", user_id: "user-teacher-3",
    teacher_id_code: "TCH003", name: "Ms. Ashwini Jadhav",
    email: "ashwini@college.edu", phone: "9876543212",
    department_id: "dept-2", designation: "Assistant Professor",
    is_active: true, departments: { name: "Computer Engineering" },
  },
];

export const MOCK_TEACHER_ASSIGNMENTS = [
  { id: "ta-1", teacher_id: "tch-1", subject_id: "sub-1", division_id: "div-1", subjects: { name: "Database Management System" }, divisions: { name: "A", classes: { name: "TYIT" } } },
  { id: "ta-2", teacher_id: "tch-1", subject_id: "sub-2", division_id: "div-2", subjects: { name: "Operating Systems" },          divisions: { name: "B", classes: { name: "TYIT" } } },
  { id: "ta-3", teacher_id: "tch-2", subject_id: "sub-3", division_id: "div-1", subjects: { name: "Machine Learning" },            divisions: { name: "A", classes: { name: "TYIT" } } },
  { id: "ta-4", teacher_id: "tch-2", subject_id: "sub-4", division_id: "div-1", subjects: { name: "Computer Networks" },           divisions: { name: "A", classes: { name: "TYIT" } } },
  { id: "ta-5", teacher_id: "tch-3", subject_id: "sub-5", division_id: "div-4", subjects: { name: "Data Structures" },             divisions: { name: "A", classes: { name: "TYCE" } } },
];

export const MOCK_STUDENTS = [
  { id: "stu-1", student_id_code: "STU001", name: "Lalit Thakare",    roll_number: "01", email: "lalit@college.edu",    department_id: "dept-1", is_active: true, face_embedding: [0.1, 0.2], departments: { name: "Information Technology" }, student_enrollments: [{ division_id: "div-1", divisions: { name: "A", classes: { name: "TYIT" } } }] },
  { id: "stu-2", student_id_code: "STU002", name: "Pratiksha Shelke", roll_number: "02", email: "pratiksha@college.edu", department_id: "dept-1", is_active: true, face_embedding: [0.3, 0.4], departments: { name: "Information Technology" }, student_enrollments: [{ division_id: "div-1", divisions: { name: "A", classes: { name: "TYIT" } } }] },
  { id: "stu-3", student_id_code: "STU003", name: "Shreya Yeole",     roll_number: "03", email: "shreya@college.edu",    department_id: "dept-1", is_active: true, face_embedding: null,       departments: { name: "Information Technology" }, student_enrollments: [{ division_id: "div-1", divisions: { name: "A", classes: { name: "TYIT" } } }] },
  { id: "stu-4", student_id_code: "STU004", name: "Bhaveek Thakare",  roll_number: "04", email: "bhaveek@college.edu",   department_id: "dept-1", is_active: true, face_embedding: null,       departments: { name: "Information Technology" }, student_enrollments: [{ division_id: "div-1", divisions: { name: "A", classes: { name: "TYIT" } } }] },
  { id: "stu-5", student_id_code: "STU005", name: "Rahul Patil",      roll_number: "05", email: "rahul@college.edu",     department_id: "dept-1", is_active: true, face_embedding: null,       departments: { name: "Information Technology" }, student_enrollments: [{ division_id: "div-2", divisions: { name: "B", classes: { name: "TYIT" } } }] },
  { id: "stu-6", student_id_code: "STU006", name: "Pooja Desai",      roll_number: "06", email: "pooja@college.edu",     department_id: "dept-1", is_active: true, face_embedding: null,       departments: { name: "Information Technology" }, student_enrollments: [{ division_id: "div-2", divisions: { name: "B", classes: { name: "TYIT" } } }] },
];

export const MOCK_STUDENT_ENROLLMENTS = [
  { id: "en-1", student_id: "stu-1", division_id: "div-1", academic_year: "2026-27", students: { id: "stu-1", name: "Lalit Thakare",    roll_number: "01" } },
  { id: "en-2", student_id: "stu-2", division_id: "div-1", academic_year: "2026-27", students: { id: "stu-2", name: "Pratiksha Shelke", roll_number: "02" } },
  { id: "en-3", student_id: "stu-3", division_id: "div-1", academic_year: "2026-27", students: { id: "stu-3", name: "Shreya Yeole",     roll_number: "03" } },
  { id: "en-4", student_id: "stu-4", division_id: "div-1", academic_year: "2026-27", students: { id: "stu-4", name: "Bhaveek Thakare",  roll_number: "04" } },
  { id: "en-5", student_id: "stu-5", division_id: "div-2", academic_year: "2026-27", students: { id: "stu-5", name: "Rahul Patil",      roll_number: "05" } },
  { id: "en-6", student_id: "stu-6", division_id: "div-2", academic_year: "2026-27", students: { id: "stu-6", name: "Pooja Desai",      roll_number: "06" } },
];

export const MOCK_TIMETABLE = [
  { id: "tt-1", day_of_week: "Monday",    start_time: "09:00:00", end_time: "10:00:00", subject_id: "sub-1", teacher_id: "tch-1", division_id: "div-1", room: "A-201", subjects: { id: "sub-1", name: "Database Management System" }, teachers: { id: "tch-1", name: "Ms. Poonam Patil" },    divisions: { id: "div-1", name: "A", classes: { id: "cls-1", name: "TYIT" } } },
  { id: "tt-2", day_of_week: "Monday",    start_time: "10:00:00", end_time: "11:00:00", subject_id: "sub-3", teacher_id: "tch-2", division_id: "div-1", room: "A-201", subjects: { id: "sub-3", name: "Machine Learning" },            teachers: { id: "tch-2", name: "Ms. Swapnali Jagtap" }, divisions: { id: "div-1", name: "A", classes: { id: "cls-1", name: "TYIT" } } },
  { id: "tt-3", day_of_week: "Monday",    start_time: "11:00:00", end_time: "12:00:00", subject_id: "sub-2", teacher_id: "tch-1", division_id: "div-2", room: "B-102", subjects: { id: "sub-2", name: "Operating Systems" },           teachers: { id: "tch-1", name: "Ms. Poonam Patil" },    divisions: { id: "div-2", name: "B", classes: { id: "cls-1", name: "TYIT" } } },
  { id: "tt-4", day_of_week: "Tuesday",   start_time: "09:00:00", end_time: "10:00:00", subject_id: "sub-4", teacher_id: "tch-2", division_id: "div-1", room: "A-201", subjects: { id: "sub-4", name: "Computer Networks" },            teachers: { id: "tch-2", name: "Ms. Swapnali Jagtap" }, divisions: { id: "div-1", name: "A", classes: { id: "cls-1", name: "TYIT" } } },
  { id: "tt-5", day_of_week: "Tuesday",   start_time: "10:00:00", end_time: "11:00:00", subject_id: "sub-1", teacher_id: "tch-1", division_id: "div-1", room: "A-201", subjects: { id: "sub-1", name: "Database Management System" }, teachers: { id: "tch-1", name: "Ms. Poonam Patil" },    divisions: { id: "div-1", name: "A", classes: { id: "cls-1", name: "TYIT" } } },
  { id: "tt-6", day_of_week: "Wednesday", start_time: "09:00:00", end_time: "10:00:00", subject_id: "sub-3", teacher_id: "tch-2", division_id: "div-1", room: "A-305", subjects: { id: "sub-3", name: "Machine Learning" },            teachers: { id: "tch-2", name: "Ms. Swapnali Jagtap" }, divisions: { id: "div-1", name: "A", classes: { id: "cls-1", name: "TYIT" } } },
  { id: "tt-7", day_of_week: "Wednesday", start_time: "10:00:00", end_time: "11:00:00", subject_id: "sub-2", teacher_id: "tch-1", division_id: "div-2", room: "B-102", subjects: { id: "sub-2", name: "Operating Systems" },           teachers: { id: "tch-1", name: "Ms. Poonam Patil" },    divisions: { id: "div-2", name: "B", classes: { id: "cls-1", name: "TYIT" } } },
  { id: "tt-8", day_of_week: "Thursday",  start_time: "09:00:00", end_time: "10:00:00", subject_id: "sub-1", teacher_id: "tch-1", division_id: "div-1", room: "A-201", subjects: { id: "sub-1", name: "Database Management System" }, teachers: { id: "tch-1", name: "Ms. Poonam Patil" },    divisions: { id: "div-1", name: "A", classes: { id: "cls-1", name: "TYIT" } } },
  { id: "tt-9", day_of_week: "Friday",    start_time: "09:00:00", end_time: "10:00:00", subject_id: "sub-4", teacher_id: "tch-2", division_id: "div-1", room: "A-201", subjects: { id: "sub-4", name: "Computer Networks" },            teachers: { id: "tch-2", name: "Ms. Swapnali Jagtap" }, divisions: { id: "div-1", name: "A", classes: { id: "cls-1", name: "TYIT" } } },
];

// Attendance sessions (past dates)
export const MOCK_SESSIONS = [
  { id: "sess-1", teacher_id: "tch-1", subject_id: "sub-1", division_id: "div-1", date: "2026-09-22", start_time: "09:00:00", end_time: "10:00:00", is_locked: true,  locked_at: "2026-09-22T10:01:00Z", timetable_id: "tt-1", subjects: { id: "sub-1", name: "Database Management System" }, teachers: { name: "Ms. Poonam Patil" }, divisions: { id: "div-1", name: "A", classes: { name: "TYIT" } } },
  { id: "sess-2", teacher_id: "tch-1", subject_id: "sub-2", division_id: "div-2", date: "2026-09-22", start_time: "11:00:00", end_time: "12:00:00", is_locked: true,  locked_at: "2026-09-22T12:01:00Z", timetable_id: "tt-3", subjects: { id: "sub-2", name: "Operating Systems" },           teachers: { name: "Ms. Poonam Patil" }, divisions: { id: "div-2", name: "B", classes: { name: "TYIT" } } },
  { id: "sess-3", teacher_id: "tch-1", subject_id: "sub-1", division_id: "div-1", date: "2026-09-23", start_time: "10:00:00", end_time: "11:00:00", is_locked: true,  locked_at: "2026-09-23T11:01:00Z", timetable_id: "tt-5", subjects: { id: "sub-1", name: "Database Management System" }, teachers: { name: "Ms. Poonam Patil" }, divisions: { id: "div-1", name: "A", classes: { name: "TYIT" } } },
  { id: "sess-4", teacher_id: "tch-1", subject_id: "sub-1", division_id: "div-1", date: "2026-09-25", start_time: "09:00:00", end_time: "10:00:00", is_locked: false, locked_at: null,                    timetable_id: "tt-8", subjects: { id: "sub-1", name: "Database Management System" }, teachers: { name: "Ms. Poonam Patil" }, divisions: { id: "div-1", name: "A", classes: { name: "TYIT" } } },
  { id: "sess-5", teacher_id: "tch-2", subject_id: "sub-3", division_id: "div-1", date: "2026-09-22", start_time: "10:00:00", end_time: "11:00:00", is_locked: true,  locked_at: "2026-09-22T11:01:00Z", timetable_id: "tt-2", subjects: { id: "sub-3", name: "Machine Learning" },            teachers: { name: "Ms. Swapnali Jagtap" }, divisions: { id: "div-1", name: "A", classes: { name: "TYIT" } } },
  { id: "sess-6", teacher_id: "tch-2", subject_id: "sub-4", division_id: "div-1", date: "2026-09-23", start_time: "09:00:00", end_time: "10:00:00", is_locked: true,  locked_at: "2026-09-23T10:01:00Z", timetable_id: "tt-4", subjects: { id: "sub-4", name: "Computer Networks" },            teachers: { name: "Ms. Swapnali Jagtap" }, divisions: { id: "div-1", name: "A", classes: { name: "TYIT" } } },
];

// Attendance records
export const MOCK_ATTENDANCE_RECORDS = [
  // sess-1: DBMS TYIT-A 22/09
  { id: "rec-1",  session_id: "sess-1", student_id: "stu-1", status: "present", students: { id: "stu-1", name: "Lalit Thakare",    roll_number: "01" } },
  { id: "rec-2",  session_id: "sess-1", student_id: "stu-2", status: "present", students: { id: "stu-2", name: "Pratiksha Shelke", roll_number: "02" } },
  { id: "rec-3",  session_id: "sess-1", student_id: "stu-3", status: "absent",  students: { id: "stu-3", name: "Shreya Yeole",     roll_number: "03" } },
  { id: "rec-4",  session_id: "sess-1", student_id: "stu-4", status: "present", students: { id: "stu-4", name: "Bhaveek Thakare",  roll_number: "04" } },
  // sess-2: OS TYIT-B 22/09
  { id: "rec-5",  session_id: "sess-2", student_id: "stu-5", status: "present", students: { id: "stu-5", name: "Rahul Patil",  roll_number: "05" } },
  { id: "rec-6",  session_id: "sess-2", student_id: "stu-6", status: "absent",  students: { id: "stu-6", name: "Pooja Desai",  roll_number: "06" } },
  // sess-3: DBMS TYIT-A 23/09
  { id: "rec-7",  session_id: "sess-3", student_id: "stu-1", status: "present", students: { id: "stu-1", name: "Lalit Thakare",    roll_number: "01" } },
  { id: "rec-8",  session_id: "sess-3", student_id: "stu-2", status: "absent",  students: { id: "stu-2", name: "Pratiksha Shelke", roll_number: "02" } },
  { id: "rec-9",  session_id: "sess-3", student_id: "stu-3", status: "absent",  students: { id: "stu-3", name: "Shreya Yeole",     roll_number: "03" } },
  { id: "rec-10", session_id: "sess-3", student_id: "stu-4", status: "present", students: { id: "stu-4", name: "Bhaveek Thakare",  roll_number: "04" } },
  // sess-4: DBMS TYIT-A 25/09
  { id: "rec-11", session_id: "sess-4", student_id: "stu-1", status: "present", students: { id: "stu-1", name: "Lalit Thakare",    roll_number: "01" } },
  { id: "rec-12", session_id: "sess-4", student_id: "stu-2", status: "present", students: { id: "stu-2", name: "Pratiksha Shelke", roll_number: "02" } },
  { id: "rec-13", session_id: "sess-4", student_id: "stu-3", status: "absent",  students: { id: "stu-3", name: "Shreya Yeole",     roll_number: "03" } },
  { id: "rec-14", session_id: "sess-4", student_id: "stu-4", status: "absent",  students: { id: "stu-4", name: "Bhaveek Thakare",  roll_number: "04" } },
  // sess-5: ML 22/09
  { id: "rec-15", session_id: "sess-5", student_id: "stu-1", status: "absent",  students: { id: "stu-1", name: "Lalit Thakare",    roll_number: "01" } },
  { id: "rec-16", session_id: "sess-5", student_id: "stu-2", status: "present", students: { id: "stu-2", name: "Pratiksha Shelke", roll_number: "02" } },
  { id: "rec-17", session_id: "sess-5", student_id: "stu-3", status: "present", students: { id: "stu-3", name: "Shreya Yeole",     roll_number: "03" } },
  { id: "rec-18", session_id: "sess-5", student_id: "stu-4", status: "present", students: { id: "stu-4", name: "Bhaveek Thakare",  roll_number: "04" } },
  // sess-6: CN 23/09
  { id: "rec-19", session_id: "sess-6", student_id: "stu-1", status: "present", students: { id: "stu-1", name: "Lalit Thakare",    roll_number: "01" } },
  { id: "rec-20", session_id: "sess-6", student_id: "stu-2", status: "present", students: { id: "stu-2", name: "Pratiksha Shelke", roll_number: "02" } },
  { id: "rec-21", session_id: "sess-6", student_id: "stu-3", status: "absent",  students: { id: "stu-3", name: "Shreya Yeole",     roll_number: "03" } },
  { id: "rec-22", session_id: "sess-6", student_id: "stu-4", status: "present", students: { id: "stu-4", name: "Bhaveek Thakare",  roll_number: "04" } },
];

export const MOCK_SYSTEM_SETTINGS = [
  { id: "set-1", key: "attendance_cutoff", value: "75", updated_at: "2026-09-01" },
];

// Demo login credentials
// admin@demo.com   / admin123   → role: admin
// teacher@demo.com / teacher123 → role: teacher  (Ms. Poonam Patil)
export const MOCK_USERS = [
  { id: "user-admin-1",   email: "admin@demo.com",   password: "admin123",   role: "admin" },
  { id: "user-teacher-1", email: "teacher@demo.com",  password: "teacher123", role: "teacher", teacher_id: "tch-1" },
  { id: "user-teacher-2", email: "swapnali@demo.com", password: "teacher123", role: "teacher", teacher_id: "tch-2" },
];
