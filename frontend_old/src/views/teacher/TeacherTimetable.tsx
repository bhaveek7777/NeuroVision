import React from 'react';
import { CalendarDays, MapPin } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

interface Props { onStartAttendanceWizard?: () => void; }

export const TeacherTimetable: React.FC<Props> = ({ onStartAttendanceWizard }) => {
  const { timetable, currentUser } = useAttendance();
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
          <CalendarDays size={18} style={{ color: 'var(--accent)' }} />
          <h2 className="nv-page-title">Faculty Lecture Timetable</h2>
        </div>
        <p className="nv-page-subtitle">Assigned sessions for {currentUser.name}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {days.map((day, idx) => {
          const isToday = idx === 0;
          const dayLecs = isToday ? timetable : [];
          return (
            <div key={day} className="nv-card" style={{ padding: 18, borderColor: isToday ? 'var(--accent)' : 'var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx-primary)' }}>{day}</span>
                  {isToday && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'var(--success-bg)', color: 'var(--success-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Today
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: 'var(--tx-muted)', fontFamily: 'monospace' }}>{dayLecs.length} lec</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dayLecs.length > 0 ? dayLecs.map(lec => (
                  <div key={lec.id} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx-primary)' }}>{lec.subject}</span>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 600 }}>#{lec.lecture_no}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--tx-secondary)', marginBottom: 6 }}>
                      <span>{lec.class_name} – Div {lec.division}</span>
                      <span style={{ fontFamily: 'monospace' }}>{lec.start_time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--tx-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={10} style={{ color: 'var(--accent)' }} />{lec.classroom}
                      </span>
                      {onStartAttendanceWizard && (
                        <button onClick={onStartAttendanceWizard} className="nv-link" style={{ fontSize: 11 }}>Mark Now →</button>
                      )}
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '28px 0', textAlign: 'center', fontSize: 12, color: 'var(--tx-muted)', fontStyle: 'italic' }}>
                    {idx > 0 && idx < 5 ? 'Regular department slots' : 'No scheduled lectures'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
