import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeFilePart(value) {
  return String(value || "attendance-report")
    .trim()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function getReportRows(students, sessions, records, mode, selectedSubjectId, threshold) {
  const sessionById = new Map((sessions || []).map((session) => [String(session.id), session]));
  const studentById = new Map((students || []).map((student) => [String(student.id), student]));
  const aggregates = new Map();

  (records || []).forEach((record) => {
    const student = studentById.get(String(record.student_id));
    const session = sessionById.get(String(record.session_id));
    if (!student || !session) return;

    if (
      mode === "subject" &&
      selectedSubjectId !== "all" &&
      String(session.subject_id) !== String(selectedSubjectId)
    ) return;

    const subjectKey = mode === "subject" ? String(session.subject_id) : "overall";
    const key = `${student.id}:${subjectKey}`;

    if (!aggregates.has(key)) {
      aggregates.set(key, {
        id: student.id,
        student_id_code: student.student_id_code || student.id,
        roll_number: student.roll_number ?? "",
        name: student.name || "",
        className: session.divisions?.classes?.name || "",
        divisionName: session.divisions?.name || "",
        subjectName: session.subjects?.name || "Unknown subject",
        subjectId: session.subject_id,
        present: 0,
        total: 0,
      });
    }

    const row = aggregates.get(key);
    row.total += 1;

    if (String(record.status || "").toLowerCase() === "present") {
      row.present += 1;
    }

    if (!row.className && session.divisions?.classes?.name) {
      row.className = session.divisions.classes.name;
    }

    if (!row.divisionName && session.divisions?.name) {
      row.divisionName = session.divisions.name;
    }
  });

  return Array.from(aggregates.values())
    .map((row) => ({
      ...row,
      pct: row.total ? Math.round((row.present / row.total) * 100) : 0,
    }))
    .filter((row) => row.total > 0 && row.pct < threshold)
    .sort((a, b) => a.pct - b.pct || a.name.localeCompare(b.name));
}

function buildReportHtml({ rows, mode, threshold, subjectLabel, generatedAt }) {
  const reportTitle = mode === "overall"
    ? "OVERALL ATTENDANCE DEFAULTER REPORT"
    : "SUBJECT-WISE ATTENDANCE DEFAULTER REPORT";

  const rowsHtml = rows.length
    ? rows.map((row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(row.student_id_code)}</td>
        <td>${escapeHtml(row.roll_number)}</td>
        <td>${escapeHtml(row.name)}</td>
        ${mode === "subject" ? `<td>${escapeHtml(row.subjectName)}</td>` : ""}
        <td>${escapeHtml([
          row.className,
          row.divisionName ? `Div ${row.divisionName}` : ""
        ].filter(Boolean).join(" / ") || "—")}</td>
        <td>${row.present}</td>
        <td>${row.total}</td>
        <td class="percentage">${row.pct}%</td>
      </tr>`).join("")
    : `<tr><td colspan="${mode === "subject" ? 9 : 8}" class="empty">
        No students found below ${threshold}% attendance.
      </td></tr>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(reportTitle)}</title>
<style>
  @page { size: A4 landscape; margin: 16mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 11px; margin: 0; }
  .report { width: 100%; }
  .college { text-align: center; border-bottom: 2px solid #111; padding: 0 0 10px; margin-bottom: 12px; }
  .college h1 { font-size: 19px; margin: 0 0 5px; letter-spacing: .3px; }
  .college p { margin: 3px 0; font-size: 10px; }
  h2 { text-align: center; font-size: 14px; margin: 14px 0 8px; }
  .meta { display: flex; justify-content: space-between; gap: 14px; border: 1px solid #777; padding: 8px; margin-bottom: 12px; }
  .summary { margin: 0 0 12px; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #777; padding: 7px 6px; text-align: left; }
  th { background: #e9e9e9; font-weight: bold; }
  td.percentage { font-weight: bold; }
  .empty { text-align: center; padding: 20px; }
  .signatures { display: flex; justify-content: space-between; margin-top: 50px; page-break-inside: avoid; }
  .signature { width: 25%; text-align: center; border-top: 1px solid #111; padding-top: 7px; }
  .foot { margin-top: 18px; font-size: 9px; text-align: center; }
  @media screen { body { padding: 18px; } }
</style>
</head>
<body>
<div class="report">
  <header class="college">
    <h1>COLLEGE NAME</h1>
    <p>College Attendance Management System</p>
    <p>Official Attendance Report</p>
  </header>
  <h2>${escapeHtml(reportTitle)}</h2>
  <div class="meta">
    <span><strong>Report Type:</strong> ${mode === "overall" ? "Overall attendance" : "Subject-wise attendance"}</span>
    <span><strong>Threshold:</strong> Below ${threshold}%</span>
    <span><strong>Subject:</strong> ${mode === "subject" ? escapeHtml(subjectLabel) : "All subjects / overall"}</span>
    <span><strong>Generated:</strong> ${escapeHtml(generatedAt)}</span>
  </div>
  <p class="summary"><strong>Total defaulters:</strong> ${rows.length} &nbsp; | &nbsp; Students shown have attendance strictly below ${threshold}%.</p>
  <table>
    <thead><tr>
      <th>Sr. No.</th><th>Student ID</th><th>Roll No.</th><th>Student Name</th>
      ${mode === "subject" ? "<th>Subject</th>" : ""}
      <th>Class / Division</th><th>Attended</th><th>Total Lectures</th><th>Attendance %</th>
    </tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="signatures">
    <div class="signature">Prepared By</div>
    <div class="signature">Class Teacher</div>
    <div class="signature">Authorized Signature</div>
  </div>
  <p class="foot">This is a system-generated report. Please verify records before official use.</p>
</div>
</body>
</html>`;
}

function downloadBlob(content, mimeType, filename) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    teachers: 0, students: 0, classes: 0, subjects: 0,
    todaySessions: 0, presentToday: 0, absentToday: 0,
  });

  const [todayLectures, setTodayLectures] = useState([]);
  const [lowAttendance, setLowAttendance] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [cutoff, setCutoff] = useState(75);
  const [thresholdInput, setThresholdInput] = useState("75");
  const [reportMode, setReportMode] = useState("overall");
  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
  const [reportRows, setReportRows] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportError, setReportError] = useState("");

  const today = DAYS[new Date().getDay()];

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAll() {
    setLoading(true);

    await Promise.all([
      fetchStats(),
      fetchTodayLectures(),
      fetchCutoff(),
      fetchRecentActivity(),
      fetchSubjects(),
    ]);

    setLoading(false);
  }

  async function fetchStats() {
    const [t, s, c, sub] = await Promise.all([
      supabase.from("teachers").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("students").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("divisions").select("id", { count: "exact", head: true }),
      supabase.from("subjects").select("id", { count: "exact", head: true }),
    ]);

    const todayDate = new Date().toISOString().split("T")[0];

    const { data: sessions } = await supabase
      .from("attendance_sessions")
      .select("id")
      .eq("date", todayDate);

    let present = 0;
    let absent = 0;

    if (sessions?.length) {
      const ids = sessions.map((session) => session.id);

      const { data: recs } = await supabase
        .from("attendance_records")
        .select("status")
        .in("session_id", ids);

      recs?.forEach((record) => {
        if (record.status === "present") present++;
        else absent++;
      });
    }

    setStats({
      teachers: t.count || 0,
      students: s.count || 0,
      classes: c.count || 0,
      subjects: sub.count || 0,
      todaySessions: sessions?.length || 0,
      presentToday: present,
      absentToday: absent,
    });
  }

  async function fetchTodayLectures() {
    const { data } = await supabase
      .from("timetable")
      .select(`
        id, start_time, end_time, room,
        subjects(name),
        teachers(name),
        divisions(name, classes(name))
      `)
      .eq("day_of_week", today)
      .order("start_time");

    setTodayLectures(data || []);
  }

  async function fetchSubjects() {
    const { data, error } = await supabase
      .from("subjects")
      .select("id, name")
      .order("name");

    if (!error) setSubjects(data || []);
  }

  async function fetchCutoff() {
    const { data } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "attendance_cutoff")
      .maybeSingle();

    const savedCutoff = data ? Number(data.value) : 75;
    const validCutoff = Number.isFinite(savedCutoff) && savedCutoff >= 0 && savedCutoff <= 100
      ? savedCutoff
      : 75;

    setCutoff(validCutoff);
    setThresholdInput(String(validCutoff));
    await fetchLowAttendance(validCutoff);
  }

  async function fetchLowAttendance(cut) {
    const { data: students } = await supabase
      .from("students")
      .select("id, name, roll_number, student_id_code")
      .eq("is_active", true);

    if (!students?.length) {
      setLowAttendance([]);
      return;
    }

    const results = [];

    for (const student of students) {
      const { data: records } = await supabase
        .from("attendance_records")
        .select("status")
        .eq("student_id", student.id);

      if (!records?.length) continue;

      const total = records.length;
      const present = records.filter((record) => record.status === "present").length;
      const pct = Math.round((present / total) * 100);

      if (pct < cut) results.push({ ...student, pct, total, present });
    }

    results.sort((a, b) => a.pct - b.pct);
    setLowAttendance(results.slice(0, 10));
  }
  async function applyDefaulterFilter() {
    const parsedThreshold = Number(thresholdInput);

    if (
      !Number.isFinite(parsedThreshold) ||
      parsedThreshold < 0 ||
      parsedThreshold > 100
    ) {
      setReportError("Enter a threshold between 0 and 100.");
      return;
    }

    setReportLoading(true);
    setReportError("");

    try {
      const [
        { data: students, error: studentError },
        { data: sessions, error: sessionError },
      ] = await Promise.all([
        supabase
          .from("students")
          .select("id, name, roll_number, student_id_code")
          .eq("is_active", true),

        supabase
          .from("attendance_sessions")
          .select("id, subject_id, division_id"),
      ]);

      if (studentError) throw studentError;
      if (sessionError) throw sessionError;
      const [{ data: subjectData, error: subjectError },
       { data: divisionData, error: divisionError }] = await Promise.all([
  supabase.from("subjects").select("id, name"),
  supabase.from("divisions").select("id, name, class_id"),
]);

if (subjectError) throw subjectError;
if (divisionError) throw divisionError;

const { data: classes, error: classError } = await supabase
  .from("classes")
  .select("id, name");

if (classError) throw classError;

const subjectMap = new Map(
  (subjectData || []).map(s => [String(s.id), s])
);

const classMap = new Map(
  (classes || []).map(c => [String(c.id), c])
);

const divisionMap = new Map(
  (divisionData || []).map(d => [
    String(d.id),
    {
      ...d,
      classes: classMap.get(String(d.class_id)) || null,
    },
  ])
);

const enrichedSessions = (sessions || []).map(session => ({
  ...session,
  subjects: subjectMap.get(String(session.subject_id)) || null,
  divisions: divisionMap.get(String(session.division_id)) || null,
}));

      const sessionList = enrichedSessions;

      if (!students?.length || !sessionList.length) {
        setReportRows([]);
        setCutoff(parsedThreshold);
        await saveCutoff(parsedThreshold);
        await fetchLowAttendance(parsedThreshold);
        return;
      }

      const sessionIds = sessionList.map((session) => session.id);
      const allRecords = [];

      for (let i = 0; i < sessionIds.length; i += 100) {
        const batch = sessionIds.slice(i, i + 100);

        const { data: records, error: recordError } = await supabase
          .from("attendance_records")
          .select("student_id, session_id, status")
          .in("session_id", batch);

        if (recordError) throw recordError;
        allRecords.push(...(records || []));
      }

      const rows = getReportRows(
        students,
        sessionList,
        allRecords,
        reportMode,
        selectedSubjectId,
        parsedThreshold
      );

      setReportRows(rows);
      setCutoff(parsedThreshold);

      await saveCutoff(parsedThreshold);
      await fetchLowAttendance(parsedThreshold);
    } catch (error) {
      setReportError(error.message || "Could not load defaulter data.");
    } finally {
      setReportLoading(false);
    }
  }

  async function saveCutoff(value) {
    const { data: existing, error: readError } = await supabase
      .from("system_settings")
      .select("key")
      .eq("key", "attendance_cutoff")
      .maybeSingle();

    if (readError) return;

    if (existing) {
      await supabase
        .from("system_settings")
        .update({ value: String(value) })
        .eq("key", "attendance_cutoff");
    } else {
      await supabase
        .from("system_settings")
        .insert({
          key: "attendance_cutoff",
          value: String(value),
        });
    }
  }

  async function fetchRecentActivity() {
    const { data } = await supabase
      .from("attendance_sessions")
      .select(`
        id, date, is_locked,
        subjects(name),
        teachers(name),
        divisions(name, classes(name))
      `)
      .order("created_at", { ascending: false })
      .limit(8);

    setRecentActivity(data || []);
  }

  const filteredReportRows = useMemo(
    () => reportRows,
    [reportRows]
  );

  const subjectLabel = selectedSubjectId === "all"
    ? "All Subjects"
    : subjects.find(
        (subject) => String(subject.id) === String(selectedSubjectId)
      )?.name || "Selected Subject";

  function reportSettings() {
    return {
      rows: filteredReportRows,
      mode: reportMode,
      threshold: cutoff,
      subjectLabel,
      generatedAt: new Date().toLocaleString("en-IN"),
    };
  }

  function downloadCsv() {
    const headers = [
      "Sr. No.",
      "Student ID",
      "Roll No.",
      "Student Name",
      ...(reportMode === "subject" ? ["Subject"] : []),
      "Class / Division",
      "Attended Lectures",
      "Total Lectures",
      "Attendance %",
    ];

    const values = filteredReportRows.map((row, index) => [
      index + 1,
      row.student_id_code,
      row.roll_number,
      row.name,
      ...(reportMode === "subject" ? [row.subjectName] : []),
      [
        row.className,
        row.divisionName ? `Div ${row.divisionName}` : "",
      ].filter(Boolean).join(" / "),
      row.present,
      row.total,
      `${row.pct}%`,
    ]);

    const csvCell = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headers, ...values]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");

    downloadBlob(
      "\uFEFF" + csv,
      "text/csv;charset=utf-8;",
      `${safeFilePart(reportMode)}-defaulters-${cutoff}-percent.csv`
    );
  }

  function downloadWord() {
    const html = buildReportHtml(reportSettings());

    downloadBlob(
      "\uFEFF" + html,
      "application/msword;charset=utf-8;",
      `${safeFilePart(reportMode)}-defaulters-${cutoff}-percent.doc`
    );
  }

  function downloadPdf() {
    const html = buildReportHtml(reportSettings());
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      setReportError(
        "Your browser blocked the report window. Allow pop-ups for this site, then try again."
      );
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }

  const totalToday = stats.presentToday + stats.absentToday;

  const pctToday = totalToday
    ? Math.round((stats.presentToday / totalToday) * 100)
    : 0;

  if (loading) {
    return <div className="page-loading">Loading dashboard…</div>;
  }
  return (
    <div>
      <div className="cards">
        <div className="card">
          <h3>Total Teachers</h3>
          <h2>{stats.teachers}</h2>
        </div>

        <div className="card green">
          <h3>Total Students</h3>
          <h2>{stats.students}</h2>
        </div>

        <div className="card blue">
          <h3>Classes / Divisions</h3>
          <h2>{stats.classes}</h2>
        </div>

        <div className="card">
          <h3>Total Subjects</h3>
          <h2>{stats.subjects}</h2>
        </div>

        <div className="card green">
          <h3>Present Today</h3>
          <h2>{stats.presentToday}</h2>
        </div>

        <div className="card red">
          <h3>Absent Today</h3>
          <h2>{stats.absentToday}</h2>
        </div>

        <div className="card blue">
          <h3>Today's Attendance</h3>
          <h2>{pctToday}%</h2>
        </div>

        <div className="card">
          <h3>Today's Lectures</h3>
          <h2>{stats.todaySessions}</h2>
        </div>
      </div>

      <div className="section">
        <h2>Today's Lectures ({today})</h2>

        {todayLectures.length === 0 ? (
          <p className="empty-state">
            No lectures scheduled for today.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Subject</th>
                  <th>Faculty</th>
                  <th>Class</th>
                  <th>Division</th>
                  <th>Room</th>
                </tr>
              </thead>

              <tbody>
                {todayLectures.map((lecture) => (
                  <tr key={lecture.id}>
                    <td>
                      {lecture.start_time?.slice(0, 5)} –{" "}
                      {lecture.end_time?.slice(0, 5)}
                    </td>
                    <td>{lecture.subjects?.name}</td>
                    <td>{lecture.teachers?.name}</td>
                    <td>{lecture.divisions?.classes?.name}</td>
                    <td>{lecture.divisions?.name}</td>
                    <td>{lecture.room || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="section">
        <h2>⚠️ Defaulter Management</h2>

        <p className="empty-state" style={{ textAlign: "left" }}>
          Choose overall or subject-wise attendance, set a threshold,
          and generate a report.
        </p>

        <div className="defaulter-controls">
          <div className="defaulter-field">
            <label htmlFor="report-mode">Report Type</label>

            <select
              id="report-mode"
              value={reportMode}
              onChange={(event) => setReportMode(event.target.value)}
            >
              <option value="overall">Overall Attendance</option>
              <option value="subject">Subject-wise Attendance</option>
            </select>
          </div>

          {reportMode === "subject" && (
            <div className="defaulter-field">
              <label htmlFor="report-subject">Subject</label>

              <select
                id="report-subject"
                value={selectedSubjectId}
                onChange={(event) =>
                  setSelectedSubjectId(event.target.value)
                }
              >
                <option value="all">All Subjects</option>

                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="defaulter-field">
            <label htmlFor="attendance-threshold">
              Minimum Attendance (%)
            </label>

            <input
              id="attendance-threshold"
              type="number"
              min="0"
              max="100"
              step="1"
              value={thresholdInput}
              onChange={(event) =>
                setThresholdInput(event.target.value)
              }
            />
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={applyDefaulterFilter}
            disabled={reportLoading}
          >
            {reportLoading ? "Generating…" : "Apply Filter"}
          </button>
        </div>

        {reportError && (
          <div className="alert-error" role="alert">
            {reportError}
          </div>
        )}

        <div className="defaulter-downloads">
          <strong>Download report:</strong>

          <button
            type="button"
            className="btn-secondary"
            onClick={downloadCsv}
            disabled={!reportRows.length}
          >
            Download CSV
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={downloadPdf}
            disabled={!reportRows.length}
          >
            Download PDF
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={downloadWord}
            disabled={!reportRows.length}
          >
            Download Word
          </button>

          <span className="defaulter-count">
            {reportRows.length} defaulter record(s)
          </span>
        </div>

        {reportRows.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Roll No.</th>
                  <th>Name</th>

                  {reportMode === "subject" && <th>Subject</th>}

                  <th>Class / Division</th>
                  <th>Attended</th>
                  <th>Total</th>
                  <th>Percentage</th>
                </tr>
              </thead>

              <tbody>
                {reportRows.map((student, index) => (
                  <tr
                    key={`${student.id}-${student.subjectId || "overall"}-${index}`}
                  >
                    <td>{student.student_id_code}</td>
                    <td>{student.roll_number}</td>
                    <td>{student.name}</td>

                    {reportMode === "subject" && (
                      <td>{student.subjectName}</td>
                    )}

                    <td>
                      {[
                        student.className,
                        student.divisionName
                          ? `Div ${student.divisionName}`
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" / ") || "—"}
                    </td>

                    <td>{student.present}</td>
                    <td>{student.total}</td>
                    <td className="absent">{student.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">
            Click Apply Filter to generate the full defaulter list.
            The initial dashboard list below shows the current top
            10 overall defaulters.
          </p>
        )}
      </div>

      {lowAttendance.length > 0 && (
        <div className="section">
          <h2>
            Low Attendance Students (below {cutoff}%) — Top 10 Overall
          </h2>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Attended</th>
                  <th>Total</th>
                  <th>Percentage</th>
                </tr>
              </thead>

              <tbody>
                {lowAttendance.map((student) => (
                  <tr key={student.id}>
                    <td>{student.student_id_code}</td>
                    <td>{student.roll_number}</td>
                    <td>{student.name}</td>
                    <td>{student.present}</td>
                    <td>{student.total}</td>
                    <td className="absent">{student.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="section">
        <h2>Recent Attendance Activity</h2>

        {recentActivity.length === 0 ? (
          <p className="empty-state">
            No attendance recorded yet.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>Class</th>
                  <th>Division</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {recentActivity.map((session) => (
                  <tr key={session.id}>
                    <td>{session.date}</td>
                    <td>{session.subjects?.name}</td>
                    <td>{session.teachers?.name}</td>
                    <td>{session.divisions?.classes?.name}</td>
                    <td>{session.divisions?.name}</td>
                    <td>
                      <span
                        className={
                          session.is_locked
                            ? "badge-locked"
                            : "badge-open"
                        }
                      >
                        {session.is_locked ? "Locked" : "Open"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}