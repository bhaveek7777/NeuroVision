import React from 'react';
import {
  LayoutDashboard, Users, GraduationCap, CalendarDays, CheckSquare,
  FileCheck2, History, Bell, BarChart3, Settings, ScanEye, Camera,
  Layers, BookOpen, UserCheck, X, LogOut,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onStartAttendanceWizard?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab, onSelectTab, onStartAttendanceWizard,
  isMobileOpen = false, onCloseMobile, onLogout,
}) => {
  const { currentUser, modificationRequests, unreadNotificationsCount, logout } = useAttendance();
  const pendingMods = modificationRequests.filter(m => m.status === 'Pending').length;

  const adminNav = [
    { id: 'dashboard',     label: 'Dashboard',             icon: LayoutDashboard },
    { id: 'students',      label: 'Students',              icon: Users },
    { id: 'teachers',      label: 'Teachers',              icon: GraduationCap },
    { id: 'classes',       label: 'Classes',               icon: Layers },
    { id: 'subjects',      label: 'Subjects',              icon: BookOpen },
    { id: 'timetable',     label: 'Timetable',             icon: CalendarDays },
    { id: 'attendance',    label: 'Attendance',            icon: CheckSquare },
    { id: 'analytics',     label: 'Analytics',             icon: BarChart3 },
    { id: 'modifications', label: 'Modifications',         icon: FileCheck2,  badge: pendingMods },
    { id: 'notifications', label: 'Notifications',         icon: Bell,        badge: unreadNotificationsCount },
    { id: 'audit',         label: 'Audit Logs',            icon: History },
    { id: 'settings',      label: 'Settings',              icon: Settings },
  ];

  const teacherNav = [
    { id: 'dashboard',       label: 'Dashboard',          icon: LayoutDashboard },
    { id: 'today-lectures',  label: "Today's Lectures",   icon: CalendarDays },
    { id: 'mark-attendance', label: 'Mark Attendance',    icon: Camera },
    { id: 'history',         label: 'Attendance History', icon: History },
    { id: 'analytics',       label: 'Analytics',          icon: BarChart3 },
    { id: 'notifications',   label: 'Notifications',      icon: Bell,  badge: unreadNotificationsCount },
    { id: 'profile',         label: 'Profile',            icon: UserCheck },
  ];

  const navItems = currentUser.role === 'Admin' ? adminNav : teacherNav;

  const handleNav = (id: string) => {
    if (id === 'mark-attendance' && onStartAttendanceWizard) onStartAttendanceWizard();
    else onSelectTab(id);
    onCloseMobile?.();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        />
      )}

      <aside
        style={{
          width: 248,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
        }}
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col shrink-0 transition-transform duration-200 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* ── Brand ───────────────────────────────────────────────── */}
        <div
          style={{ height: 64, borderBottom: '1px solid var(--border)', padding: '0 20px' }}
          className="flex items-center justify-between shrink-0"
        >
          <div className="flex items-center gap-2.5">
            <div
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--accent)', color: 'var(--tx-on-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ScanEye size={17} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx-primary)', lineHeight: 1.2 }}>
                NeuroVision
              </div>
              <div style={{ fontSize: 10, color: 'var(--tx-muted)', marginTop: 1 }}>
                Attendance Management
              </div>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              style={{ color: 'var(--tx-muted)', padding: 4, borderRadius: 6 }}
              className="lg:hidden hover:opacity-70"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ── Workspace tag ────────────────────────────────────────── */}
        <div
          style={{
            padding: '6px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-raised)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--tx-secondary)', fontWeight: 500 }}>
            {currentUser.role} Workspace
          </span>
          <span
            style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
              background: 'var(--accent-bg)', color: 'var(--accent-text)',
              border: '1px solid var(--accent-border)',
            }}
          >
            {currentUser.role}
          </span>
        </div>

        {/* ── Teacher CTA ──────────────────────────────────────────── */}
        {currentUser.role === 'Teacher' && (
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
            <button
              onClick={() => { onStartAttendanceWizard?.() || onSelectTab('mark-attendance'); onCloseMobile?.(); }}
              className="nv-btn-primary"
              style={{ width: '100%', justifyContent: 'center', gap: 6 }}
            >
              <Camera size={14} />
              Mark Attendance
            </button>
          </div>
        )}

        {/* ── Navigation ───────────────────────────────────────────── */}
        <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: 7,
                  marginBottom: 1,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12.5,
                  fontWeight: active ? 600 : 400,
                  background: active ? 'var(--accent-bg)' : 'transparent',
                  color: active ? 'var(--accent-text)' : 'var(--tx-secondary)',
                  transition: 'background 0.12s, color 0.12s',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--tx-primary)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--tx-secondary)';
                  }
                }}
              >
                <div className="flex items-center" style={{ gap: 9 }}>
                  <Icon
                    size={15}
                    style={{ color: active ? 'var(--accent)' : 'var(--tx-muted)', flexShrink: 0 }}
                  />
                  <span>{item.label}</span>
                </div>
                {Boolean((item as any).badge) && (
                  <span
                    style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99,
                      background: 'var(--danger)', color: '#fff',
                    }}
                  >
                    {(item as any).badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── User footer ──────────────────────────────────────────── */}
        <div
          style={{
            padding: '10px 14px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-raised)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          }}
        >
          <div className="flex items-center" style={{ gap: 9, minWidth: 0 }}>
            <img
              src={
                (currentUser as any).avatar_url || (currentUser as any).avatar ||
                'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.name) + '&background=4F46E5&color=fff&size=64'
              }
              alt={currentUser.name}
              style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-strong)' }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--tx-muted)' }}>
                {currentUser.role}
              </div>
            </div>
          </div>
          <button
            onClick={onLogout || logout}
            title="Sign Out"
            style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--tx-muted)', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx-muted)')}
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  );
};
