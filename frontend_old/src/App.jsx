import React, { useState, useEffect } from 'react';
import { AttendanceProvider } from './context/AttendanceContext';
import { useAttendance } from './context/useAttendance';
import { supabase } from './lib/supabase';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LoginPage } from './views/auth/LoginPage';

// Teacher Views
import { TeacherDashboard } from './views/teacher/TeacherDashboard';
import { MarkAttendanceWizard } from './views/teacher/MarkAttendanceWizard';
import { LectureHistory } from './views/teacher/LectureHistory';
import { TeacherTimetable } from './views/teacher/TeacherTimetable';
import { TeacherModifications } from './views/teacher/TeacherModifications';
import { ParentAlertsView } from './views/teacher/ParentAlertsView';

// Admin Views
import { AdminDashboard } from './views/admin/AdminDashboard';
import { StudentManagement } from './views/admin/StudentManagement';
import { TeacherManagement } from './views/admin/TeacherManagement';
import { ClassesAndSubjectsView } from './views/admin/ClassesAndSubjectsView';
import { AttendanceMonitoring } from './views/admin/AttendanceMonitoring';
import { ModificationApprovals } from './views/admin/ModificationApprovals';
import { AuditLogsView } from './views/admin/AuditLogsView';
import { NotificationCenterView } from './views/admin/NotificationCenterView';
import { ReportsView } from './views/admin/ReportsView';
import { SettingsView } from './views/admin/SettingsView';

function DashboardApp() {
  const { currentUser, theme, logout: contextLogout } = useAttendance();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Restore session on mount — check Supabase for an existing session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setAuthChecked(true);
    });

    // Listen for auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await contextLogout();
    setIsLoggedIn(false);
  };

  // Show nothing while checking auth to avoid flash of login screen
  if (!authChecked) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="w-8 h-8 border-4 border-amber-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  const renderContent = () => {
    if (currentUser.role === 'Teacher') {
      switch (activeTab) {
        case 'dashboard':
          return <TeacherDashboard onStartAttendanceWizard={() => setActiveTab('mark-attendance')} onNavigate={setActiveTab} />;
        case 'today-lectures':
        case 'timetable':
          return <TeacherTimetable onStartAttendanceWizard={() => setActiveTab('mark-attendance')} />;
        case 'mark-attendance':
          return <MarkAttendanceWizard onFinish={() => setActiveTab('dashboard')} />;
        case 'history':
          return <LectureHistory />;
        case 'analytics':
          return <ReportsView />;
        case 'notifications':
          return <NotificationCenterView />;
        case 'modifications':
          return <TeacherModifications />;
        case 'parent-alerts':
          return <ParentAlertsView />;
        case 'profile':
          return <SettingsView />;
        default:
          return <TeacherDashboard onStartAttendanceWizard={() => setActiveTab('mark-attendance')} onNavigate={setActiveTab} />;
      }
    } else {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboard onNavigate={setActiveTab} />;
        case 'students':
          return <StudentManagement />;
        case 'teachers':
          return <TeacherManagement />;
        case 'classes':
        case 'subjects':
          return <ClassesAndSubjectsView />;
        case 'timetable':
          return <TeacherTimetable />;
        case 'attendance':
          return <AttendanceMonitoring />;
        case 'analytics':
        case 'reports':
          return <ReportsView />;
        case 'modifications':
          return <ModificationApprovals />;
        case 'audit':
          return <AuditLogsView />;
        case 'notifications':
          return <NotificationCenterView />;
        case 'settings':
          return <SettingsView />;
        default:
          return <AdminDashboard onNavigate={setActiveTab} />;
      }
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)', color: 'var(--tx-primary)' }}>
      <Navbar
        onNavigate={setActiveTab}
        onToggleMobileMenu={() => setIsMobileOpen(prev => !prev)}
        onLogout={handleLogout}
      />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onStartAttendanceWizard={() => setActiveTab('mark-attendance')}
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
          onLogout={handleLogout}
        />
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', maxWidth: '100%' }} className="max-sm:p-4">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <AttendanceProvider>
      <DashboardApp />
    </AttendanceProvider>
  );
}

export default App;