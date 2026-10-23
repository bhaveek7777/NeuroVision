import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function SubjectManagement() {
  const [subjects, setSubjects]       = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [form, setForm]               = useState({ name: "", code: "", department_id: "" });
  const [editId, setEditId]           = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: subs }, { data: depts }] = await Promise.all([
      supabase.from("subjects").select("*, departments(name)").order("name"),
      supabase.from("departments").select("*").order("name"),
    ]);
    setSubjects(subs || []);
    setDepartments(depts || []);
    setLoading(false);
  }

  function openAdd() {
    setForm({ name: "", code: "", department_id: "" });
    setEditId(null); setError(""); setShowForm(true);
  }
  function openEdit(s) {
    setForm({ name: s.name, code: s.code, department_id: s.department_id || "" });
    setEditId(s.id); setError(""); setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) { setError("Name and code required."); return; }
    setSaving(true); setError("");
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      department_id: form.department_id || null,
    };
    let err;
    if (editId) {
      ({ error: err } = await supabase.from("subjects").update(payload).eq("id", editId));
    } else {
      ({ error: err } = await supabase.from("subjects").insert(payload));
    }
    setSaving(false);
    if (err) { setError(err.message); return; }
    setShowForm(false); fetchAll();
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete subject "${name}"?`)) return;
    await supabase.from("subjects").delete().eq("id", id);
    fetchAll();
  }

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="section">
      <div className="section-header">
        <h2>Subjects</h2>
        <button className="btn-primary" onClick={openAdd}>+ Add Subject</button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editId ? "Edit Subject" : "Add Subject"}</h3>
            {error && <div className="alert-error">{error}</div>}
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label>Subject Name</label>
                <input placeholder="e.g. Database Management System"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Subject Code</label>
                <input placeholder="e.g. DBMS"
                  value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Department (optional)</label>
                <select value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}>
                  <option value="">None</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {subjects.length === 0 ? (
        <p className="empty-state">No subjects yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Code</th><th>Name</th><th>Department</th><th>Actions</th></tr></thead>
            <tbody>
              {subjects.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.code}</strong></td>
                  <td>{s.name}</td>
                  <td>{s.departments?.name || "—"}</td>
                  <td>
                    <button className="btn-sm btn-edit" onClick={() => openEdit(s)}>Edit</button>
                    <button className="btn-sm btn-danger" onClick={() => handleDelete(s.id, s.name)}>Delete</button>
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
