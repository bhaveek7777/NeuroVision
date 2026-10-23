import React from 'react';
import { Users, GraduationCap, CalendarDays, CheckSquare, FileCheck2, AlertTriangle, History, BarChart3 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAttendance } from '../../context/AttendanceContext';

interface Props { onNavigate: (tab: string) => void; }

const KpiCard = ({ label, value, sub, subColor, icon: Icon, iconColor }: any) => (
  <div className="nv-card" style={{ padding: '16px 18px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-secondary)' }}>{label}</span>
      <div style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--bg-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={14} style={{ color: iconColor || 'var(--tx-muted)' }} />
      </div>
    </div>
    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--tx-primary)', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 11, color: subColor || 'var(--tx-muted)', marginTop: 5 }}>{sub}</div>
  </div>
);

export const AdminDashboard: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, dashboardStats, students, teachers, timetable, sessions, modificationRequests, auditLogs, settings, isLoading, theme } = useAttendance();

  const todayStr = new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
  const totalStudents    = dashboardStats.total_students || students.length;
  const totalTeachers    = dashboardStats.total_teachers || teachers.length;
  const todaysLectures   = dashboardStats.todays_lectures || timetable.length;
  const todaysAttendance = dashboardStats.todays_attendance || 84;
  const pendingRequests  = dashboardStats.pending_requests || modificationRequests.filter(m => m.status === 'Pending').length;
  const minThreshold     = settings?.min_attendance_threshold || 75;
  const defaulterList    = (dashboardStats.low_attendance_students?.length > 0 ? dashboardStats.low_attendance_students : students.filter(s => (s.overall_attendance || 0) < minThreshold));

  const trendData  = [{ day:'Mon',att:86},{ day:'Tue',att:88},{ day:'Wed',att:82},{ day:'Thu',att:84},{ day:'Fri',att:89},{ day:'Sat',att:todaysAttendance}];
  const subjectData= [{ s:'DBMS',v:86},{ s:'OS',v:78},{ s:'ML',v:91},{ s:'CN',v:82},{ s:'SP',v:75}];

  const gridColor   = theme === 'dark' ? '#2A303A' : '#F3F4F6';
  const tooltipStyle= { backgroundColor: theme === 'dark' ? '#1C222C' : '#fff', border: `1px solid ${theme === 'dark' ? '#2A303A' : '#E5E7EB'}`, fontSize: 11, borderRadius: 6, color: theme === 'dark' ? '#F5F7FA' : '#111827' };

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="skeleton" style={{ height: 76, borderRadius: 10 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
        {[...Array(5)].map((_,i) => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 10 }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="skeleton" style={{ height: 220, borderRadius: 10 }} />
        <div className="skeleton" style={{ height: 220, borderRadius: 10 }} />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div className="nv-card" style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--tx-primary)' }}>Welcome back, {currentUser.name}</div>
          <div style={{ fontSize: 12, color: 'var(--tx-secondary)', marginTop: 2 }}>{todayStr} · Academic Session 2026–2027</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid rgba(5,150,105,0.15)' }}>
            ● System Live
          </span>
          <button onClick={() => onNavigate('attendance')} className="nv-btn-primary">Monitor Live</button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }} className="sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Total Students"     value={totalStudents}     sub="Active enrolled"    icon={Users}       iconColor="var(--accent)" />
        <KpiCard label="Total Teachers"     value={totalTeachers}     sub="Faculty staff"      icon={GraduationCap} iconColor="var(--success)" />
        <KpiCard label="Today's Lectures"   value={todaysLectures}    sub="Scheduled today"    icon={CalendarDays}  iconColor="var(--info)" />
        <KpiCard label="Today's Attendance" value={`${todaysAttendance}%`} sub={`Above ${minThreshold}% threshold`} subColor="var(--success)" icon={CheckSquare} iconColor="var(--success)" />
        <KpiCard label="Pending Requests"   value={pendingRequests}   sub="Awaiting review"   subColor={pendingRequests > 0 ? 'var(--warning)' : 'var(--tx-muted)'} icon={FileCheck2} iconColor="var(--warning)" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="max-lg:grid-cols-1">
        <div className="nv-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx-primary)' }}>Attendance Trend</div>
              <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 2 }}>Weekly institutional average</div>
            </div>
            <button onClick={() => onNavigate('analytics')} className="nv-link" style={{ fontSize: 11 }}>Full report →</button>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="day" stroke="var(--tx-muted)" fontSize={10} tickLine={false} />
                <YAxis domain={[60,100]} stroke="var(--tx-muted)" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="att" stroke="var(--accent)" strokeWidth={2} fill="url(#ag)" name="Attendance %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="nv-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx-primary)' }}>Subject-wise Attendance</div>
              <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 2 }}>Current semester averages</div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>Threshold: {minThreshold}%</span>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData} margin={{ top: 5, right: 5, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="s" stroke="var(--tx-muted)" fontSize={10} tickLine={false} />
                <YAxis domain={[0,100]} stroke="var(--tx-muted)" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="v" fill="var(--accent)" radius={[4,4,0,0]} name="Avg %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Defaulters + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }} className="max-lg:grid-cols-1">

        <div className="nv-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx-primary)' }}>Low Attendance — Below {minThreshold}%</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'var(--warning-bg)', color: 'var(--warning-text)' }}>{defaulterList.length}</span>
            </div>
            <button onClick={() => onNavigate('students')} className="nv-link" style={{ fontSize: 11 }}>View all →</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="nv-table">
              <thead>
                <tr>
                  {['Roll','Student','Class','Attendance','Contact','Status'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {defaulterList.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--tx-muted)', fontSize: 12 }}>No students below threshold.</td></tr>
                ) : defaulterList.slice(0, 6).map((s: any) => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--tx-muted)' }}>{s.roll_no}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ color: 'var(--tx-secondary)' }}>{s.class_id} – {s.division}</td>
                    <td><span style={{ fontWeight: 700, color: 'var(--danger)', fontFamily: 'monospace' }}>{s.overall_attendance}%</span></td>
                    <td style={{ color: 'var(--tx-muted)', fontFamily: 'monospace', fontSize: 11 }}>{s.parent_phone}</td>
                    <td><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>Warning Sent</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="nv-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <History size={14} style={{ color: 'var(--tx-muted)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx-primary)' }}>Recent Activity</span>
            </div>
            <button onClick={() => onNavigate('audit')} className="nv-link" style={{ fontSize: 11 }}>Audit log →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(dashboardStats.recent_activity || auditLogs).slice(0, 5).map((log: any) => (
              <div key={log.id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-primary)' }}>{log.user}</span>
                  <span style={{ fontSize: 10, color: 'var(--tx-muted)' }}>{log.time}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--tx-secondary)' }}>{log.action}</div>
                {log.reason && <div style={{ fontSize: 10, color: 'var(--tx-muted)', fontStyle: 'italic', marginTop: 2 }}>"{log.reason}"</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
