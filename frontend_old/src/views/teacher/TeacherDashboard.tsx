import React from 'react';
import { CalendarDays, CheckCircle2, Clock, Camera, AlertTriangle, ArrowRight, Users } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

interface Props { onStartAttendanceWizard: () => void; onNavigate: (tab: string) => void; }

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

export const TeacherDashboard: React.FC<Props> = ({ onStartAttendanceWizard, onNavigate }) => {
  const { currentUser, timetable, sessions, students, settings, isLoading } = useAttendance();

  const todayStr = new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
  const minThreshold = settings?.min_attendance_threshold || 75;
  const lowAtt = students.filter(s => (s.subject_attendance?.['DBMS'] || s.overall_attendance) < minThreshold);
  const completedCount = sessions.length;
  const pendingCount = Math.max(0, timetable.length - completedCount);

  if (isLoading) return (
    <div className="space-y-4">
      <div className="skeleton" style={{ height: 80, borderRadius: 10 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 10 }} />)}
      </div>
      <div className="skeleton" style={{ height: 220, borderRadius: 10 }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Welcome banner */}
      <div className="nv-card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Faculty Portal
            </span>
            <span style={{ fontSize: 12, color: 'var(--tx-muted)' }}>{todayStr}</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--tx-primary)' }}>Welcome back, {currentUser.name}</div>
          <div style={{ fontSize: 12, color: 'var(--tx-secondary)', marginTop: 2 }}>{currentUser.department} · {currentUser.designation}</div>
        </div>
        <button onClick={onStartAttendanceWizard} className="nv-btn-primary">
          <Camera size={14} /> Mark Attendance
        </button>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }} className="lg:grid-cols-4">
        <KpiCard label="Today's Lectures" value={timetable.length} sub="Scheduled slots" icon={CalendarDays} iconColor="var(--accent)" />
        <KpiCard label="Recorded Sessions" value={completedCount} sub="Locked in database" subColor="var(--success)" icon={CheckCircle2} iconColor="var(--success)" />
        <KpiCard label="Pending Attendance" value={pendingCount} sub="Action required" subColor={pendingCount > 0 ? 'var(--warning)' : 'var(--tx-muted)'} icon={Clock} iconColor="var(--warning)" />
        <KpiCard label="Enrolled Students" value={students.length} sub="In assigned classes" icon={Users} iconColor="var(--info)" />
      </div>

      {/* Current session + schedule */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="lg:grid-cols-3">

        {/* Current session */}
        <div className="nv-card lg:col-span-2" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid rgba(5,150,105,0.2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Current Session
              </span>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx-primary)', marginTop: 6 }}>
                {timetable[0]?.subject || 'Database Management Systems'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--tx-secondary)', marginTop: 2 }}>
                {timetable[0]?.class_name || 'TE Computer'} · Division {timetable[0]?.division || 'C'} · {timetable[0]?.classroom || 'Smart Lab 304'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>
                {timetable[0]?.start_time || '10:00 AM'} – {timetable[0]?.end_time || '11:00 AM'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 2 }}>
                Lecture #{timetable[0]?.lecture_no || 1}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, padding: '12px 14px', background: 'var(--bg-raised)', borderRadius: 8, marginBottom: 16 }}>
            {[
              { label: 'Room', value: timetable[0]?.classroom || 'Smart Lab 304' },
              { label: 'Status', value: 'Scheduled ✓', valueColor: 'var(--success)' },
              { label: 'Enrolled', value: `${students.length} students` },
            ].map(({ label, value, valueColor }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: 'var(--tx-muted)', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: valueColor || 'var(--tx-primary)' }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--tx-muted)' }}>Ready to capture attendance for this session.</span>
            <button onClick={onStartAttendanceWizard} className="nv-btn-primary" style={{ gap: 6 }}>
              <Camera size={13} /> Mark Attendance <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Today's schedule */}
        <div className="nv-card" style={{ padding: '18px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--tx-muted)', marginBottom: 12 }}>
            Today's Schedule
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {timetable.length > 0 ? timetable.map((lec, i) => (
              <div key={lec.id || i} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-primary)' }}>{lec.subject}</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--tx-muted)' }}>{lec.start_time}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                  <span style={{ fontSize: 11, color: 'var(--tx-secondary)' }}>{lec.class_name} – {lec.division}</span>
                  <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>{lec.classroom}</span>
                </div>
              </div>
            )) : (
              <div style={{ fontSize: 12, color: 'var(--tx-muted)', textAlign: 'center', padding: '20px 0' }}>No scheduled lectures today.</div>
            )}
          </div>
        </div>
      </div>

      {/* Low attendance alerts */}
      {lowAtt.length > 0 && (
        <div className="nv-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={15} style={{ color: 'var(--warning)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx-primary)' }}>
                Defaulter Alert — Below {minThreshold}%
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: 'var(--warning-bg)', color: 'var(--warning-text)' }}>
                {lowAtt.length} students
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>Alerts dispatched to parents</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
            {lowAtt.slice(0, 6).map(s => (
              <div key={s.id} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(217,119,6,0.2)', background: 'var(--warning-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-primary)' }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 1 }}>Roll: {s.roll_no} · {s.parent_phone}</div>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--danger)', fontFamily: 'monospace' }}>
                  {s.subject_attendance?.['DBMS'] || s.overall_attendance}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
