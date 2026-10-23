import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [form, setForm]               = useState({ name: "", code: "" });
  const [editId, setEditId]           = useState(null);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [showForm, setShowForm]       = useState(false);

  useEffect(() => { fetchDepts(); }, []);

  async function fetchDepts() {
    setLoading(true);
    const { data } = await supabase
      .from("departments")
      .select("*")
      .order("name");
    setDepartments(data || []);
    setLoading(false);
  }

  function openAdd() {
    setForm({ name: "", code: "" });
    setEditId(null);
    setError("");
    setShowForm(true);
  }

  function openEdit(dept) {
    setForm({ name: dept.name, code: dept.code });
    setEditId(dept.id);
    setError("");
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      setError("Name and code are required."); return;
    }
    setSaving(true); setError("");
    const payload = { name: form.name.trim(), code: form.code.trim().toUpperCase() };
    let err;
    if (editId) {
      ({ error: err } = await supabase.from("departments").update(payload).eq("id", editId));
    } else {
      ({ error: err } = await supabase.from("departments").insert(payload));
    }
    setSaving(false);
    if (err) { setError(err.message); return; }
    setShowForm(false);
    fetchDepts();
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete department "${name}"? This will affect linked classes.`)) return;
    await supabase.from("departments").delete().eq("id", id);
    fetchDepts();
  }

  return (
    <div className="section">
      <div className="section-header">
        <h2>Departments</h2>
        <button className="btn-primary" onClick={openAdd}>+ Add Department</button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editId ? "Edit Department" : "Add Department"}</h3>
            {error && <div className="alert-error">{error}</div>}
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label>Department Name</label>
                <input
                  placeholder="e.g. Information Technology"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Code</label>
                <input
                  placeholder="e.g. IT"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="page-loading">Loading…</p>
      ) : departments.length === 0 ? (
        <p className="empty-state">No departments yet. Add one to get started.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Code</th><th>Name</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {departments.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.code}</strong></td>
                  <td>{d.name}</td>
                  <td>
                    <button className="btn-sm btn-edit" onClick={() => openEdit(d)}>Edit</button>

                    
                    <button className="btn-sm btn-danger" onClick={() => handleDelete(d.id, d.name)}>Delete</button>
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
