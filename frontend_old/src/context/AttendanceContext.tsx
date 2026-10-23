// @refresh reset
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  Role,
  Student,
  Teacher,
  TimetableLecture,
  AttendanceSession,
  ModificationRequest,
  AuditLog,
  NotificationItem,
  SystemSettings,
} from '../types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  designation: string;
  department: string;
}

export interface SystemStatus {
  api: { status: 'online' | 'offline'; port?: number };
  database: { status: 'online' | 'offline'; provider: string; connected: boolean; details?: string };
  ml_engine: { status: 'online' | 'offline'; model: string; connected: boolean; url?: string };
}

export interface DashboardStats {
  total_students: number;
  total_teachers: number;
  todays_lectures: number;
  todays_attendance: number;
  pending_requests: number;
  defaulters_count: number;
  low_attendance_students: Student[];
  recent_activity: AuditLog[];
  recent_sessions: AttendanceSession[];
}

interface AttendanceContextType {
  currentUser: AuthUser;
  switchRole: (role: Role) => void;
  login: (email: string, role: Role, password: string) => Promise<{ error: string | null }>;
  logout: () => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  toggleTheme: () => void;
  systemStatus: SystemStatus;
  dashboardStats: DashboardStats;
  students: Student[];
  teachers: Teacher[];
  timetable: TimetableLecture[];
  sessions: AttendanceSession[];
  modificationRequests: ModificationRequest[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  settings: SystemSettings;
  unreadNotificationsCount: number;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  addStudent: (student: Partial<Student>) => Promise<void>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  toggleStudentStatus: (id: string) => Promise<void>;
  addTeacher: (teacher: Partial<Teacher>) => Promise<void>;
  updateTeacher: (id: string, updates: Partial<Teacher>) => Promise<void>;
  submitAttendanceSession: (session: any) => Promise<any>;
  createModificationRequest: (data: any) => Promise<any>;
  approveModificationRequest: (requestId: string, adminComment?: string) => Promise<void>;
  rejectModificationRequest: (requestId: string, adminComment?: string) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  updateSettings: (updates: Partial<SystemSettings>) => Promise<void>;
  sendImageToML: (file: File) => Promise<any>;
}

const defaultTeacherUser: AuthUser = {
  id: 'T001',
  name: 'Prof. Ramesh Sharma',
  email: 'teacher@neurovision.com',
  role: 'Teacher',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  designation: 'Associate Professor & Class Advisor',
  department: 'Computer Engineering',
};

const defaultAdminUser: AuthUser = {
  id: 'ADM-01',
  name: 'Dr. Arvind Kulkarni',
  email: 'admin@neurovision.com',
  role: 'Admin',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
  designation: 'Dean of Academics & Principal Administrator',
  department: 'Academic Affairs',
};

const initialSystemStatus: SystemStatus = {
  api: { status: 'online', port: 5000 },
  database: { status: 'online', provider: 'Supabase / PostgreSQL', connected: true },
  ml_engine: { status: 'online', model: 'InsightFace Buffalo_L', connected: true },
};

const initialStats: DashboardStats = {
  total_students: 0,
  total_teachers: 0,
  todays_lectures: 0,
  todays_attendance: 0,
  pending_requests: 0,
  defaulters_count: 0,
  low_attendance_students: [],
  recent_activity: [],
  recent_sessions: [],
};

const initialSettingsState: SystemSettings = {
  min_attendance_threshold: 75,
  ai_confidence_high_threshold: 90,
  ai_confidence_medium_threshold: 75,
  academic_year: '2026-2027 (Odd Semester)',
  college_name: 'Imperial Institute of Technology & Engineering',
  college_code: 'IIT-ENG-304',
  department: 'Department of Computer Engineering',
  allow_offline_sync: true,
  enable_parent_notifications: true,
  parent_channels: {
    whatsapp: true,
    sms: true,
    email: true,
    app: true,
  },
  anomaly_sensitivity: 'Medium',
};

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('neurovision_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const setTheme = (t: 'light' | 'dark') => {
    setThemeState(t);
    localStorage.setItem('neurovision_theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Auth User
  const [currentUser, setCurrentUser] = useState<AuthUser>(() => {
    const saved = localStorage.getItem('neurovision_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return defaultTeacherUser;
  });

  // State from real Database
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(initialSystemStatus);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(initialStats);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [timetable, setTimetable] = useState<TimetableLecture[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [modificationRequests, setModificationRequests] = useState<ModificationRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(initialSettingsState);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Health check query
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setSystemStatus({
          api: data.api || { status: 'online' },
          database: data.database || { status: 'online', provider: 'Supabase / PostgreSQL', connected: true },
          ml_engine: data.ml_engine || { status: 'offline', model: 'InsightFace Buffalo_L', connected: false },
        });
      }
    } catch (e) {
      setSystemStatus({
        api: { status: 'offline' },
        database: { status: 'offline', provider: 'Database Offline', connected: false },
        ml_engine: { status: 'offline', model: 'ML Engine Offline', connected: false },
      });
    }
  }, []);

