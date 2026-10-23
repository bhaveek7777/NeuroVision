
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  const [search, setSearch] = useState("");
  const [filterDiv, setFilterDiv] = useState("");
  const [filterDept, setFilterDept] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    roll_number: "",
    student_id_code: "",
    email: "",
    department_id: "",
    division_id: "",
  });

  const [faceStudent, setFaceStudent] = useState(null);
  const [faceImageCount, setFaceImageCount] = useState(3);
  const [faceImages, setFaceImages] = useState([]);
  const [faceRegistering, setFaceRegistering] = useState(false);
  const [faceMessage, setFaceMessage] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    setError("");

    try {
      // Fetch BOTH active and inactive students.
      const [
        { data: studs, error: studentsError },
        { data: depts, error: departmentsError },
        { data: divs, error: divisionsError },
      ] = await Promise.all([
        supabase
          .from("students")
          .select(`
            *,
            student_enrollments(
              division_id,
              divisions(
                name,
                classes(name)
              )
            )
          `)
          .order("roll_number"),

        supabase
          .from("departments")
          .select("*")
          .order("name"),

        supabase
          .from("divisions")
          .select(`
            *,
            classes(name)
          `)
          .order("name"),
      ]);

      if (studentsError) throw studentsError;
      if (departmentsError) throw departmentsError;
      if (divisionsError) throw divisionsError;

      const studentsWithDepartments = (studs || []).map((student) => ({
        ...student,

        // Existing records without a status are treated as active.
        is_active: student.is_active !== false,

        departments:
          (depts || []).find(
            (dept) =>
              String(dept.id) === String(student.department_id)
          ) || null,
      }));

      setStudents(studentsWithDepartments);
      setDepartments(depts || []);
      setDivisions(divs || []);
    } catch (err) {
      console.error("Student Management fetch error:", err);
      setError(err.message || "Could not load students.");
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setForm({
      name: "",
      roll_number: "",
      student_id_code: "",
      email: "",
      department_id: "",
      division_id: "",
    });

    setEditId(null);
    setError("");
    setShowForm(true);
  }

  function openEdit(student) {
    const enrollment = student.student_enrollments?.[0];

    setForm({
      name: student.name || "",
      roll_number: student.roll_number || "",
      student_id_code: student.student_id_code || "",
      email: student.email || "",
      department_id: student.department_id || "",
      division_id: enrollment?.division_id || "",
    });

    setEditId(student.id);
    setError("");
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !String(form.roll_number).trim() ||
      !form.student_id_code.trim()
    ) {
      setError("Name, roll number and student ID are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const studentPayload = {
        name: form.name.trim(),
        roll_number: String(form.roll_number).trim(),
        student_id_code: form.student_id_code.trim(),
        email: form.email.trim() || null,
        department_id: form.department_id || null,
      };

      let studentId = editId;

      if (editId) {
        const { error: updateError } = await supabase
          .from("students")
          .update(studentPayload)
          .eq("id", editId);

        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabase
          .from("students")
          .insert({
            ...studentPayload,
            is_active: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        studentId = data.id;
      }

      if (form.division_id) {
        const { error: deleteEnrollmentError } = await supabase
          .from("student_enrollments")
          .delete()
          .eq("student_id", studentId);

        if (deleteEnrollmentError) throw deleteEnrollmentError;

        const { error: enrollmentError } = await supabase
          .from("student_enrollments")
          .insert({
            student_id: studentId,
            division_id: form.division_id,
            academic_year: "2026-27",
          });

        if (enrollmentError) throw enrollmentError;
      }

      setShowForm(false);
      await fetchAll();
    } catch (err) {
      setError(err.message || "Could not save student.");
    } finally {
      setSaving(false);
    }
  }

  async function handleFaceRegistration() {
    if (!faceStudent) return;

    if (faceImages.length !== Number(faceImageCount)) {
      setFaceMessage(
        `Please select exactly ${faceImageCount} image(s).`
      );
      return;
    }

    setFaceRegistering(true);
    setFaceMessage("");

    try {
      const formData = new FormData();

      formData.append("student_id", String(faceStudent.id));

      faceImages.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch(
        "http://127.0.0.1:8000/api/register-student",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.detail ||
            data.message ||
            "Face registration failed."
        );
      }

      setFaceMessage(
        `Face registration successful. ${
          data.images_processed
        } image(s) processed.`
      );

      setFaceImages([]);
      await fetchAll();
    } catch (err) {
      console.error("Face registration error:", err);
      setFaceMessage(err.message);
    } finally {
      setFaceRegistering(false);
    }
  }

  // Toggle active status without deleting the student record.
  async function toggleActive(student) {
    const currentlyActive = student.is_active !== false;
    const newActiveStatus = !currentlyActive;

    const action = newActiveStatus ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `${action.charAt(0).toUpperCase() + action.slice(1)} student "${student.name}"?`
    );

    if (!confirmed) return;

    setTogglingId(student.id);
    setError("");

    try {
      const { data, error: updateError } = await supabase
        .from("students")
        .update({ is_active: newActiveStatus })
        .eq("id", student.id)
        .select("id, is_active");

      if (updateError) throw updateError;

      if (!data || data.length === 0) {
        throw new Error(
          "Student status was not updated. Check your Supabase RLS UPDATE policy."
        );
      }

      // Update the UI immediately.
      setStudents((previousStudents) =>
        previousStudents.map((item) =>
          String(item.id) === String(student.id)
            ? { ...item, is_active: newActiveStatus }
            : item
        )
      );

      // Confirm the latest data from Supabase.
      await fetchAll();
    } catch (err) {
      console.error("Student status update error:", err);
      setError(err.message || "Could not update student status.");
    } finally {
      setTogglingId(null);
    }
  }

  const filtered = students.filter((student) => {
    const enrollment = student.student_enrollments?.[0];

    const searchText = search.toLowerCase();

    const matchSearch =
      !searchText ||
      (student.name || "").toLowerCase().includes(searchText) ||
      String(student.roll_number || "").includes(searchText) ||
      (student.student_id_code || "")
        .toLowerCase()
        .includes(searchText);

    const matchDiv =
      !filterDiv ||
      String(enrollment?.division_id) === String(filterDiv);

    const matchDept =
      !filterDept ||
      String(student.department_id) === String(filterDept);

    return matchSearch && matchDiv && matchDept;
  });

  if (loading) {
    return <div className="page-loading">Loading…</div>;
  }

  return (
    <div className="section">
      <div className="section-header">
        <h2>Students</h2>

        <button className="btn-primary" onClick={openAdd}>
          + Add Student
        </button>
      </div>

      {error && (
        <div className="alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="filter-bar">
        <input
          className="search"
          placeholder="Search by name, roll no, ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={filterDiv}
          onChange={(e) => setFilterDiv(e.target.value)}
        >
          <option value="">All Divisions</option>
          {divisions.map((division) => (
            <option key={division.id} value={division.id}>
              {division.classes?.name} – Div {division.name}
            </option>
          ))}
        </select>

        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>

        <button
          className="btn-secondary"
          onClick={() => {
            setSearch("");
            setFilterDiv("");
            setFilterDept("");
          }}
        >
          Clear
        </button>
      </div>

      <p style={{ color: "#666", marginBottom: 12 }}>
        Showing {filtered.length} of {students.length} students
      </p>

      {filtered.length === 0 ? (
        <p className="empty-state">
          No students match the current filters.
        </p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Roll No</th>
                <th>Name</th>
                <th>Class</th>
                <th>Division</th>
                <th>Department</th>
                <th>Embedding</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((student) => {
                const enrollment =
                  student.student_enrollments?.[0];

                const active = student.is_active !== false;

                return (
                  <tr
                    key={student.id}
                    style={
                      !active
                        ? { opacity: 0.7, background: "#fafafa" }
                        : undefined
                    }
                  >
                    <td>{student.student_id_code}</td>
                    <td>{student.roll_number}</td>
                    <td>{student.name}</td>
                    <td>
                      {enrollment?.divisions?.classes?.name || "—"}
                    </td>
                    <td>{enrollment?.divisions?.name || "—"}</td>
                    <td>{student.departments?.name || "—"}</td>

                    <td>
                      <span
                        className={
                          student.face_embedding
                            ? "badge-active"
                            : "badge-inactive"
                        }
                      >
                        {student.face_embedding
                          ? "✓ Set"
                          : "Not set"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          active
                            ? "badge-active"
                            : "badge-inactive"
                        }
                      >
                        {active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          className="btn-sm btn-edit"
                          onClick={() => openEdit(student)}
                        >
                          Edit
                        </button>

                        <button
                          className="btn-sm"
                          onClick={() => {
                            setFaceStudent(student);
                            setFaceImageCount(3);
                            setFaceImages([]);
                            setFaceMessage("");
                          }}
                          disabled={!active}
                          title={
                            active
                              ? "Register face images"
                              : "Activate this student first"
                          }
                        >
                          Register Face
                        </button>

                        <button
                          className={`btn-sm ${
                            active ? "btn-danger" : "btn-primary"
                          }`}
                          onClick={() => toggleActive(student)}
                          disabled={togglingId === student.id}
                        >
                          {togglingId === student.id
                            ? "Updating…"
                            : active
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <h3>{editId ? "Edit Student" : "Add Student"}</h3>

            {error && <div className="alert-error">{error}</div>}

            <form onSubmit={handleSave} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Student ID Code</label>
                  <input
                    placeholder="e.g. STU001"
                    value={form.student_id_code}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        student_id_code: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Roll Number</label>
                  <input
                    placeholder="e.g. 23"
                    value={form.roll_number}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        roll_number: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    placeholder="Student name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email (optional)</label>
                  <input
                    type="email"
                    placeholder="student@college.edu"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Department</label>
                  <select
                    value={form.department_id}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        department_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">None</option>
                    {departments.map((department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Enroll in Division</label>
                  <select
                    value={form.division_id}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        division_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Not enrolled</option>
                    {divisions.map((division) => (
                      <option key={division.id} value={division.id}>
                        {division.classes?.name} – Div {division.name}
                      </option>
                    ))}
                  </select>
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
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {faceStudent && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <h3>Register Face</h3>

            <p style={{ marginBottom: 20 }}>
              <strong>Student:</strong> {faceStudent.name}
              <br />
              <strong>Roll Number:</strong> {faceStudent.roll_number}
              <br />
              <strong>Student ID:</strong> {faceStudent.student_id_code}
            </p>

            <div className="form-group">
              <label>Number of Face Images</label>
              <select
                value={faceImageCount}
                onChange={(e) => {
                  setFaceImageCount(Number(e.target.value));
                  setFaceImages([]);
                  setFaceMessage("");
                }}
              >
                {Array.from({ length: 10 }, (_, index) => index + 1).map(
                  (number) => (
                    <option key={number} value={number}>
                      {number}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="form-group">
              <label>
                Select {faceImageCount} face image
                {faceImageCount > 1 ? "s" : ""}
              </label>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);

                  if (files.length !== faceImageCount) {
                    setFaceImages([]);
                    setFaceMessage(
                      `Please select exactly ${faceImageCount} image(s). You selected ${files.length}.`
                    );
                    return;
                  }

                  setFaceImages(files);
                  setFaceMessage("");
                }}
              />
            </div>

            {faceImages.length > 0 && (
              <div
                style={{
                  marginTop: 15,
                  padding: 12,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              >
                <strong>
                  Selected Images: {faceImages.length} / {faceImageCount}
                </strong>

                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                  {faceImages.map((file, index) => (
                    <li key={`${file.name}-${index}`}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}

            {faceMessage && (
              <div
                className={
                  faceMessage.toLowerCase().includes("successful")
                    ? "alert-success"
                    : "alert-error"
                }
                style={{ marginTop: 15 }}
              >
                {faceMessage}
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setFaceStudent(null);
                  setFaceImages([]);
                  setFaceMessage("");
                }}
                disabled={faceRegistering}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-primary"
                disabled={
                  faceRegistering ||
                  faceImages.length !== Number(faceImageCount)
                }
                onClick={handleFaceRegistration}
              >
                {faceRegistering
                  ? "Creating Embeddings..."
                  : "Create Face Embeddings"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
