import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const API_URL = "http://127.0.0.1:8000";
const DAYS = [
  "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday"
];

const EMPTY_FORM = {
  day_of_week: "Monday",
  start_time: "",
  end_time: "",
  subject_id: "",
  teacher_id: "",
  division_id: "",
  room: ""
};

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function timeToSeconds(value) {
  return value && value.length === 5 ? `${value}:00` : value;
}

function findSubject(cell, subjects) {
  const label = String(cell || "").split("\n")[0].trim();

  if (!label || label === "—" || label === "-") return null;

  return subjects.find(
    s =>
      normalize(s.name) === normalize(label) ||
      normalize(s.code) === normalize(label)
  ) || null;
}

function parsePdfTables(result, subjects, divisions) {
  const text = result.extracted_text || "";
  const groupPattern =
    /\b([A-Z][A-Z0-9]*)\s*[—–-]\s*Division\s+([A-Z0-9]+)/gi;

  const groups = [];
  let match;

  while ((match = groupPattern.exec(text)) !== null) {
    groups.push({
      className: match[1].trim(),
      divisionName: match[2].trim()
    });
  }

  const gridTables = (result.tables || []).filter(table => {
    const header = table.rows?.[0] || [];
    return (
      normalize(header[0]).includes("periodtime") &&
      DAYS.filter(day =>
        header.some(cell => normalize(cell) === normalize(day))
      ).length >= 5
    );
  });

  const drafts = [];

  gridTables.forEach((table, tableIndex) => {
    const group = groups[tableIndex] || {};
    const division = divisions.find(d =>
      normalize(d.name) === normalize(group.divisionName) &&
      normalize(d.classes?.name) === normalize(group.className)
    );

    const header = table.rows[0] || [];

    table.rows.slice(1).forEach(row => {
      const periodCell = String(row[0] || "");
      const timeMatch = periodCell.match(
        /(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})/
      );

      if (!timeMatch) return;

      const periodMatch = periodCell.match(/\bP?(\d+)\b/i);
      const startTime = timeMatch[1].padStart(5, "0");
      const endTime = timeMatch[2].padStart(5, "0");

      header.forEach((dayName, columnIndex) => {
        if (!DAYS.some(d => normalize(d) === normalize(dayName))) return;

        const cell = String(row[columnIndex] || "");
        const subject = findSubject(cell, subjects);

        if (!subject) return;

        drafts.push({
          _key: `${tableIndex}-${periodCell}-${dayName}-${columnIndex}`,
          day_of_week: DAYS.find(
            d => normalize(d) === normalize(dayName)
          ),
          start_time: startTime,
          end_time: endTime,
          subject_id: String(subject.id),
          subject_code: subject.code || "",
          division_id: division ? String(division.id) : "",
          teacher_id: "",
          room: "",
          lecture_no: periodMatch ? Number(periodMatch[1]) : null,
          lab_group: "",
          status: "draft",
          _className: group.className || "",
          _divisionName: group.divisionName || "",
          _subjectLabel: cell.split("\n")[0].trim()
        });
      });
    });
  });

  return drafts;
}

