import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Badge } from '../../components/common/Badge';
import { Bell, CheckCircle2, AlertTriangle, FileEdit, Smartphone, Mail, MessageSquare, CheckCheck } from 'lucide-react';

export const NotificationCenterView: React.FC = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useAttendance();
  const [activeCategory, setActiveCategory] = useState('all');
  const [channelFilter, setChannelFilter]   = useState('all');

  const filtered = notifications.filter(n => {
    if (activeCategory === 'parent'   && n.recipient_type !== 'Parent'              ) return false;
    if (activeCategory === 'low_att'  && n.type !== 'Low Attendance'               ) return false;
    if (activeCategory === 'mod'      && n.type !== 'Attendance Modification'      ) return false;
    if (activeCategory === 'system'   && n.type !== 'System Notification'          ) return false;
    if (channelFilter   !== 'all'     && n.channel !== channelFilter               ) return false;
    return true;
  });

  const tabs = [
    { id: 'all',    label: 'All' },
    { id: 'parent', label: 'Parent Alerts' },
    { id: 'low_att',label: 'Low Attendance' },
    { id: 'mod',    label: 'Modifications' },
    { id: 'system', label: 'System' },
  ];

  const channelIcon = (ch: string) => {
    if (ch === 'WhatsApp') return <MessageSquare size={12} style={{ color: 'var(--success)' }} />;
    if (ch === 'SMS')      return <Smartphone    size={12} style={{ color: 'var(--info)' }} />;
    return                        <Mail          size={12} style={{ color: 'var(--accent)' }} />;
  };

  const typeVariant = (type: string) => {
    if (type === 'Student Absent')         return 'absent';
    if (type === 'Low Attendance')         return 'needs_review';
    if (type === 'Attendance Modification') return 'pending';
    return 'present';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
            <Bell size={18} style={{ color: 'var(--accent)' }} />
            <h2 className="nv-page-title">Notification Center</h2>
          </div>
          <p className="nv-page-subtitle">Real-time alerts dispatched to parents, teachers, and administrators</p>
        </div>
        <button onClick={markAllNotificationsAsRead} className="nv-btn-secondary">Mark all as read</button>
      </div>

      {/* Tabs + channel filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div className="nv-tabs">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveCategory(t.id)} className={`nv-tab${activeCategory === t.id ? ' active' : ''}`}>
              {t.label}
            </button>
          ))}
        </div>
        <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)}
          style={{ padding: '6px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 8, fontSize: 12, color: 'var(--tx-primary)', outline: 'none', cursor: 'pointer' }}>
          <option value="all">All Channels</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="SMS">SMS</option>
          <option value="Email">Email</option>
          <option value="App">App</option>
        </select>
      </div>

      {/* Table */}
      <div className="nv-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="nv-table">
            <thead>
              <tr>{['Timestamp','Type','Recipient','Channel','Student / Subject','Message','Status'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--tx-muted)', fontSize: 12 }}>No notifications found.</td></tr>
              ) : filtered.map(n => (
                <tr key={n.id} onClick={() => markNotificationAsRead(n.id)} style={{ cursor: 'pointer', background: !n.read ? 'var(--accent-bg)' : 'transparent' }}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--tx-muted)', whiteSpace: 'nowrap' }}>{n.timestamp}</td>
                  <td><Badge variant={typeVariant(n.type) as any} size="sm">{n.type}</Badge></td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--tx-primary)', fontSize: 12 }}>{n.recipient_name}</div>
                    <div style={{ fontSize: 10, color: 'var(--tx-muted)', marginTop: 1 }}>{n.recipient_type}</div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--tx-secondary)' }}>
                      {channelIcon(n.channel)}{n.channel}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--tx-secondary)', fontWeight: 500 }}>{n.student_name || '—'}</td>
                  <td style={{ maxWidth: 280, fontSize: 11, color: 'var(--tx-secondary)' }}>
                    <div style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{n.message}</div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--success)', fontFamily: 'monospace' }}>
                      {n.status === 'Sent' || n.status === 'Read' ? <><CheckCheck size={12} /> Sent</> : n.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
