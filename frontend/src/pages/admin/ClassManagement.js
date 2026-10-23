import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function ClassManagement() {
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses]         = useState([]);
  const [divisions, setDivisions]     = useState([]);
  const [loading, setLoading]         = useState(true);

  // Class form
  const [classForm, setClassForm]   = useState({ name: "", year: "", department_id: "" });
  const [classEditId, setClassEditId] = useState(null);
  const [showClassForm, setShowClassForm] = useState(false);
  const [classError, setClassError] = useState("");

  // Division form
  const [divForm, setDivForm]         = useState({ name: "", class_id: "" });
  const [divEditId, setDivEditId]     = useState(null);
  const [showDivForm, setShowDivForm] = useState(false);
  const [divError, setDivError]       = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: depts }, { data: cls }, { data: divs }] = await Promise.all([
      supabase.from("departments").select("*").order("name"),
      supabase.from("classes").select("*, departments(name)").order("name"),
      supabase.from("divisions").select("*, classes(name, departments(name))").order("name"),
    ]);
    setDepartments(depts || []);
    setClasses(cls || []);
    setDivisions(divs || []);
    setLoading(false);
  }

  // ── CLASS CRUD ──
  function openAddClass() {
    setClassForm({ name: "", year: "", department_id: "" });
    setClassEditId(null); setClassError(""); setShowClassForm(true);
  }
  function openEditClass(c) {
  setClassForm({
    name: c.name || "",
    year: c.year ? String(c.year) : "",
    department_id: c.department_id ? String(c.department_id) : ""
  });

  setClassEditId(c.id);
  setClassError("");
  setShowClassForm(true);
}
  async function saveClass(e) {
    e.preventDefault();
    if (!classForm.name.trim() || !classForm.year || !classForm.department_id) {
      setClassError("All fields required."); return;
    }
    setSaving(true); setClassError("");
    const payload = {
  name: classForm.name.trim(),
  year: classForm.year,
  department_id: Number(classForm.department_id)
};
    let err;
    if (classEditId) {
      ({ error: err } = await supabase.from("classes").update(payload).eq("id", classEditId));
    } else {
      ({ error: err } = await supabase.from("classes").insert(payload));
    }
    setSaving(false);
    if (err) { setClassError(err.message); return; }
    setShowClassForm(false); fetchAll();
  }
  async function deleteClass(id, name) {
    if (!window.confirm(`Delete class "${name}"? All divisions inside will be removed.`)) return;
    await supabase.from("classes").delete().eq("id", id);
    fetchAll();
  }

  // ── DIVISION CRUD ──
  function openAddDiv() {
    setDivForm({ name: "", class_id: "" });
    setDivEditId(null); setDivError(""); setShowDivForm(true);
  }
  function openEditDiv(d) {
    setDivForm({ name: d.name, class_id: d.class_id });
    setDivEditId(d.id); setDivError(""); setShowDivForm(true);
  }
  async function saveDiv(e) {
    e.preventDefault();
    if (!divForm.name.trim() || !divForm.class_id) {
      setDivError("All fields required."); return;
    }
    setSaving(true); setDivError("");
    const payload = {
  name: divForm.name.trim(),
  class_id: Number(divForm.class_id),
};
    let err;
    if (divEditId) {
      ({ error: err } = await supabase.from("divisions").update(payload).eq("id", divEditId));
    } else {
      ({ error: err } = await supabase.from("divisions").insert(payload));
    }
    setSaving(false);
    if (err) { setDivError(err.message); return; }
    setShowDivForm(false); fetchAll();
  }
  async function deleteDiv(id, name) {
    if (!window.confirm(`Delete division "${name}"?`)) return;
    await supabase.from("divisions").delete().eq("id", id);
    fetchAll();
  }

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div>
      {/* ── CLASSES ── */}
      <div className="section">
        <div className="section-header">
          <h2>Classes (Year Groups)</h2>
          <button className="btn-primary" onClick={openAddClass}>+ Add Class</button>
        </div>

        {showClassForm && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{classEditId ? "Edit Class" : "Add Class"}</h3>
              {classError && <div className="alert-error">{classError}</div>}
              <form onSubmit={saveClass} className="modal-form">
                <div className="form-group">
                  <label>Class Name (e.g. TYIT)</label>
                  <input value={classForm.name} onChange={e => setClassForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <select value={classForm.year} onChange={e => setClassForm(f => ({ ...f, year: e.target.value }))} required>
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select value={classForm.department_id} onChange={e => setClassForm(f => ({ ...f, department_id: e.target.value }))} required>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowClassForm(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {classes.length === 0 ? (
          <p className="empty-state">No classes yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Year</th><th>Department</th><th>Actions</th></tr></thead>
              <tbody>
                {classes.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>
  {c.year === "1" || c.year === 1
    ? "1st Year"
    : c.year === "2" || c.year === 2
    ? "2nd Year"
    : c.year === "3" || c.year === 3
    ? "3rd Year"
    : c.year === "4" || c.year === 4
    ? "4th Year"
    : ""}
</td>
                    <td>{c.departments?.name}</td>
                    <td>
                      <button className="btn-sm btn-edit" onClick={() => openEditClass(c)}>Edit</button>
                      <button className="btn-sm btn-danger" onClick={() => deleteClass(c.id, c.name)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── DIVISIONS ── */}
      <div className="section">
        <div className="section-header">
          <h2>Divisions</h2>
          <button className="btn-primary" onClick={openAddDiv}>+ Add Division</button>
        </div>

        {showDivForm && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{divEditId ? "Edit Division" : "Add Division"}</h3>
              {divError && <div className="alert-error">{divError}</div>}
              <form onSubmit={saveDiv} className="modal-form">
                <div className="form-group">
                  <label>Division Name (e.g. A, B)</label>
                  <input value={divForm.name} onChange={e => setDivForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Class</label>
                  <select value={divForm.class_id} onChange={e => setDivForm(f => ({ ...f, class_id: e.target.value }))} required>
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.departments?.name})</option>)}
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowDivForm(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {divisions.length === 0 ? (
          <p className="empty-state">No divisions yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Division</th><th>Class</th><th>Department</th><th>Actions</th></tr></thead>
              <tbody>
                {divisions.map(d => (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td>{d.classes?.name}</td>
                    <td>{d.classes?.departments?.name}</td>
                    <td>
                      <button className="btn-sm btn-edit" onClick={() => openEditDiv(d)}>Edit</button>
                      <button className="btn-sm btn-danger" onClick={() => deleteDiv(d.id, d.name)}>Delete</button>
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