export default function TimetableManagement() {
  const [entries, setEntries] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [teacherAssignments, setTeacherAssignments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filterDay, setFilterDay] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const [draftRows, setDraftRows] = useState([]);
  const [pdfName, setPdfName] = useState("");
  const [pdfSummary, setPdfSummary] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    setError("");

    try {
      const [
        timetableResult,
        subjectResult,
        teacherResult,
        divisionResult,
        assignmentResult
      ] = await Promise.all([
        supabase.from("timetable")
          .select(`
            *,
            subjects(name, code),
            teachers(name),
            divisions(name, classes(name))
          `)
          .order("day_of_week")
          .order("start_time"),

        supabase.from("subjects")
          .select("*")
          .order("name"),

        supabase.from("teachers")
          .select("*")
          .eq("is_active", true)
          .order("name"),

        supabase.from("divisions")
          .select("*, classes(name)")
          .order("name"),

        supabase.from("teacher_assignments")
          .select("id, teacher_id, subject_id, division_id")
      ]);

      if (timetableResult.error) throw timetableResult.error;
      if (subjectResult.error) throw subjectResult.error;
      if (teacherResult.error) throw teacherResult.error;
      if (divisionResult.error) throw divisionResult.error;

      setEntries(timetableResult.data || []);
      setSubjects(subjectResult.data || []);
      setTeachers(teacherResult.data || []);
      setDivisions(divisionResult.data || []);
      setTeacherAssignments(
        assignmentResult.error ? [] : assignmentResult.data || []
      );
    } catch (err) {
      setError(err.message || "Could not load timetable data.");
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setError("");
    setShowForm(true);
  }

  function openEdit(entry) {
    setForm({
      day_of_week: entry.day_of_week,
      start_time: entry.start_time?.slice(0, 5) || "",
      end_time: entry.end_time?.slice(0, 5) || "",
      subject_id: String(entry.subject_id || ""),
      teacher_id: entry.teacher_id ? String(entry.teacher_id) : "",
      division_id: String(entry.division_id || ""),
      room: entry.room || ""
    });

    setEditId(entry.id);
    setError("");
    setShowForm(true);
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    if (
      !form.start_time ||
      !form.end_time ||
      !form.subject_id ||
      !form.division_id
    ) {
      setError("Day, times, subject, and division are required.");
      setSaving(false);
      return;
    }

    if (form.end_time <= form.start_time) {
      setError("End time must be after start time.");
      setSaving(false);
      return;
    }

    const payload = {
      day_of_week: form.day_of_week,
      start_time: timeToSeconds(form.start_time),
      end_time: timeToSeconds(form.end_time),
      subject_id: Number(form.subject_id),
      division_id: Number(form.division_id),
      teacher_id: form.teacher_id ? Number(form.teacher_id) : null,
      room: form.room || null,
      status: "draft"
    };

    const result = editId
      ? await supabase.from("timetable")
          .update(payload).eq("id", editId)
      : await supabase.from("timetable").insert(payload);

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setShowForm(false);
    setMessage("Timetable entry saved as a draft.");
    await fetchAll();
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this timetable entry?")) return;

    const { error: deleteError } = await supabase
      .from("timetable")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await fetchAll();
  }
  async function publishAllTimetable() {
  const draftCount = entries.filter(
    (entry) => String(entry.status || "draft").toLowerCase() === "draft"
  ).length;

  if (draftCount === 0) {
    setMessage("There are no draft timetable entries to publish.");
    setError("");
    return;
  }

  const confirmed = window.confirm(
    `Publish all ${draftCount} draft timetable entries? ` +
    "They will become active according to your existing timetable rules."
  );

  if (!confirmed) return;

  setSaving(true);
  setError("");
  setMessage("");

  try {
    const { data, error: publishError } = await supabase
      .from("timetable")
      .update({ status: "published" })
      .or("status.eq.draft,status.is.null")
      .select("id");

    if (publishError) throw publishError;

    await fetchAll();

    setMessage(
      `${data?.length ?? 0} timetable entries published successfully.`
    );
  } catch (err) {
    setError(
      err.message ||
      "Could not publish the timetable. Check your Supabase permissions."
    );
  } finally {
    setSaving(false);
  }
}

async function handlePdfUpload(event) {
  const file = event.target.files?.[0];
  event.target.value = "";

  if (!file) return;

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    setError("Please select a PDF file.");
    return;
  }

  setUploading(true);
  setError("");
  setMessage("");
  setDraftRows([]);
  setPdfSummary("");

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${API_URL}/api/timetable/preview-pdf`,
      { method: "POST", body: formData }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || "PDF extraction failed.");
    }

    const drafts = parsePdfTables(result, subjects, divisions);

    setPdfName(file.name);
    setDraftRows(drafts);
    setPdfSummary(
      `Extracted ${drafts.length} subject cells from ` +
      `${result.page_count} page(s). Review all rows before saving.`
    );

    if (!drafts.length) {
      setError(
        "No timetable lecture rows were matched to your current subjects. " +
        "Check the PDF grid, subject names, and class/division names."
      );
    }
  } catch (err) {
    setError(
      err.message ||
      "Could not connect to the backend. Check that FastAPI is running."
    );
  } finally {
    setUploading(false);
  }
}

function updateDraft(index, field, value) {
  setDraftRows(current =>
    current.map((row, i) => {
      if (i !== index) return row;

      const updated = { ...row, [field]: value };

      if (field === "subject_id") {
        const subject = subjects.find(
          s => String(s.id) === String(value)
        );
        updated.subject_code = subject?.code || "";
        updated.teacher_id = "";
      }

      if (field === "division_id") {
        updated.teacher_id = "";
      }

      return updated;
    })
  );
}

function removeDraft(index) {
  setDraftRows(rows => rows.filter((_, i) => i !== index));
}

function eligibleTeachers(row) {
  if (!row.subject_id || !row.division_id) return [];

  const assignedIds = teacherAssignments
    .filter(a =>
      String(a.subject_id) === String(row.subject_id) &&
      String(a.division_id) === String(row.division_id)
    )
    .map(a => String(a.teacher_id));

  return teachers.filter(t => assignedIds.includes(String(t.id)));
}

async function saveDraftRows() {
  setError("");
  setMessage("");

  if (!draftRows.length) {
    setError("There are no extracted rows to save.");
    return;
  }

  const invalid = draftRows.find(row =>
    !row.subject_id ||
    !row.division_id ||
    !row.day_of_week ||
    !row.start_time ||
    !row.end_time ||
    row.end_time <= row.start_time
  );

  if (invalid) {
    setError(
      "Some rows need a valid subject, division, day, and time. " +
      "Review the highlighted selections before saving."
    );
    return;
  }

  setSaving(true);

  try {
    const payload = draftRows.map(row => ({
      day_of_week: row.day_of_week,
      start_time: timeToSeconds(row.start_time),
      end_time: timeToSeconds(row.end_time),
      subject_id: Number(row.subject_id),
      division_id: Number(row.division_id),
      teacher_id: row.teacher_id ? Number(row.teacher_id) : null,
      room: row.room || null,
      lecture_no: row.lecture_no || null,
      lab_group: row.lab_group || null,
      subject_code: row.subject_code || null,
      status: "draft"
    }));

    const { error: insertError } = await supabase
      .from("timetable")
      .insert(payload);

    if (insertError) throw insertError;

    setDraftRows([]);
    setPdfSummary("");
    setMessage(
      `${payload.length} timetable entries saved as drafts.`
    );

    await fetchAll();
  } catch (err) {
    setError(err.message || "Could not save the timetable drafts.");
  } finally {
    setSaving(false);
  }
}

const displayed = filterDay
  ? entries.filter(e => e.day_of_week === filterDay)
  : entries;

if (loading) {
  return <div className="page-loading">Loading timetable…</div>;
}

return (
  <div className="section">
    <div className="section-header">
      <h2>Weekly Timetable</h2>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn-primary"
          onClick={publishAllTimetable}
          disabled={saving || !entries.some(
            (entry) =>
              String(entry.status || "draft").toLowerCase() === "draft"
          )}
        >
          {saving ? "Publishing..." : "Publish All Timetable"}
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={openAdd}
        >
          + Add Entry
        </button>
      </div>
    </div>

    {error && <div className="alert-error">{error}</div>}
    {message && <div className="alert-success">{message}</div>}

    <div className="card" style={{ padding: 18, marginBottom: 24 }}>
      <h3>Import Timetable from PDF</h3>
      <p>
        Upload a weekly timetable PDF. Extracted rows will appear below
        for review; nothing is saved until you click Save Drafts.
      </p>

      <label>
        <strong>Select timetable PDF</strong>
        <br />
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handlePdfUpload}
          disabled={uploading}
        />
      </label>

      {uploading && <p>Extracting PDF…</p>}
      {pdfName && <p><strong>File:</strong> {pdfName}</p>}
      {pdfSummary && <p>{pdfSummary}</p>}

      {draftRows.length > 0 && (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Class / Div</th>
                  <th>Day</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>Room</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {draftRows.map((row, index) => {
                  const availableTeachers = eligibleTeachers(row);
                  const divisionKnown = divisions.some(
                    d => String(d.id) === String(row.division_id)
                  );

                  return (
                    <tr key={row._key}>
                      <td>
                        <select
                          value={row.division_id}
                          onChange={e =>
                            updateDraft(
                              index,
                              "division_id",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select division</option>
                          {divisions.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.classes?.name} — Div {d.name}
                            </option>
                          ))}
                        </select>

                        {!divisionKnown && (
                          <small
                            style={{
                              display: "block",
                              color: "#b45309"
                            }}
                          >
                            Match class/division
                          </small>
                        )}
                      </td>

                      <td>
                        <select
                          value={row.day_of_week}
                          onChange={e =>
                            updateDraft(
                              index,
                              "day_of_week",
                              e.target.value
                            )
                          }
                        >
                          {DAYS.map(day => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <input
                          type="time"
                          value={row.start_time}
                          onChange={e =>
                            updateDraft(
                              index,
                              "start_time",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="time"
                          value={row.end_time}
                          onChange={e =>
                            updateDraft(
                              index,
                              "end_time",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <select
                          value={row.subject_id}
                          onChange={e =>
                            updateDraft(
                              index,
                              "subject_id",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select subject</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                              {s.code ? ` (${s.code})` : ""}
                            </option>
                          ))}
                        </select>

                        {!row.subject_id && (
                          <small
                            style={{
                              display: "block",
                              color: "#b45309"
                            }}
                          >
                            Match subject: {row._subjectLabel}
                          </small>
                        )}
                      </td>

                      <td>
                        <select
                          value={row.teacher_id}
                          onChange={e =>
                            updateDraft(
                              index,
                              "teacher_id",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Unassigned</option>
                          {availableTeachers.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>

                        {row.subject_id &&
                          row.division_id &&
                          availableTeachers.length === 0 && (
                            <small style={{ display: "block" }}>
                              No matching teacher assignment
                            </small>
                          )}
                      </td>

                      <td>
                        <input
                          value={row.room}
                          placeholder="Room"
                          onChange={e =>
                            updateDraft(index, "room", e.target.value)
                          }
                        />
                      </td>

                      <td>
                        <button
                          type="button"
                          className="btn-sm btn-danger"
                          onClick={() => removeDraft(index)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="modal-actions" style={{ marginTop: 16 }}>
            <button
              className="btn-secondary"
              onClick={() => {
                setDraftRows([]);
                setPdfSummary("");
              }}
            >
              Discard Preview
            </button>

            <button
              className="btn-primary"
              disabled={saving}
              onClick={saveDraftRows}
            >
              {saving ? "Saving…" : "Save Drafts"}
            </button>
          </div>
        </>
      )}
    </div>

    <div className="filter-bar">
      <select
        value={filterDay}
        onChange={e => setFilterDay(e.target.value)}
      >
        <option value="">All Days</option>
        {DAYS.map(day => (
          <option key={day} value={day}>
            {day}
          </option>
        ))}
      </select>
    </div>

    {showForm && (
      <div className="modal-overlay">
        <div className="modal modal-lg">
          <h3>{editId ? "Edit Entry" : "Add Timetable Entry"}</h3>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSave} className="modal-form">
            <div className="form-row">
              <div className="form-group">
                <label>Day</label>
                <select
                  value={form.day_of_week}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      day_of_week: e.target.value
                    }))
                  }
                >
                  {DAYS.map(day => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  required
                  value={form.start_time}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      start_time: e.target.value
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  required
                  value={form.end_time}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      end_time: e.target.value
                    }))
                  }
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Subject</label>
                <select
                  required
                  value={form.subject_id}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      subject_id: e.target.value
                    }))
                  }
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Teacher (optional)</label>
                <select
                  value={form.teacher_id}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      teacher_id: e.target.value
                    }))
                  }
                >
                  <option value="">Unassigned</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Division</label>
                <select
                  required
                  value={form.division_id}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      division_id: e.target.value
                    }))
                  }
                >
                  <option value="">Select Division</option>
                  {divisions.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.classes?.name} — Div {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Room (optional)</label>
                <input
                  placeholder="e.g. A-201"
                  value={form.room}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      room: e.target.value
                    }))
                  }
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Draft"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {DAYS.filter(day => !filterDay || day === filterDay).map(day => {
      const dayEntries = displayed.filter(
        entry => entry.day_of_week === day
      );

      if (!filterDay && dayEntries.length === 0) return null;

      return (
        <div key={day} style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 8, color: "#172554" }}>
            {day}
          </h3>

          {dayEntries.length === 0 ? (
            <p className="empty-state">No lectures on {day}.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Subject</th>
                    <th>Teacher</th>
                    <th>Class</th>
                    <th>Div</th>
                    <th>Room</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {dayEntries.map(entry => (
                    <tr key={entry.id}>
                      <td>
                        {entry.start_time?.slice(0, 5)} –{" "}
                        {entry.end_time?.slice(0, 5)}
                      </td>

                      <td>
                        {entry.subjects?.name ||
                          entry.subject_code ||
                          "—"}
                      </td>

                      <td>{entry.teachers?.name || "Unassigned"}</td>
                      <td>{entry.divisions?.classes?.name || "—"}</td>
                      <td>{entry.divisions?.name || "—"}</td>
                      <td>{entry.room || "—"}</td>
                      <td>{entry.status || "draft"}</td>

                      <td>
                        <button
                          className="btn-sm btn-edit"
                          onClick={() => openEdit(entry)}
                        >
                          Edit
                        </button>

                        <button
                          className="btn-sm btn-danger"
                          onClick={() => handleDelete(entry.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    })}

    {displayed.length === 0 && (
      <p className="empty-state">
        No timetable entries yet. Add one or import a PDF.
      </p>
    )}
  </div>
);
}