  // Fetch all real database data
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await checkHealth();

      // Helper: fetch JSON, return null on any failure (404, network, etc.)
      const safeFetch = async (url: string) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          return await res.json();
        } catch {
          return null;
        }
      };

      const [
        statsData,
        studentsData,
        teachersData,
        timetableData,
        sessionsData,
        modsData,
        auditData,
        notifsData,
        settingsData,
      ] = await Promise.all([
        safeFetch('/api/dashboard/stats'),
        safeFetch('/api/students'),
        safeFetch('/api/teachers'),
        safeFetch('/api/timetable'),
        safeFetch('/api/attendance/sessions'),
        safeFetch('/api/attendance/modifications'),
        safeFetch('/api/audit-logs'),
        safeFetch('/api/notifications'),
        safeFetch('/api/settings'),
      ]);

      if (studentsData)  setStudents(studentsData);
      if (teachersData)  setTeachers(teachersData);
      if (timetableData) setTimetable(timetableData);
      if (sessionsData)  setSessions(sessionsData);
      if (modsData)      setModificationRequests(modsData);
      if (auditData)     setAuditLogs(auditData);
      if (notifsData)    setNotifications(notifsData);
      if (settingsData)  setSettings(settingsData);

      // Stats: use backend data or derive locally
      if (statsData) {
        setDashboardStats(statsData);
      } else if (studentsData) {
        const threshold = settingsData?.min_attendance_threshold ?? 75;
        const lowAtt = (studentsData as any[]).filter(
          (s: any) => (s.overall_attendance ?? 100) < threshold
        );
        setDashboardStats({
          total_students:          studentsData.length,
          total_teachers:          teachersData?.length ?? 0,
          todays_lectures:         timetableData?.length ?? 0,
          todays_attendance:       0,
          pending_requests:        (modsData ?? []).filter((m: any) => m.status === 'Pending').length,
          defaulters_count:        lowAtt.length,
          low_attendance_students: lowAtt.slice(0, 10),
          recent_activity:         (auditData ?? []).slice(-5),
          recent_sessions:         (sessionsData ?? []).slice(-5),
        });
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError('Unable to connect to the backend. Please ensure the server is running on port 8000.');
    } finally {
      setIsLoading(false);
    }
  }, [checkHealth]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [refreshData, checkHealth]);

  // Auth Functions
  const switchRole = (role: Role) => {
    const newUser = role === 'Teacher' ? defaultTeacherUser : defaultAdminUser;
    setCurrentUser(newUser);
    localStorage.setItem('neurovision_user', JSON.stringify(newUser));
  };

  const login = async (email: string, role: Role, password: string): Promise<{ error: string | null }> => {
    // 1. Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { error: authError.message };
    }

    const authUser = authData.user;

    // 2. Fetch profile from user_profiles table
    let profileName = email.split('@')[0];
    let profileDesignation = role === 'Admin' ? 'Dean of Academics' : 'Associate Professor';
    let profileDepartment  = role === 'Admin' ? 'Academic Affairs' : 'Computer Engineering';
    let profileAvatar      = role === 'Admin'
      ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80'
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        profileName        = profile.name        || profileName;
        profileDesignation = profile.designation || profileDesignation;
        profileDepartment  = profile.department  || profileDepartment;
        profileAvatar      = profile.avatar_url  || profileAvatar;
        // Profile role overrides the tab selection if set
        role = (profile.role as Role) || role;
      } else {
        // Insert profile if trigger didn't fire
        await supabase.from('user_profiles').upsert({
          id:          authUser.id,
          email,
          name:        profileName,
          role,
          designation: profileDesignation,
          department:  profileDepartment,
        });
      }
    } catch (_) {
      // Profile fetch failed — continue with defaults
    }

    const user: AuthUser = {
      id:          authUser.id,
      name:        profileName,
      email,
      role,
      avatar:      profileAvatar,
      designation: profileDesignation,
      department:  profileDepartment,
    };

    setCurrentUser(user);
    localStorage.setItem('neurovision_user', JSON.stringify(user));
    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('neurovision_user');
    setCurrentUser(defaultTeacherUser);
  };

  // Database mutations
  const addStudent = async (studentData: Partial<Student>) => {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error('Error adding student:', e);
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error('Error updating student:', e);
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error('Error deleting student:', e);
    }
  };

  const toggleStudentStatus = async (id: string) => {
    const student = students.find(s => s.id === id || s.student_id === id);
    if (!student) return;
    const newStatus = student.status === 'Active' ? 'Inactive' : 'Active';
    await updateStudent(id, { status: newStatus });
  };

  const addTeacher = async (teacherData: Partial<Teacher>) => {
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherData),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error('Error adding teacher:', e);
    }
  };

  const updateTeacher = async (id: string, updates: Partial<Teacher>) => {
    // updates teacher
    await refreshData();
  };

  // ML API submission
  const sendImageToML = async (file: File) => {
    const form = new FormData();
    form.append('image', file);

    const res = await fetch('/api/recognize', {
      method: 'POST',
      body: form,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: 'AI processing service is currently unavailable.' }));
      throw new Error(errData.detail || errData.error || 'AI processing service is currently unavailable.');
    }

    return await res.json();
  };

  // Submit attendance session (Locks session in DB and creates audit log + parent notifications)
  const submitAttendanceSession = async (sessionData: any) => {
    try {
      const res = await fetch('/api/attendance/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (!res.ok) {
        throw new Error('Failed to record attendance in database');
      }

      const result = await res.json();
      await refreshData();
      return result.session;
    } catch (err: any) {
      console.error('Attendance recording error:', err);
      throw err;
    }
  };

  // Modification Requests
  const createModificationRequest = async (data: any) => {
    try {
      const res = await fetch('/api/attendance/modifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          teacher_name: currentUser.name,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        await refreshData();
        return result.request;
      }
    } catch (e) {
      console.error('Error submitting modification request:', e);
    }
  };

  const approveModificationRequest = async (requestId: string, adminComment?: string) => {
    try {
      const res = await fetch(`/api/attendance/modifications/${requestId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: adminComment || 'Approved by Dean' }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error('Error approving request:', e);
    }
  };

  const rejectModificationRequest = async (requestId: string, adminComment?: string) => {
    try {
      const res = await fetch(`/api/attendance/modifications/${requestId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: adminComment || 'Rejected by Dean' }),
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error('Error rejecting request:', e);
    }
  };

  // Notifications
  const markNotificationAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  // Settings
  const updateSettings = async (updates: Partial<SystemSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        await refreshData();
      }
    } catch (e) {
      console.error('Error updating settings:', e);
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <AttendanceContext.Provider
      value={{
        currentUser,
        switchRole,
        login,
        logout,
        theme,
        setTheme,
        toggleTheme,
        systemStatus,
        dashboardStats,
        students,
        teachers,
        timetable,
        sessions,
        modificationRequests,
        auditLogs,
        notifications,
        settings,
        unreadNotificationsCount,
        isLoading,
        error,
        refreshData,
        addStudent,
        updateStudent,
        deleteStudent,
        toggleStudentStatus,
        addTeacher,
        updateTeacher,
        submitAttendanceSession,
        createModificationRequest,
        approveModificationRequest,
        rejectModificationRequest,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        updateSettings,
        sendImageToML,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = (): AttendanceContextType => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
