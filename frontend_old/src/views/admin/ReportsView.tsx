import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { Badge } from '../../components/common/Badge';
import { FileText, Download, Printer, FileSpreadsheet } from 'lucide-react';

type ReportType = 'daily' | 'monthly' | 'student' | 'class' | 'subject' | 'teacher';

export const ReportsView: React.FC = () => {
  const { students, teachers, sessions, settings } = useAttendance();
  const [reportType,      setReportType]      = useState<ReportType>('daily');
  const [selectedClass,   setSelectedClass]   = useState('TE Computer');
  const [selectedDiv,     setSelectedDiv]     = useState('C');
  const [selectedSubject, setSelectedSubject] = useState('DBMS');

  const handleCSV = () => {
    const dateStr = new Date().toISOString().slice(0,10);
    const headers = ['Student ID','Roll No','Student Name','Class','Division','Subject','Attendance %','Status'];
    const rows    = students.map(s => {
      const att = s.subject_attendance?.[selectedSubject] || s.overall_attendance;
      return [s.student_id, s.roll_no, `"${s.name}"`, s.class_id, s.division, selectedSubject, `${att}%`, att >= settings.min_attendance_threshold ? 'Compliant' : 'Defaulter'];
    });
    const csv  = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `NeuroVision_${reportType.toUpperCase()}_${dateStr}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const tabs: { id: ReportType; label: string }[] = [
    { id: 'daily',   label: 'Daily' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'student', label: 'Student Roll' },
    { id: 'class',   label: 'Class / Division' },
    { id: 'subject', label: 'Subject-wise' },
    { id: 'teacher', label: 'Faculty Load' },
  ];

  const selectStyle: React.CSSProperties = {
    padding: '6px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
    borderRadius: 8, fontSize: 12, color: 'var(--tx-primary)', outline: 'none', cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
            <FileText size={18} style={{ color: 'var(--accent)' }} />
            <h2 className="nv-page-title">Report Generation</h2>
          </div>
          <p className="nv-page-subtitle">Export attendance logs for examinations, departmental records, and parent conferences</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleCSV} className="nv-btn-secondary" style={{ gap: 6 }}>
            <FileSpreadsheet size={13} /> Export CSV
          </button>
          <button onClick={() => window.print()} className="nv-btn-primary" style={{ gap: 6 }}>
            <Printer size={13} /> Print / PDF
          </button>
        </div>
      </div>

      {/* Report type tabs */}
      <div className="nv-tabs">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setReportType(t.id)} className={`nv-tab${reportType === t.id ? ' active' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="nv-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
        {[
          { label: 'Class', val: selectedClass, setter: setSelectedClass, opts: [['TE Computer','TE Computer'],['BE Computer','BE Computer'],['SE IT','SE IT']] },
          { label: 'Division', val: selectedDiv, setter: setSelectedDiv, opts: [['C','Division C'],['A','Division A'],['B','Division B']] },
          { label: 'Subject', val: selectedSubject, setter: setSelectedSubject, opts: [['DBMS','DBMS'],['Operating Systems','Operating Systems'],['Machine Learning','Machine Learning'],['Computer Networks','Computer Networks']] },
        ].map(({ label, val, setter, opts }) => (
          <div key={label}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
            <select value={val} onChange={e => setter(e.target.value)} style={selectStyle}>
              {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: 'var(--tx-muted)', marginBottom: 2 }}>Generated at</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', fontFamily: 'monospace' }}>
            {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
          </div>
        </div>
      </div>

      {/* Report document */}
      <div className="nv-card" style={{ padding: '28px 32px' }}>
        {/* College header */}
        <div style={{ textAlign: 'center', paddingBottom: 20, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{settings.college_name}</div>
          <div style={{ fontSize: 12, color: 'var(--tx-secondary)', marginTop: 3 }}>{settings.department} · Code: {settings.college_code}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {reportType.toUpperCase()} Attendance Report
          </div>
          <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 3, fontFamily: 'monospace' }}>
            {settings.academic_year} · Mandatory Threshold: {settings.min_attendance_threshold}%
          </div>
        </div>

        {/* Data table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="nv-table">
            <thead>
              <tr>{['Student ID','Roll No','Name','Class','Attendance','Overall','Contact','Status'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {students.slice(0, 15).map(s => {
                const att = s.subject_attendance?.[selectedSubject] || s.overall_attendance;
                const bad = att < settings.min_attendance_threshold;
                return (
                  <tr key={s.student_id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--tx-muted)', fontSize: 11 }}>{s.student_id}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--tx-secondary)' }}>{s.roll_no}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ color: 'var(--tx-secondary)' }}>{s.class_id} – {s.division}</td>
                    <td style={{ fontWeight: 700, color: bad ? 'var(--danger)' : 'var(--success)', fontFamily: 'monospace' }}>{att}%</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--tx-secondary)' }}>{s.overall_attendance}%</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--tx-muted)' }}>{s.parent_phone}</td>
                    <td><Badge variant={bad ? 'absent' : 'present'} size="sm">{bad ? 'Defaulter' : 'Compliant'}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, paddingTop: 40, marginTop: 32, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          {[['Course Instructor','Prof. Ramesh Sharma'],['Head of Department','Dr. Rajesh Gupta'],['Principal / Dean','Dr. Arvind Kulkarni']].map(([role, name]) => (
            <div key={role}>
              <div style={{ width: 120, borderBottom: '1px solid var(--border-strong)', margin: '0 auto 8px' }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-primary)' }}>{role}</div>
              <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 2 }}>{name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
