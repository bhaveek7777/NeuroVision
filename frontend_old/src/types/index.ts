export type Role = 'Admin' | 'Teacher';

export type AttendanceStatus = 'Present' | 'Absent';

export type ConfidenceTier = 'High Confidence' | 'Medium Confidence' | 'Needs Review';

export type VerificationStatus = 'AI Generated' | 'Teacher Verified' | 'Manually Modified';

export type ModificationReason = 
  | 'Face not detected'
  | 'Poor image quality'
  | 'Student was manually verified'
  | 'Incorrect AI match'
  | 'Arrived late with permission'
  | 'Other';

export interface Student {
  id: string;
  student_id: string; // e.g. ST001
  roll_no: string;   // e.g. 101
  name: string;
  class_id: string;  // e.g. TE Computer
  division: string;  // e.g. C
  email: string;
  phone: string;
  avatar_url: string;
  status: 'Active' | 'Inactive';
  parent_id: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  parent_pref: 'WhatsApp' | 'SMS' | 'Email' | 'App';
  overall_attendance: number;
  subject_attendance: Record<string, number>; // e.g. { 'DBMS': 68, 'OS': 76, 'CN': 80, 'ML': 74 }
}

export interface Teacher {
  id: string;
  teacher_id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  avatar_url: string;
  assigned_subjects: string[];
  assigned_classes: string[];
  assigned_divisions: string[];
}

export interface TimetableLecture {
  id: string;
  lecture_no: number;
  subject: string;
  subject_code: string;
  class_name: string;
  division: string;
  classroom: string;
  teacher_id: string;
  teacher_name: string;
  day: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'Scheduled' | 'Completed' | 'In Progress';
  attendance_session_id?: string;
}

export interface DetectedFace {
  id: string;
  student_id?: string;
  student_name: string;
  roll_no?: string;
  bbox: [number, number, number, number]; // [x%, y%, width%, height%]
  confidence: number; // 0 - 100
  tier: ConfidenceTier;
  ai_status: AttendanceStatus;
  status: AttendanceStatus;
  verification_status: VerificationStatus;
  modification_reason?: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  roll_no: string;
  class_name: string;
  division: string;
  status: AttendanceStatus;
  confidence_score: number;
  confidence_tier: ConfidenceTier;
  ai_result: AttendanceStatus;
  verification_status: VerificationStatus;
  modified: boolean;
  modification_reason?: string;
  face_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSession {
  id: string; // e.g. ATT-20260928-DBMS-C
  lecture_id: string;
  subject: string;
  class_name: string;
  division: string;
  classroom: string;
  teacher_id: string;
  teacher_name: string;
  date: string;
  time: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  attendance_percentage: number;
  is_locked: boolean;
  locked_at: string;
  image_url: string;
  records: AttendanceRecord[];
  anomalies?: string[];
  geo_verification?: {
    beacon_name: string;
    status: 'Verified' | 'Mismatch';
    distance: string;
  };
}

export interface ModificationRequest {
  id: string;
  request_id: string; // e.g. REQ-1042
  session_id: string;
  student_id: string;
  student_name: string;
  roll_no: string;
  class_name: string;
  division: string;
  subject: string;
  teacher_id: string;
  teacher_name: string;
  previous_status: AttendanceStatus;
  requested_status: AttendanceStatus;
  reason: string;
  date: string;
  time: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  admin_comment?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface AuditLog {
  id: string;
  user: string;
  role: Role;
  action: string;
  affected_student?: string;
  previous_value?: string;
  new_value?: string;
  reason?: string;
  date: string;
  time: string;
  ip_address?: string;
}

export interface NotificationItem {
  id: string;
  type: 'Attendance Marked' | 'Student Absent' | 'Low Attendance' | 'Attendance Modification' | 'System Notification' | 'Parent Notification';
  title: string;
  message: string;
  recipient_type: 'Parent' | 'Admin' | 'Teacher';
  recipient_name: string;
  channel: 'WhatsApp' | 'SMS' | 'Email' | 'App';
  status: 'Sent' | 'Pending' | 'Failed' | 'Read' | 'Unread';
  timestamp: string;
  student_name?: string;
  student_id?: string;
  details?: Record<string, any>;
}

export interface SystemSettings {
  min_attendance_threshold: number; // default 75
  ai_confidence_high_threshold: number; // default 90
  ai_confidence_medium_threshold: number; // default 75
  academic_year: string;
  college_name: string;
  college_code: string;
  department: string;
  allow_offline_sync: boolean;
  enable_parent_notifications: boolean;
  parent_channels: {
    whatsapp: boolean;
    sms: boolean;
    email: boolean;
    app: boolean;
  };
  anomaly_sensitivity: 'Low' | 'Medium' | 'High';
}
