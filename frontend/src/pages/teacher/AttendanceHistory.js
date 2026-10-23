
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../context/AuthContext";

export default function AttendanceHistory() {
  const { assignmentId } = useParams();
  const { teacher } = useAuth();

  const [assignment, setAssignment] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);
  const [detailRecords, setDetailRecords] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (assignmentId && teacher?.id) {
      loadPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, teacher?.id]);

  async function loadPage() {
    setLoading(true);
    setError("");

    try {
      const {
        data: assignmentData,
        error: assignmentError,
      } = await supabase
        .from("teacher_assignments")
        .select(`
          id,
          teacher_id,
          subject_id,
          division_id,
          subjects (
            id,
            name,
            code
          ),
          divisions (
            id,
            name,
            class_id,
            classes (
              id,
              name
            )
          )
        `)
        .eq("id", assignmentId)
        .eq("teacher_id", teacher.id)
        .single();

      if (assignmentError) throw assignmentError;

      setAssignment(assignmentData);

      let query = supabase
        .from("attendance_sessions")
        .select(`
          id,
          teacher_id,
          subject_id,
          division_id,
          date,
          attendance_date,
          start_time,
          end_time,
          is_locked,
          timetable_id
        `)
        .eq("teacher_id", teacher.user_id)
        .eq("subject_id", assignmentData.subject_id)
        .eq("division_id", assignmentData.division_id)
        .order("date", { ascending: false });

      if (filterFrom) {
        query = query.gte("date", filterFrom);
      }

      if (filterTo) {
        query = query.lte("date", filterTo);
      }

      const {
        data: sessionData,
        error: sessionError,
      } = await query;

      if (sessionError) throw sessionError;

      const enrichedSessions = await Promise.all(
        (sessionData || []).map(async (session) => {
          const {
            data: records,
            error: recordsError,
          } = await supabase
            .from("attendance_records")
            .select("status")
            .eq("session_id", session.id);

          if (recordsError) {
            console.error(
              "Attendance records error:",
              recordsError
            );
          }

          const total = records?.length || 0;

          const present =
            records?.filter(
              (record) =>
                String(record.status).toLowerCase() === "present"
            ).length || 0;

          const absent = total - present;

          const percentage =
            total > 0
              ? Math.round((present / total) * 100)
              : 0;

          return {
            ...session,
            total,
            present,
            absent,
            percentage,
          };
        })
      );

      setSessions(enrichedSessions);
    } catch (err) {
      console.error("Attendance history error:", err);
      setError(
        err.message || "Unable to load attendance history."
      );
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    loadPage();
  }

  function clearFilters() {
    setFilterFrom("");
    setFilterTo("");

    setTimeout(() => {
      loadPage();
    }, 0);
  }

  // =========================================================
  // VIEW DETAILS
  // =========================================================

  async function viewDetails(session) {
    setSelectedSession(session);
    setDetailLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("attendance_records")
        .select(`
          student_id,
          status,
          students (
            id,
            roll_number,
            name
          )
        `)
        .eq("session_id", session.id);

      if (error) throw error;

      const records = (data || []).map((record) => ({
        ...record,
        status: String(record.status || "").toLowerCase(),
      }));

      setDetailRecords(records);
    } catch (err) {
      console.error("Detail error:", err);
      setError(
        err.message || "Could not load attendance details."
      );
      setDetailRecords([]);
    } finally {
      setDetailLoading(false);
    }
  }

  // =========================================================
  // PRINT ATTENDANCE REPORT
  // =========================================================

  async function printReport(session) {
    try {
      const { data: records, error } = await supabase
        .from("attendance_records")
        .select(`
          status,
          students (
            id,
            roll_number,
            name
          )
        `)
        .eq("session_id", session.id);

      if (error) throw error;

      const printWindow = window.open("", "_blank");

      if (!printWindow) {
        alert("Please allow pop-ups to print the report.");
        return;
      }

      const presentCount = (records || []).filter(
        (record) =>
          String(record.status || "").toLowerCase() === "present"
      ).length;

      const total = (records || []).length;
      const absentCount = total - presentCount;

      const percentage =
        total > 0
          ? ((presentCount / total) * 100).toFixed(1)
          : "0.0";

      const escapeHtml = (value) =>
        String(value ?? "").replace(/[&<>"']/g, (char) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char]);

      const formatTime = (value) => {
        if (!value) return "-";

        const match = String(value).match(/^(\d{1,2}):(\d{2})/);

        if (match) {
          let hours = Number(match[1]);
          const minutes = match[2];
          const period = hours >= 12 ? "PM" : "AM";

          hours = hours % 12 || 12;

          return `${hours}:${minutes} ${period}`;
        }

        const parsed = new Date(value);

        return Number.isNaN(parsed.getTime())
          ? "-"
          : parsed.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            });
      };

      const studentRows = (records || [])
        .slice()
        .sort((a, b) =>
          String(a.students?.roll_number ?? "").localeCompare(
            String(b.students?.roll_number ?? ""),
            undefined,
            { numeric: true }
          )
        )
        .map((record) => {
          const isPresent =
            String(record.status || "").toLowerCase() === "present";

          return `
            <tr>
              <td>${escapeHtml(record.students?.roll_number || "-")}</td>
              <td>${escapeHtml(record.students?.name || "-")}</td>
              <td class="status">
                ${isPresent ? "Present" : "Absent"}
              </td>
            </tr>
          `;
        })
        .join("");

      const generatedAt = new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport"
                content="width=device-width, initial-scale=1.0" />

          <title>
            Student Attendance Report - ${escapeHtml(session.date)}
          </title>

          <style>
            @page {
              size: A4;
              margin: 15mm 14mm 18mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              color: #000;
              background: #fff;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 11px;
              line-height: 1.45;
            }

            .report {
              width: 100%;
            }

            .institution-header {
              display: grid;
              grid-template-columns: 88px 1fr 88px;
              align-items: center;
              gap: 10px;
              padding-bottom: 12px;
              border-bottom: 2px solid #000;
              text-align: center;
            }

            .logo-space {
              width: 82px;
              height: 72px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 9px;
              color: #555;
              border: 1px dashed #aaa;
            }

            .institution-name {
              margin: 0 0 5px;
              font-family: Georgia, "Times New Roman", serif;
              font-size: 17px;
              line-height: 1.25;
              font-weight: 700;
            }

            .department {
              margin: 0 0 8px;
              font-size: 12px;
              font-weight: 600;
            }

            .report-title {
              margin: 0;
              font-family: Georgia, "Times New Roman", serif;
              font-size: 17px;
              font-weight: 700;
              letter-spacing: 0.5px;
            }

            .report-subtitle {
              margin-top: 4px;
              font-size: 10px;
            }

            .metadata {
              margin-top: 15px;
              padding: 10px 12px;
              border: 1px solid #777;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px 22px;
            }

            .meta-item {
              display: grid;
              grid-template-columns: 105px 10px 1fr;
              align-items: start;
              gap: 4px;
            }

            .meta-label {
              font-weight: 700;
            }

            .summary-heading,
            .table-heading {
              margin: 19px 0 8px;
              padding-bottom: 5px;
              border-bottom: 1px solid #000;
              font-size: 12px;
              font-weight: 700;
            }

            .summary {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              border: 1px solid #777;
            }

            .summary-item {
              padding: 9px 5px;
              text-align: center;
              border-right: 1px solid #999;
            }

            .summary-item:last-child {
              border-right: none;
            }

            .summary-label {
              display: block;
              margin-bottom: 4px;
              font-size: 10px;
            }

            .summary-value {
              font-size: 15px;
              font-weight: 700;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }

            thead {
              display: table-header-group;
            }

            tr {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            th,
            td {
              border: 1px solid #777;
              padding: 7px 9px;
              text-align: left;
              overflow-wrap: anywhere;
            }

            th {
              background: #eee;
              color: #000;
              font-weight: 700;
            }

            th:first-child,
            td:first-child {
              width: 18%;
            }

            th:last-child,
            td:last-child {
              width: 22%;
            }

            .status {
              font-weight: 600;
            }

            .report-note {
              margin-top: 9px;
              font-size: 10px;
            }

            .signature-area {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 45px;
              margin-top: 58px;
            }

            .signature {
              padding-top: 7px;
              border-top: 1px solid #000;
              text-align: center;
              font-weight: 600;
            }

            .footer {
              margin-top: 22px;
              padding-top: 7px;
              border-top: 1px solid #999;
              display: flex;
              justify-content: space-between;
              gap: 12px;
              font-size: 9px;
            }

            @media screen {
              body {
                max-width: 210mm;
                margin: 20px auto;
                padding: 15mm;
                box-shadow: 0 0 5px #aaa;
              }
            }

            @media print {
              body {
                margin: 0;
                padding: 0;
              }

              th {
                background: #eee !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>

        <body>
          <main class="report">
            <header class="institution-header">
              <div class="logo-space">College Logo</div>

              <div>
                <h1 class="institution-name">
                  K. K. Wagh Institute of Engineering Education &amp; Research, Nashik
                </h1>

                <p class="department">
                  Department of Information Technology
                </p>

                <h2 class="report-title">
                  STUDENT ATTENDANCE REPORT
                </h2>

                <div class="report-subtitle">
                  Daily Lecture Attendance
                </div>
              </div>

              <div></div>
            </header>

            <section class="metadata">
              <div class="meta-item">
                <span class="meta-label">Class</span>
                <span>:</span>
                <span>${escapeHtml(className)}</span>
              </div>

              <div class="meta-item">
                <span class="meta-label">Report Date</span>
                <span>:</span>
                <span>${escapeHtml(session.date)}</span>
              </div>

              <div class="meta-item">
                <span class="meta-label">Subject</span>
                <span>:</span>
                <span>${escapeHtml(subjectName)}${
                  subjectCode ? ` (${escapeHtml(subjectCode)})` : ""
                }</span>
              </div>

              <div class="meta-item">
                <span class="meta-label">Division</span>
                <span>:</span>
                <span>${escapeHtml(divisionName)}</span>
              </div>

              <div class="meta-item">
                <span class="meta-label">Faculty</span>
                <span>:</span>
                <span>${escapeHtml(teacher?.name || "Teacher")}</span>
              </div>

              <div class="meta-item">
                <span class="meta-label">Lecture Time</span>
                <span>:</span>
                <span>${escapeHtml(formatTime(session.start_time))}${
                  session.end_time
                    ? ` - ${escapeHtml(formatTime(session.end_time))}`
                    : ""
                }</span>
              </div>

              <div class="meta-item">
                <span class="meta-label">Session ID</span>
                <span>:</span>
                <span>${escapeHtml(session.id)}</span>
              </div>

              <div class="meta-item">
                <span class="meta-label">Generated On</span>
                <span>:</span>
                <span>${escapeHtml(generatedAt)}</span>
              </div>
            </section>

            <h3 class="summary-heading">Attendance Summary</h3>

            <section class="summary">
              <div class="summary-item">
                <span class="summary-label">Total Students</span>
                <span class="summary-value">${total}</span>
              </div>

              <div class="summary-item">
                <span class="summary-label">Present</span>
                <span class="summary-value">${presentCount}</span>
              </div>

              <div class="summary-item">
                <span class="summary-label">Absent</span>
                <span class="summary-value">${absentCount}</span>
              </div>

              <div class="summary-item">
                <span class="summary-label">Attendance</span>
                <span class="summary-value">${percentage}%</span>
              </div>
            </section>

            <h3 class="table-heading">
              Student-wise Attendance Details
            </h3>

            <table>
              <thead>
                <tr>
                  <th>Roll No.</th>
                  <th>Student Name</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                ${studentRows || `
                  <tr>
                    <td colspan="3">No attendance records found.</td>
                  </tr>
                `}
              </tbody>
            </table>

            <p class="report-note">
              This report represents the attendance recorded for the lecture
              specified above.
            </p>

            <section class="signature-area">
              <div class="signature">Subject Teacher</div>
              <div class="signature">Head of Department</div>
            </section>

            <footer class="footer">
              <span>Department of Information Technology</span>
              <span>Generated by NeuroVision Smart Attendance System</span>
            </footer>
          </main>
        </body>
        </html>
      `);

      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } catch (err) {
      console.error("Print report error:", err);
      alert("Could not generate attendance report.");
    }
  }

  // =========================================================
  // EDIT ATTENDANCE STATUS
  // =========================================================

  function changeStatus(studentId, newStatus) {
    setDetailRecords((previous) =>
      previous.map((record) => {
        const currentStudentId =
          record.student_id ?? record.students?.id;

        if (String(currentStudentId) !== String(studentId)) {
          return record;
        }

        return {
          ...record,
          status: newStatus,
        };
      })
    );
  }

  // =========================================================
  // SAVE ATTENDANCE CHANGES
  // =========================================================

  async function saveChanges() {
    if (!selectedSession) return;

    setSaving(true);
    setError("");

    try {
      for (const record of detailRecords) {
        const studentId =
          record.student_id ?? record.students?.id;

        if (studentId == null) {
          throw new Error(
            `Missing student ID for ${record.students?.name || "a student"}.`
          );
        }

        const status = String(record.status || "").toLowerCase();

        if (!["present", "absent"].includes(status)) {
          throw new Error(
            `Invalid attendance status for ${record.students?.name || "a student"}.`
          );
        }

        const { data, error: updateError } = await supabase
          .from("attendance_records")
          .update({ status })
          .eq("session_id", selectedSession.id)
          .eq("student_id", studentId)
          .select("session_id, student_id, status");

        if (updateError) throw updateError;

        if (!data || data.length === 0) {
          throw new Error(
            `No row was updated for ${
              record.students?.name || `student ID ${studentId}`
            }. Check your Supabase update permissions (RLS).`
          );
        }
      }

      const present = detailRecords.filter(
        (record) =>
          String(record.status).toLowerCase() === "present"
      ).length;

      const total = detailRecords.length;
      const absent = total - present;

      const percentage =
        total > 0
          ? Math.round((present / total) * 100)
          : 0;

      setSessions((previous) =>
        previous.map((session) =>
          session.id === selectedSession.id
            ? { ...session, present, absent, percentage }
            : session
        )
      );

      setSelectedSession((previous) =>
        previous
          ? { ...previous, present, absent, percentage }
          : previous
      );

      alert("Attendance changes saved successfully.");
    } catch (err) {
      console.error("Save attendance error:", err);
      setError(err.message || "Could not save attendance changes.");
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="section">
        <h2>Loading Attendance History...</h2>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error && !selectedSession) {
    return (
      <div className="section">
        <h2>Attendance History</h2>
        <div className="alert-error">{error}</div>
      </div>
    );
  }

  // =========================================================
  // ASSIGNMENT INFORMATION
  // =========================================================

  const subjectName =
    assignment?.subjects?.name || "Unknown Subject";

  const subjectCode =
    assignment?.subjects?.code || "";

  const divisionName =
    assignment?.divisions?.name || "Unknown Division";

  const className =
    assignment?.divisions?.classes?.name || "Unknown Class";

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="section">
      <div style={{ marginBottom: "30px" }}>
        <h1>Attendance History</h1>

        <p
          style={{
            color: "#666",
            marginTop: "8px",
            fontSize: "16px",
          }}
        >
          View and edit previously recorded attendance.
        </p>
      </div>

      {/* SELECTED SUBJECT / CLASS */}

      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "25px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "50px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "13px",
                color: "#777",
                marginBottom: "5px",
              }}
            >
              Subject
            </div>

            <strong>{subjectName}</strong>

            {subjectCode && (
              <span style={{ color: "#777", marginLeft: "8px" }}>
                ({subjectCode})
              </span>
            )}
          </div>

          <div>
            <div
              style={{
                fontSize: "13px",
                color: "#777",
                marginBottom: "5px",
              }}
            >
              Class
            </div>

            <strong>{className}</strong>
          </div>

          <div>
            <div
              style={{
                fontSize: "13px",
                color: "#777",
                marginBottom: "5px",
              }}
            >
              Division
            </div>

            <strong>{divisionName}</strong>
          </div>
        </div>
      </div>

      {/* DATE FILTER */}

      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "30px",
        }}
      >
        <input
          type="date"
          value={filterFrom}
          onChange={(e) => setFilterFrom(e.target.value)}
          style={{
            padding: "11px 14px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
          }}
        />

        <input
          type="date"
          value={filterTo}
          onChange={(e) => setFilterTo(e.target.value)}
          style={{
            padding: "11px 14px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
          }}
        />

        <button
          className="btn-primary"
          onClick={applyFilters}
        >
          Apply
        </button>

        <button
          className="btn-secondary"
          onClick={clearFilters}
        >
          Clear
        </button>
      </div>

      {/* NO RECORDS */}

      {sessions.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "70px 20px",
            color: "#666",
          }}
        >
          <div style={{ fontSize: "45px", marginBottom: "15px" }}>
            📋
          </div>

          <h3>No attendance records found</h3>

          <p>
            Attendance recorded for {subjectName} - Division{" "}
            {divisionName} will appear here.
          </p>
        </div>
      ) : (
        /* SESSION TABLE */

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th className="history-th">Date</th>
                <th className="history-th">Time</th>
                <th className="history-th">Present</th>
                <th className="history-th">Absent</th>
                <th className="history-th">Attendance</th>
                <th className="history-th">Status</th>
                <th className="history-th">Action</th>
              </tr>
            </thead>

            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td className="history-td">
                    {session.date}
                  </td>

                  <td className="history-td">
                    {session.start_time
                      ? String(session.start_time).includes("T")
                        ? new Date(
                            session.start_time
                          ).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : String(session.start_time).slice(0, 5)
                      : "-"}
                  </td>

                  <td className="history-td">
                    <span
                      style={{
                        color: "#15803d",
                        fontWeight: "600",
                      }}
                    >
                      {session.present}
                    </span>
                  </td>

                  <td className="history-td">
                    <span
                      style={{
                        color: "#dc2626",
                        fontWeight: "600",
                      }}
                    >
                      {session.absent}
                    </span>
                  </td>

                  <td className="history-td">
                    <strong>{session.percentage}%</strong>
                  </td>

                  <td className="history-td">
                    {session.is_locked ? (
                      <span
                        style={{
                          color: "#15803d",
                          fontWeight: "600",
                        }}
                      >
                        🔒 Locked
                      </span>
                    ) : (
                      <span
                        style={{
                          color: "#d97706",
                          fontWeight: "600",
                        }}
                      >
                        🔓 Editable
                      </span>
                    )}
                  </td>

                  <td className="history-td">
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <button
                        className="btn-secondary"
                        onClick={() => viewDetails(session)}
                      >
                        View Details
                      </button>

                      <button
                        className="btn-primary"
                        onClick={() => printReport(session)}
                      >
                        🖨️ Print Report
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FLOATING ATTENDANCE DETAILS MODAL */}

      {selectedSession && (
        <div
          className="history-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) {
              setSelectedSession(null);
              setDetailRecords([]);
              setError("");
            }
          }}
        >
          <div
            className="history-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-modal-title"
          >
            <div className="history-modal-header">
              <div>
                <h2 id="history-modal-title">
                  Attendance Details
                </h2>

                <p>
                  {selectedSession.date}
                  {" • "}
                  {subjectName}
                  {" • Division "}
                  {divisionName}
                </p>
              </div>

              <button
                type="button"
                className="history-modal-close"
                aria-label="Close attendance details"
                disabled={saving}
                onClick={() => {
                  setSelectedSession(null);
                  setDetailRecords([]);
                  setError("");
                }}
              >
                ×
              </button>
            </div>

            {/* SUMMARY */}

            <div className="history-modal-summary">
              <div className="history-summary-card">
                <span>Total Students</span>
                <strong>{detailRecords.length}</strong>
              </div>

              <div className="history-summary-card">
                <span>Present</span>
                <strong className="history-present-count">
                  {detailRecords.filter(
                    (record) => record.status === "present"
                  ).length}
                </strong>
              </div>

              <div className="history-summary-card">
                <span>Absent</span>
                <strong className="history-absent-count">
                  {detailRecords.filter(
                    (record) => record.status === "absent"
                  ).length}
                </strong>
              </div>
            </div>

            {error && (
              <div
                className="alert-error"
                role="alert"
                style={{ margin: "15px 28px 0" }}
              >
                {error}
              </div>
            )}

            {/* STUDENT ATTENDANCE TABLE */}

            {detailLoading ? (
              <div className="history-modal-loading">
                <div className="history-spinner" />
                <p>Loading student attendance...</p>
              </div>
            ) : (
              <div className="history-modal-table-wrap">
                <table className="history-modal-table">
                  <thead>
                    <tr>
                      <th>Roll No.</th>
                      <th>Student Name</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {detailRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="history-modal-empty"
                        >
                          No attendance records found for this lecture.
                        </td>
                      </tr>
                    ) : (
                      detailRecords.map((record, index) => (
                        <tr
                          key={`${
                            record.student_id ??
                            record.students?.id
                          }-${index}`}
                        >
                          <td>
                            {record.students?.roll_number || "—"}
                          </td>

                          <td className="history-student-name">
                            {record.students?.name || "—"}
                          </td>

                          {/* SIMPLE STATUS TEXT */}

                          <td>
                            <span
                              className={
                                record.status === "present"
                                  ? "status-text present"
                                  : "status-text absent"
                              }
                            >
                              {record.status === "present"
                                ? "Present"
                                : "Absent"}
                            </span>
                          </td>

                          {/* SIMPLE TEXT ACTION */}

                          <td>
                            {record.status === "present" ? (
                              <button
                                type="button"
                                className="simple-status-btn"
                                disabled={saving}
                                onClick={() =>
                                  changeStatus(
                                    record.students?.id ??
                                      record.student_id,
                                    "absent"
                                  )
                                }
                              >
                                Mark Absent
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="simple-status-btn"
                                disabled={saving}
                                onClick={() =>
                                  changeStatus(
                                    record.students?.id ??
                                      record.student_id,
                                    "present"
                                  )
                                }
                              >
                                Mark Present
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* MODAL FOOTER */}

            <div className="history-modal-footer">
              <p>
                Changes are applied when you click Save Changes.
              </p>

              <div className="history-modal-footer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={saving}
                  onClick={() => {
                    setSelectedSession(null);
                    setDetailRecords([]);
                    setError("");
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={saveChanges}
                  disabled={
                    saving ||
                    detailLoading ||
                    detailRecords.length === 0
                  }
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
