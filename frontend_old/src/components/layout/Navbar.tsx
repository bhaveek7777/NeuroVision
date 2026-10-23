import React, { useState, useRef, useEffect } from 'react';
import { Bell, ScanEye, LogOut, ChevronDown, CheckCircle2, AlertTriangle, FileEdit, Sun, Moon, Menu, Info } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

interface NavbarProps {
  onNavigate?: (tab: string) => void;
  onToggleMobileMenu?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onToggleMobileMenu, onLogout }) => {
  const { currentUser, logout, notifications, unreadNotificationsCount,
    markNotificationAsRead, markAllNotificationsAsRead, theme, toggleTheme } = useAttendance();

  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser]   = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setShowUser(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const notifIcon = (cat: string) => {
    if (cat === 'Attendance')           return <CheckCircle2 size={13} style={{ color: 'var(--success)' }} />;
    if (cat === 'Low Attendance')       return <AlertTriangle size={13} style={{ color: 'var(--warning)' }} />;
    if (cat === 'Modification Request') return <FileEdit size={13} style={{ color: 'var(--accent)' }} />;
    return <Info size={13} style={{ color: 'var(--tx-muted)' }} />;
  };

  const iconBtn: React.CSSProperties = {
    padding: '6px 8px', borderRadius: 7, border: '1px solid var(--border)',
    background: 'var(--bg-surface)', color: 'var(--tx-secondary)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.12s, color 0.12s', position: 'relative',
  };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30, height: 64,
      background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
      padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    }}>
      {/* Left */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button onClick={onToggleMobileMenu} style={iconBtn} className="lg:hidden">
            <Menu size={16} />
          </button>
        )}
        <div className="flex items-center gap-2 lg:hidden">
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ScanEye size={15} style={{ color: '#fff' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx-primary)' }}>NeuroVision</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center" style={{ gap: 8, marginLeft: 'auto' }}>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={iconBtn}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-raised)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--tx-primary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--tx-secondary)'; }}
        >
          {theme === 'dark'
            ? <Sun size={15} style={{ color: '#F59E0B' }} />
            : <Moon size={15} />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotif(v => !v)}
            style={{ ...iconBtn }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-raised)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)'; }}
          >
            <Bell size={15} />
            {unreadNotificationsCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                width: 16, height: 16, borderRadius: '50%',
                background: 'var(--danger)', color: '#fff',
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{unreadNotificationsCount}</span>
            )}
          </button>

          {showNotif && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              width: 360, background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 10, boxShadow: 'var(--shadow-md)', zIndex: 100, overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-primary)' }}>Notifications</span>
                  {unreadNotificationsCount > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                      {unreadNotificationsCount} new
                    </span>
                  )}
                </div>
                <button onClick={markAllNotificationsAsRead} className="nv-link" style={{ fontSize: 11 }}>
                  Mark all read
                </button>
              </div>
              <div style={{ maxHeight: 288, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 12, color: 'var(--tx-muted)' }}>No notifications</div>
                ) : notifications.slice(0, 8).map(n => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationAsRead(n.id)}
                    style={{
                      padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                      background: !n.read ? 'var(--accent-bg)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (n.read) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = !n.read ? 'var(--accent-bg)' : 'transparent'; }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--bg-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        {notifIcon(n.category || n.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--tx-secondary)', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.message}</div>
                        <div style={{ fontSize: 10, color: 'var(--tx-muted)', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                          <span>{n.timestamp}</span>
                          <span style={{ color: 'var(--accent-text)', fontWeight: 500 }}>{n.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {onNavigate && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                  <button onClick={() => { setShowNotif(false); onNavigate('notifications'); }} className="nv-link" style={{ fontSize: 12 }}>
                    View all notifications →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUser(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.12s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <img
              src={(currentUser as any).avatar || (currentUser as any).avatar_url ||
                'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.name) + '&background=4F46E5&color=fff&size=64'}
              alt={currentUser.name}
              style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border-strong)' }}
            />
            <div className="hidden lg:block" style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-primary)', lineHeight: 1.3 }}>{currentUser.name}</div>
              <div style={{ fontSize: 10, color: 'var(--tx-muted)' }}>{currentUser.role}</div>
            </div>
            <ChevronDown size={12} style={{ color: 'var(--tx-muted)' }} className="hidden lg:block" />
          </button>

          {showUser && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              width: 216, background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 10, boxShadow: 'var(--shadow-md)', zIndex: 100, overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx-primary)' }}>{currentUser.name}</div>
                <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.email}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--accent-text)', marginTop: 4 }}>{currentUser.department}</div>
              </div>
              <div style={{ padding: 6 }}>
                <button
                  onClick={onLogout || logout}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'var(--danger)', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
