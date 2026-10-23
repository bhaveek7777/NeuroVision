import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function TeacherManagement() {
  const [teachers, setTeachers]       = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects]       = useState([]);
  const [divisions, setDivisions]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
const [showPasswordModal, setShowPasswordModal] = useState(false);
const [passwordTeacher, setPasswordTeacher] = useState(null);
const [newPassword, setNewPassword] = useState("");
const [passwordSaving, setPasswordSaving] = useState(false);
const [passwordError, setPasswordError] = useState("");
const [passwordMessage, setPasswordMessage] = useState("");
  // Teacher form
  const [showForm, setShowForm]       = useState(false);
  const [editId, setEditId]           = useState(null);
  const [form, setForm]               = useState({
    name: "", email: "", phone: "", department_id: "",
    designation: "Assistant Professor", teacher_id_code: "", password: "",
  });


  // Assignment modal
  const [showAssign, setShowAssign]   = useState(false);
  const [assignTeacher, setAssignTeacher] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [assignForm, setAssignForm]   = useState({ subject_id: "", division_id: "" });
  const [assignError, setAssignError] = useState("");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: t }, { data: d }, { data: s }, { data: div }] = await Promise.all([
      supabase.from("teachers").select("*, departments(name)").order("name"),
      supabase.from("departments").select("*").order("name"),
      supabase.from("subjects").select("*").order("name"),
      supabase.from("divisions").select("*, classes(name)").order("name"),
    ]);
    setTeachers(t || []);
    setDepartments(d || []);
    setSubjects(s || []);
    setDivisions(div || []);
    setLoading(false);
  }

  // ── ADD / EDIT TEACHER ──
  function openAdd() {
    setForm({ name: "", email: "", phone: "", department_id: "", designation: "Assistant Professor", teacher_id_code: "", password: "" });
    setEditId(null); setError(""); setShowForm(true);
  }
  function openEdit(t) {
    setForm({ name: t.name, email: t.email, phone: t.phone || "", department_id: t.department_id || "", designation: t.designation || "Assistant Professor", teacher_id_code: t.teacher_id_code, password: "" });
    setEditId(t.id); setError(""); setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.teacher_id_code.trim()) {
      setError("Name, email and teacher ID are required."); return;
    }
    if (!editId && !form.password.trim()) {
      setError("Password is required for new teachers."); return;
    }
    setSaving(true); setError("");

    try {
      if (editId) {
        // update teacher profile
        const { error: err } = await supabase.from("teachers").update({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          department_id: form.department_id || null,
          designation: form.designation,
          teacher_id_code: form.teacher_id_code.trim(),
        }).eq("id", editId);
        if (err) throw err;
      } else {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Admin session not found. Please log in again.");
  }

  const response = await fetch(
    "http://localhost:8000/api/admin/teacher/create",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        phone: form.phone.trim(),
        department_id: form.department_id
          ? Number(form.department_id)
          : null,
        designation: form.designation,
        teacher_id_code: form.teacher_id_code.trim(),
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to create teacher.");
  }

  console.log("Teacher created:", data);
}

      setShowForm(false); fetchAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

async function changeTeacherPassword() {
  if (!passwordTeacher) return;

  if (newPassword.length < 6) {
    setPasswordError("Password must contain at least 6 characters.");
    return;
  }

  setPasswordSaving(true);
  setPasswordError("");
  setPasswordMessage("");

  try {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Admin session not found. Please log in again.");
    }

    const response = await fetch(
      "http://localhost:8000/api/admin/teacher/change-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          teacher_id: passwordTeacher.id,
          new_password: newPassword,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Failed to change password.");
    }

    setPasswordMessage("Password changed successfully.");

    setNewPassword("");

    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordTeacher(null);
      setPasswordMessage("");
    }, 1200);

  } catch (err) {
    console.error("Password change error:", err);
    setPasswordError(err.message);
  } finally {
    setPasswordSaving(false);
  }
}

