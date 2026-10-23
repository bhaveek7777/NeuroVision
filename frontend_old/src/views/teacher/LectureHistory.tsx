import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { AttendanceSession, AttendanceRecord } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ModificationRequestModal } from '../../components/modals/ModificationRequestModal';
import { History, Filter, Lock, Eye, FileEdit } from 'lucide-react';

export const LectureHistory: React.FC = () => {
  const { sessions } = useAttendance();
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterClass,   setFilterClass]   = useState('all');
  const [filterDiv,     setFilterDiv]     = useState('all');
  const [searchDate,    setSearchDate]    = useState('');
  const [selected,      setSelected]      = useState<AttendanceSession | null>(null);
  const [modTarget,     setModTarget]     = useState<{ session: AttendanceSession; record: AttendanceRecord } | null>(null);

  const filtered = sessions.filter(s => {
    if (filterSubject !== 'all' && s.subject !== filterSubject) return false;
    if (filterClass   !== 'all' && s.class_name !== filterClass) return false;
    if (filterDiv     !== 'all' && s.division !== filterDiv) return false;
    if (searchDate && !s.date.includes(searchDate)) return false;
    return true;
  });

  const selectStyle: React.CSSProperties = {
    padding: '6px 28px 6px 10px', background: 'var(--bg-surface)',
    border: '1px solid var(--border-strong)', borderRadius: 8,
    fontSize: 12, color: 'var(--tx-primary)', cursor: 'pointer', outline: 'none',
    appearance: 'none' as any,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
          <History size={18} style={{ color: 'var(--accent)' }} />
          <h2 className="nv-page-title">Lecture Attendance History</h2>
        </div>
        <p className="nv-page-subtitle">Verified lecture records with student roll audits</p>
      </div>

      {/* Filters */}
      <div className="nv-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--tx-muted)', fontSize: 12, fontWeight: 600 }}>
          <Filter size={13} /> Filters
        </div>
        {[
          { val: filterSubject, setter: setFilterSubject, opts: [['all','All Subjects'],['DBMS','DBMS'],['Operating Systems','Operating Systems'],['Machine Learning','Machine Learning'],['Computer Networks','Computer Networks']] },
          { val: filterClass,   setter: setFilterClass,   opts: [['all','All Classes'],['TE Computer','TE Computer'],['BE Computer','BE Computer'],['SE IT','SE IT']] },
          { val: filterDiv,     setter: setFilterDiv,     opts: [['all','All Divisions'],['C','Div C'],['A','Div A'],['B','Div B']] },
        ].map(({ val, setter, opts }) => (
          <select key={opts[0][0]} value={val} onChange={e => setter(e.target.value)} style={selectStyle}>
            {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        <input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)}
          style={{ ...selectStyle, padding: '6px 10px' }} />
        {(filterSubject !== 'all' || filterClass !== 'all' || filterDiv !== 'all' || searchDate) && (
          <button className="nv-link" style={{ marginLeft: 'auto', fontSize: 11 }} onClick={() => { setFilterSubject('all'); setFilterClass('all'); setFilterDiv('all'); setSearchDate(''); }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="nv-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="nv-table">
            <thead>
              <tr>
                {['Date & Time','Subject','Class & Div','Room','Present','Absent','Attendance %','Status',''].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--tx-muted)', fontSize: 12 }}>No sessions match the selected filters.</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>
                    <div style={{ color: 'var(--tx-primary)' }}>{s.date}</div>
                    <div style={{ color: 'var(--tx-muted)', fontSize: 10, marginTop: 1 }}>{s.time}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{s.subject}</td>
                  <td style={{ color: 'var(--tx-secondary)' }}>{s.class_name} – Div {s.division}</td>
                  <td style={{ color: 'var(--tx-muted)' }}>{s.classroom}</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)', fontFamily: 'monospace' }}>{s.present_count}</td>
                  <td style={{ fontWeight: 700, color: 'var(--danger)', fontFamily: 'monospace' }}>{s.absent_count}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--tx-primary)' }}>{s.attendance_percentage}%</span>
                      <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--bg-raised)', overflow: 'hidden' }}>
                        <div style={{ width: `${s.attendance_percentage}%`, height: '100%', background: 'var(--success)', borderRadius: 99 }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                      <Lock size={10} /> Locked
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => setSelected(s)} className="nv-btn-primary" style={{ padding: '5px 10px', gap: 5, fontSize: 11 }}>
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roster modal */}
      {selected && (
        <Modal isOpen onClose={() => setSelected(null)} title={`Attendance Roster — ${selected.subject}`}
          subtitle={`${selected.class_name} – Div ${selected.division} · ${selected.date} · ${selected.id}`}
          maxWidth="4xl"
          footer={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ fontSize: 11, color: 'var(--tx-muted)' }}>To modify a locked entry, click "Request Correction"</span>
              <button onClick={() => setSelected(null)} className="nv-btn-secondary">Close</button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {[
                { label: 'Total Enrolled', value: selected.total_students, color: 'var(--tx-primary)' },
                { label: 'Present',        value: selected.present_count,  color: 'var(--success)' },
                { label: 'Absent',         value: selected.absent_count,   color: 'var(--danger)' },
                { label: 'Attendance %',   value: `${selected.attendance_percentage}%`, color: 'var(--accent)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-raised)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--tx-muted)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ maxHeight: 340, overflowY: 'auto', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table className="nv-table">
                <thead>
                  <tr>{['ID','Name','Roll','Status','Confidence','Verification',''].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {(selected.records || []).map(rec => (
                    <tr key={rec.student_id}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--tx-muted)', fontSize: 11 }}>{rec.student_id}</td>
                      <td style={{ fontWeight: 600 }}>{rec.student_name}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--tx-secondary)' }}>{rec.roll_no}</td>
                      <td><Badge variant={rec.status === 'Present' ? 'present' : 'absent'} size="sm">{rec.status}</Badge></td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--tx-secondary)' }}>{rec.confidence_score > 0 ? `${rec.confidence_score}%` : '—'}</td>
                      <td style={{ fontSize: 11, color: 'var(--tx-muted)' }}>{rec.verification_status}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button onClick={() => setModTarget({ session: selected, record: rec })}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)', cursor: 'pointer' }}>
                          <FileEdit size={11} /> Request Correction
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {modTarget && (
        <ModificationRequestModal isOpen onClose={() => setModTarget(null)} session={modTarget.session} record={modTarget.record} />
      )}
    </div>
  );
};
