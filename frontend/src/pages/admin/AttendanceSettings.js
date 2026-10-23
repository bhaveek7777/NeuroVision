import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function AttendanceSettings() {
  const [cutoff, setCutoff]   = useState("");
  const [saved, setSaved]     = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    fetchCutoff();
  }, []);

  async function fetchCutoff() {
    setLoading(true);
    const { data } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "attendance_cutoff")
      .maybeSingle();
    setCutoff(data?.value || "75");
    setSaved(data?.value || "75");
    setLoading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    const num = Number(cutoff);
    if (isNaN(num) || num < 1 || num > 100) {
      setError("Cutoff must be between 1 and 100."); return;
    }
    setSaving(true); setError("");
    const { error: err } = await supabase
      .from("system_settings")
      .upsert({ key: "attendance_cutoff", value: String(num) }, { onConflict: "key" });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(String(num));
  }

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="section">
      <h2>Attendance Settings</h2>

      <div className="settings-card">
        <h3>Minimum Attendance Requirement</h3>
        <p style={{ color: "#555", marginBottom: 20 }}>
          Students whose attendance falls below this percentage will be flagged as low-attendance.
          This value is used across all teacher dashboards and analytics.
        </p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSave} className="settings-form">
          <div className="form-group">
            <label>Attendance Cutoff (%)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="number"
                min="1"
                max="100"
                value={cutoff}
                onChange={e => { setCutoff(e.target.value); setError(""); }}
                style={{ width: 120 }}
                required
              />
              <span style={{ color: "#666" }}>%</span>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Update Cutoff"}
          </button>
        </form>

        {saved && (
          <div className="settings-current">
            <span>Current setting: </span>
            <strong style={{ color: "#2563eb", fontSize: 22 }}>{saved}%</strong>
          </div>
        )}
      </div>

      <div className="settings-card" style={{ marginTop: 24 }}>
        <h3>What this affects</h3>
        <ul className="settings-list">
          <li>Teacher Dashboard low-attendance alerts</li>
          <li>Admin Dashboard student flags</li>
          <li>Attendance History warnings</li>
          <li>Analytics low-attendance student list</li>
        </ul>
      </div>
    </div>
  );
}