async function toggleActive(teacher) {
  const newStatus = !teacher.is_active;
  const action = newStatus ? "Activate" : "Deactivate";

  if (
    !window.confirm(
      `${action} teacher "${teacher.name}"?`
    )
  ) {
    return;
  }

  try {
    setError("");

    console.log("Updating teacher:", teacher.id);
    console.log("Old status:", teacher.is_active);
    console.log("New status:", newStatus);

    const { data, error } = await supabase
      .from("teachers")
      .update({
        is_active: newStatus,
      })
      .eq("id", teacher.id)
      .select("id, is_active")
      .single();

    if (error) {
      console.error("SUPABASE UPDATE ERROR:", error);
      throw error;
    }

    console.log("Updated teacher:", data);

    // Update the screen immediately
    setTeachers((previous) =>
      previous.map((item) =>
        item.id === teacher.id
          ? {
              ...item,
              is_active: data.is_active,
            }
          : item
      )
    );

  } catch (err) {
    console.error("Teacher status update error:", err);

    setError(
      err.message ||
      "Could not update teacher status."
    );
  }
}

  // ── ASSIGNMENTS ──
  async function openAssign(t) {
    setAssignTeacher(t);
    setAssignForm({ subject_id: "", division_id: "" });
    setAssignError("");
    const { data } = await supabase
      .from("teacher_assignments")
      .select("*, subjects(name), divisions(name, classes(name))")
      .eq("teacher_id", t.id);
    setAssignments(data || []);
    setShowAssign(true);
  }

  async function addAssignment(e) {
    e.preventDefault();
    if (!assignForm.subject_id || !assignForm.division_id) {
      setAssignError("Select both subject and division."); return;
    }
    const { error: err } = await supabase.from("teacher_assignments").insert({
      teacher_id: assignTeacher.id,
      subject_id: assignForm.subject_id,
      division_id: assignForm.division_id,
    });
    if (err) { setAssignError(err.message); return; }
    setAssignForm({ subject_id: "", division_id: "" });
    const { data } = await supabase
      .from("teacher_assignments")
      .select("*, subjects(name), divisions(name, classes(name))")
      .eq("teacher_id", assignTeacher.id);
    setAssignments(data || []);
  }

  async function removeAssignment(id) {
    if (!window.confirm("Remove this assignment?")) return;
    await supabase.from("teacher_assignments").delete().eq("id", id);
    const { data } = await supabase
      .from("teacher_assignments")
      .select("*, subjects(name), divisions(name, classes(name))")
      .eq("teacher_id", assignTeacher.id);
    setAssignments(data || []);
  }

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="section">
      <div className="section-header">
        <h2>Teachers</h2>
        <button className="btn-primary" onClick={openAdd}>+ Add Teacher</button>
      </div>

      {/* ── Add/Edit Form Modal ── */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <h3>{editId ? "Edit Teacher" : "Add Teacher"}</h3>
            {error && <div className="alert-error">{error}</div>}
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Teacher ID Code</label>
                  <input placeholder="e.g. TCH001" value={form.teacher_id_code}
                    onChange={e => setForm(f => ({ ...f, teacher_id_code: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Full Name</label>
                  <input placeholder="e.g. John Doe" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" placeholder="teacher@college.edu" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input placeholder="9876543210" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Department</label>
                  <select value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}>
                    <option value="">None</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Designation</label>
                  <select value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}>
                    <option>Assistant Professor</option>
                    <option>Associate Professor</option>
                    <option>Professor</option>
                    <option>HOD</option>
                    <option>Visiting Faculty</option>
                  </select>
                </div>
              </div>
              {!editId && (
                <div className="form-group">
                  <label>Initial Password</label>
                  <input type="password" placeholder="Min 6 characters" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={!editId} />
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

{showPasswordModal && passwordTeacher && (
  <div className="modal-overlay">
    <div className="modal">
      <h3>Change Teacher Password</h3>

      <p style={{ marginBottom: "15px" }}>
        Change password for <strong>{passwordTeacher.name}</strong>
      </p>

      <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>
        {passwordTeacher.email}
      </p>

      {passwordError && (
        <div className="alert-error">
          {passwordError}
        </div>
      )}

      {passwordMessage && (
        <div
          style={{
            padding: "10px 14px",
            marginBottom: "15px",
            borderRadius: "6px",
            background: "#e8f5e9",
            color: "#2e7d32",
          }}
        >
          {passwordMessage}
        </div>
      )}

      <div className="form-group">
        <label>New Password</label>

        <input
          type="password"
          placeholder="Minimum 6 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoFocus
        />
      </div>

      <div className="modal-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setShowPasswordModal(false);
            setPasswordTeacher(null);
            setNewPassword("");
            setPasswordError("");
          }}
          disabled={passwordSaving}
        >
          Cancel
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={changeTeacherPassword}
          disabled={passwordSaving}
        >
          {passwordSaving ? "Changing…" : "Change Password"}
        </button>
      </div>
    </div>
  </div>
)}

      {/* ── Assign Subjects Modal ── */}
      {showAssign && assignTeacher && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <h3>Subject Assignments — {assignTeacher.name}</h3>
            {assignError && <div className="alert-error">{assignError}</div>}

            <form onSubmit={addAssignment} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Subject</label>
                  <select value={assignForm.subject_id} onChange={e => setAssignForm(f => ({ ...f, subject_id: e.target.value }))}>
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Division (Class)</label>
                  <select value={assignForm.division_id} onChange={e => setAssignForm(f => ({ ...f, division_id: e.target.value }))}>
                    <option value="">Select Division</option>
                    {divisions.map(d => <option key={d.id} value={d.id}>{d.classes?.name} – Div {d.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary">+ Add Assignment</button>
            </form>

            <div className="table-wrap" style={{ marginTop: 16 }}>
              {assignments.length === 0 ? (
                <p className="empty-state">No assignments yet.</p>
              ) : (
                <table>
                  <thead><tr><th>Subject</th><th>Class</th><th>Division</th><th>Remove</th></tr></thead>
                  <tbody>
                    {assignments.map(a => (
                      <tr key={a.id}>
                        <td>{a.subjects?.name}</td>
                        <td>{a.divisions?.classes?.name}</td>
                        <td>{a.divisions?.name}</td>
                        <td>
                          <button className="btn-sm btn-danger" onClick={() => removeAssignment(a.id)}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="btn-secondary" onClick={() => setShowAssign(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Teacher Table ── */}
      {teachers.length === 0 ? (
        <p className="empty-state">No teachers yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Email</th><th>Department</th>
                <th>Designation</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t.id}>
                  <td>{t.teacher_id_code}</td>
                  <td>{t.name}</td>
                  <td>{t.email}</td>
                  <td>{t.departments?.name || "—"}</td>
                  <td>{t.designation}</td>
                  <td>
                    <span className={t.is_active ? "badge-active" : "badge-inactive"}>
                      {t.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                   <button className="btn-sm btn-edit" onClick={() => openEdit(t)}>
  Edit
</button>

<button
  className="btn-sm btn-primary"
  onClick={() => {
    setPasswordTeacher(t);
    setNewPassword("");
    setPasswordError("");
    setPasswordMessage("");
    setShowPasswordModal(true);
  }}
>
  🔑 Password
</button>

<button className="btn-sm btn-primary" onClick={() => openAssign(t)}>
  Assign
</button>
                    
                    <button
  className={
    t.is_active
      ? "btn-sm btn-danger"
      : "btn-sm btn-edit"
  }
  onClick={() => toggleActive(t)}
>
  {t.is_active ? "Deactivate" : "Activate"}
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
}
