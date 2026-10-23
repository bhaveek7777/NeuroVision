
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../context/AuthContext";

export default function MarkAttendance() {
  const { teacher } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { assignmentId: paramAssignmentId } = useParams();

  const selectedLecture = location.state || {};
  const timetableId =
    selectedLecture.timetableId ||
    selectedLecture.timetable_id ||
    null;
  const lectureDate = selectedLecture.lectureDate || null;

  const selectedAssignmentId =
    paramAssignmentId || selectedLecture.assignmentId;

  const [assignment, setAssignment] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recognizing, setRecognizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [, setSessionId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [existingSession, setExistingSession] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const now = new Date();

  const todayDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const attendanceDate = lectureDate || todayDate;

  useEffect(() => {
    if (teacher?.id && selectedAssignmentId) {
      fetchData();
    } else if (teacher?.id && !selectedAssignmentId) {
      setLoading(false);
      setError("No assignment selected.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacher?.id, selectedAssignmentId]);
  
  async function checkExistingAttendance() {
  if (!timetableId) return;

  setCheckingExisting(true);

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/attendance/sessions/by-timetable/${timetableId}?attendance_date=${attendanceDate}`
    );

    if (!response.ok) {
      throw new Error("Could not check existing attendance.");
    }

    const result = await response.json();

    if (result.exists && result.session) {
      setExistingSession(result.session);
      setSessionId(result.session.id);
    } else {
      setExistingSession(null);
      setSessionId(null);
    }
  } catch (err) {
    console.error("Existing attendance check failed:", err);
    setError(err.message);
  } finally {
    setCheckingExisting(false);
  }
}

  async function fetchData() {
    setLoading(true);
    setError("");

    try {
      const { data: assignmentData, error: assignmentError } =
        await supabase
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
              classes (
                id,
                name
              )
            )
          `)
          .eq("id", selectedAssignmentId)
          .eq("teacher_id", teacher.id)
          .single();

      if (assignmentError) throw assignmentError;

      // Ensure the selected lecture matches this assignment.
      if (
        timetableId &&
        (
          String(assignmentData.subject_id) !==
            String(selectedLecture.subjectId) ||
          String(assignmentData.division_id) !==
            String(selectedLecture.divisionId)
        )
      ) {
        throw new Error(
          "The selected lecture does not match this class assignment."
        );
      }

      setAssignment(assignmentData);

      const { data: enrollments, error: enrollmentError } =
        await supabase
          .from("student_enrollments")
          .select(`
            students (
              id,
              name,
              roll_number
            )
          `)
          .eq("division_id", assignmentData.division_id);

      if (enrollmentError) throw enrollmentError;

      const studentList = (enrollments || [])
        .map((item) => item.students)
        .filter(Boolean);

      studentList.sort(
        (a, b) =>
          Number(a.roll_number) - Number(b.roll_number) ||
          a.name.localeCompare(b.name)
      );

      setStudents(
        studentList.map((student) => ({
          ...student,
          status: "absent",
        }))
      );

      await checkExistingAttendance();
    } catch (err) {
      console.error("Mark Attendance Error:", err);
      setError(
        err.message || "Could not load attendance information."
      );
    } finally {
      setLoading(false);
    }
  }

  function startAttendance() {
    setShowUpload(true);
    setReviewMode(false);
    setSelectedImages([]);
    setMessage("");
    setError("");
  }

  // Face recognition endpoint remains unchanged.
  async function recognizeClassroomPhoto() {
    if (selectedImages.length === 0) {
      setError("Please select at least one classroom photo.");
      return;
    }

    setRecognizing(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();

      selectedImages.forEach((image) => {
        formData.append("images", image);
      });

      const response = await fetch(
        "http://127.0.0.1:8000/api/recognize",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.detail || data.error || "Face recognition failed."
        );
      }

      console.log("NeuroVision combined result:", data);

      const recognized = data.students || [];

      setStudents((previousStudents) =>
        previousStudents.map((student) => {
          const matched = recognized.find(
            (item) =>
              String(item.roll_no ?? "").trim() !== "" &&
              String(item.roll_no).trim() ===
                String(student.roll_number ?? "").trim()
          );

          return {
            ...student,
            status:
              matched?.status === "Present" ? "present" : "absent",
          };
        })
      );

      setShowUpload(false);
      setReviewMode(true);

      setMessage(
        `Processed ${
          data.photos_processed ?? selectedImages.length
        } photo(s), detected ${
          data.total_faces ?? 0
        } face(s), and recognized ${
          data.matched_faces ?? 0
        } unique student(s). Please review attendance before saving.`
      );
    } catch (err) {
      console.error("Recognition Error:", err);
      setError(err.message || "Face recognition failed.");
    } finally {
      setRecognizing(false);
    }
  }

  function changeStatus(studentId) {
    setStudents((previous) =>
      previous.map((student) =>
        student.id === studentId
          ? {
              ...student,
              status:
                student.status === "present" ? "absent" : "present",
            }
          : student
      )
    );
  }

  function markAll(status) {
    setStudents((previous) =>
      previous.map((student) => ({
        ...student,
        status,
      }))
    );
  }

  // Save attendance through FastAPI, linked to the selected lecture.
  async function saveAttendance() {
    if (!assignment) {
      setError("Assignment information is missing.");
      return;
    }

    if (!timetableId) {
      setError(
        "No timetable lecture was selected. Return to your class and click Mark Attendance on a scheduled lecture."
      );
      return;
    }

    if (!students.length) {
      setError("No students found for this division.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const records = students.map((student) => ({
        student_id: student.id,
        student_name: student.name,
        status: student.status === "present" ? "Present" : "Absent",
        marked_by: "face_recognition",
      }));

      const response = await fetch(
        "http://127.0.0.1:8000/api/attendance/sessions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            timetable_id: timetableId,
            subject_id: assignment.subject_id,
            division_id: assignment.division_id,
            date: attendanceDate,
            attendance_date: attendanceDate,
            subject: assignment.subjects?.name || "Unknown Subject",
            subject_code: assignment.subjects?.code || "",
            class_name:
              assignment.divisions?.classes?.name || "Unknown Class",
            division: assignment.divisions?.name || "",
            teacher_name: teacher?.name || "Teacher",
            records,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.detail || "Could not save attendance."
        );
      }

      setSessionId(result.session?.id || null);
      setMessage(
        `Attendance saved successfully for timetable lecture ${timetableId}.`
      );
      setReviewMode(false);
      setShowUpload(false);
      setSelectedImages([]);
    } catch (err) {
      console.error("Save Attendance Error:", err);
      setError(err.message || "Could not save attendance.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="page-loading">Loading attendance…</div>;
  }

  if (!assignment) {
    return (
      <div className="section">
        <div className="alert-error">
          {error || "Attendance assignment not found."}
        </div>

        <button
          className="btn-secondary"
          onClick={() => navigate("/teacher")}
          style={{ marginTop: 15 }}
        >
          ← Back
        </button>
      </div>
    );
  }

  const assignmentSubjectName =
    assignment.subjects?.name || "Unknown Subject";

  const assignmentClassName =
    assignment.divisions?.classes?.name || "Unknown Class";

  const assignmentDivisionName =
    assignment.divisions?.name || "—";

  const present = students.filter(
    (student) => student.status === "present"
  ).length;

  const absent = students.filter(
    (student) => student.status === "absent"
  ).length;

  function formatTime(time) {
    if (!time) return "Not scheduled";

    const [hours, minutes] = time.split(":");
    const parsed = new Date();
    parsed.setHours(Number(hours), Number(minutes), 0, 0);

    return parsed.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  return (
    <div>
      {/* HEADER */}
      <div className="section">
        <button
          className="btn-secondary"
          onClick={() =>
            navigate(`/teacher/class/${selectedAssignmentId}`)
          }
          style={{ marginBottom: 20 }}
        >
          ← Back to Class
        </button>

        <h2>Mark Attendance</h2>

        <p style={{ color: "#666", marginTop: 6 }}>
          {assignmentSubjectName} • {assignmentClassName} • Division{" "}
          {assignmentDivisionName}
        </p>
      </div>

      {/* LECTURE INFORMATION */}
      <div className="section">
        <h2>Lecture Information</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 15,
            marginTop: 20,
          }}
        >
          <Info
            title="Subject"
            value={assignmentSubjectName}
            icon="📚"
          />

          <Info
            title="Class"
            value={assignmentClassName}
            icon="🎓"
          />

          <Info
            title="Division"
            value={assignmentDivisionName}
            icon="🔤"
          />

          <Info
            title="Date"
            value={attendanceDate}
            icon="📅"
          />

          <Info
            title="Time"
            value={
              selectedLecture.startTime && selectedLecture.endTime
                ? `${formatTime(selectedLecture.startTime)} – ${formatTime(
                    selectedLecture.endTime
                  )}`
                : "Not scheduled"
            }
            icon="⏰"
          />

          <Info
            title="Timetable ID"
            value={timetableId || "Not selected"}
            icon="🗓️"
          />
        </div>
      </div>
      {existingSession && (
  <div className="section">
    {existingSession.records?.length > 0 ? (
      <>
        <h2>Attendance Already Marked</h2>
        <p>
          Present: {existingSession.present_count} |
          Absent: {existingSession.absent_count}
        </p>
        <p>Session ID: {existingSession.id}</p>
      </>
    ) : (
      <div className="alert-error">
        An attendance session exists, but no student records
        were saved. Session ID: {existingSession.id}.
        Do not submit attendance again until this session
        has been checked.
      </div>
    )}
  </div>
)}
      {/* STEP 1 */}
      {!showUpload && !reviewMode && (
        <div className="section">
          <h2>Ready to Mark Attendance?</h2>

          <p
            style={{
              color: "#666",
              marginTop: 8,
              marginBottom: 20,
            }}
          >
            Upload multiple classroom photos to identify students
            across the classroom.
          </p>

          {message && (
            <div className="alert-success" style={{ marginBottom: 15 }}>
              {message}
            </div>
          )}

          {error && (
            <div className="alert-error" style={{ marginBottom: 15 }}>
              {error}
            </div>
          )}

          <button
            className="btn-primary"
            onClick={startAttendance}
            disabled={checkingExisting || !!existingSession}
            style={{ padding: "14px 25px", fontSize: 16 }}
          >
            📷 Mark Attendance
          </button>
        </div>
      )}

      {/* STEP 2: MULTIPLE PHOTO UPLOAD */}
      {showUpload && !reviewMode && (
        <div className="section">
          <h2>Upload Classroom Photos</h2>

          <p style={{ color: "#666", marginTop: 8 }}>
            Select up to 15 JPG, JPEG, PNG or WEBP photos. Students
            appearing in multiple photos will be counted once.
          </p>

          <div
            className="camera"
            style={{ maxWidth: 700, padding: 25, marginTop: 20 }}
          >
            <div
              className="camera-icon"
              style={{ fontSize: 50, marginBottom: 15 }}
            >
              📷
            </div>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                const allowed = /\.(jpg|jpeg|png|webp)$/i;

                if (files.length > 15) {
                  setSelectedImages([]);
                  setError(
                    "Please select no more than 15 photos at once."
                  );
                  e.target.value = "";
                  return;
                }

                const invalidFile = files.find(
                  (file) => !allowed.test(file.name)
                );

                if (invalidFile) {
                  setSelectedImages([]);
                  setError(
                    "Only JPG, JPEG, PNG and WEBP images are supported."
                  );
                  e.target.value = "";
                  return;
                }

                setSelectedImages(files);
                setError("");
                setMessage("");
              }}
            />

            {selectedImages.length > 0 && (
              <div style={{ marginTop: 12, textAlign: "left" }}>
                <strong>
                  {selectedImages.length} photo(s) selected
                </strong>

                {selectedImages.map((image, index) => (
                  <div
                    key={`${image.name}-${image.size}-${index}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 8,
                    }}
                  >
                    <span style={{ overflowWrap: "anywhere" }}>
                      {index + 1}. {image.name}
                    </span>

                    <button
                      type="button"
                      className="btn-sm btn-danger"
                      onClick={() =>
                        setSelectedImages((previous) =>
                          previous.filter((_, i) => i !== index)
                        )
                      }
                      disabled={recognizing}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p style={{ color: "#dc2626", marginTop: 12 }}>
                {error}
              </p>
            )}

            <button
              className="btn-primary"
              onClick={recognizeClassroomPhoto}
              disabled={selectedImages.length === 0 || recognizing}
              style={{ marginTop: 18 }}
            >
              {recognizing
                ? "🤖 Processing photos..."
                : `🤖 Process ${selectedImages.length} Photo(s)`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ATTENDANCE REVIEW */}
      {reviewMode && (
        <>
          <div className="section">
            <div className="section-header">
              <div>
                <h2>Attendance Review</h2>

                <p style={{ color: "#666", marginTop: 5 }}>
                  Review the combined AI results from all photos.
                  Correct attendance before saving.
                </p>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="cards" style={{ padding: "0 0 20px" }}>
            <div className="card green">
              <h3>Present</h3>
              <h2>{present}</h2>
            </div>

            <div className="card red">
              <h3>Absent</h3>
              <h2>{absent}</h2>
            </div>

            <div className="card blue">
              <h3>Total</h3>
              <h2>{students.length}</h2>
            </div>
          </div>

          {message && (
            <div className="alert-success" style={{ marginBottom: 15 }}>
              {message}
            </div>
          )}

          {error && (
            <div className="alert-error" style={{ marginBottom: 15 }}>
              {error}
            </div>
          )}

          {/* BULK BUTTONS */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 15,
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn-secondary"
              onClick={() => markAll("present")}
            >
              Mark All Present
            </button>

            <button
              className="btn-secondary"
              onClick={() => markAll("absent")}
            >
              Mark All Absent
            </button>
          </div>

          {/* ATTENDANCE TABLE */}
          <div className="section">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Roll No</th>
                    <th>Student</th>
                    <th>AI Result</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {students.map((student, index) => (
                    <tr key={student.id}>
                      <td>{index + 1}</td>
                      <td>{student.roll_number}</td>
                      <td>{student.name}</td>

                      <td>
                        <span
                          className={
                            student.status === "present"
                              ? "present"
                              : "absent"
                          }
                        >
                          {student.status === "present"
                            ? "✓ Present"
                            : "✗ Absent"}
                        </span>
                      </td>

                      <td>
                        <button
                          className={
                            student.status === "present"
                              ? "btn-sm btn-danger"
                              : "btn-sm btn-edit"
                          }
                          onClick={() => changeStatus(student.id)}
                        >
                          {student.status === "present"
                            ? "Mark Absent"
                            : "Mark Present"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SAVE ATTENDANCE */}
          <div
            className="section"
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn-primary"
              onClick={saveAttendance}
              disabled={saving}
              style={{ padding: "13px 22px" }}
            >
              {saving
                ? "Saving..."
                : "✅ Generate Final Attendance"}
            </button>

            <button
              className="btn-secondary"
              onClick={() => {
                setReviewMode(false);
                setShowUpload(true);
                setSelectedImages([]);
                setMessage("");
                setError("");
              }}
            >
              ← Upload Different Photos
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Info({ title, value, icon }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontSize: 25, marginBottom: 7 }}>{icon}</div>

      <div
        style={{
          color: "#777",
          fontSize: 13,
          marginBottom: 5,
        }}
      >
        {title}
      </div>

      <strong>{value}</strong>
    </div>
  );
}
