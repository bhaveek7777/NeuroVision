
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";

export default function TeacherClassDashboard() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lecturesLoading, setLecturesLoading] = useState(true);
  const [error, setError] = useState("");
  const [lectureError, setLectureError] = useState("");

  const today = new Date();

  const dateText = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(today);

  const dayText = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
  }).format(today);

  useEffect(() => {
    if (assignmentId) {
      loadAssignment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  useEffect(() => {
    if (assignment) {
      loadTodaysLectures();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment]);

  async function loadAssignment() {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
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
        .single();

      if (error) throw error;

      setAssignment(data);
    } catch (err) {
      console.error("Assignment error:", err);
      setError(err.message || "Unable to load selected class.");
    } finally {
      setLoading(false);
    }
  }

  async function loadTodaysLectures() {
    setLecturesLoading(true);
    setLectureError("");
    setLectures([]);

    try {
      const { data, error } = await supabase
        .from("timetable")
        .select(`
          id,
          day_of_week,
          start_time,
          end_time,
          subject_id,
          teacher_id,
          division_id,
          room,
          lecture_no,
          effective_from,
          effective_to,
          status,
          subjects (
            id,
            name,
            code
          ),
          teachers (
            id,
            name
          )
        `)
        .eq("subject_id", assignment.subject_id)
        .eq("division_id", assignment.division_id)
        .eq("status", "published")
        .eq("day_of_week", dayText)
        .order("start_time");

      if (error) throw error;

      const todayLectures = (data || []).filter((lecture) => {
        const starts =
          !lecture.effective_from ||
          lecture.effective_from <= dateText;

        const ends =
          !lecture.effective_to ||
          lecture.effective_to >= dateText;

        // Show lectures assigned to this teacher, or lectures
        // whose timetable teacher has not been assigned yet.
        const teacherMatches =
          !lecture.teacher_id ||
          String(lecture.teacher_id) ===
            String(assignment.teacher_id);

        return starts && ends && teacherMatches;
      });

      setLectures(todayLectures);
    } catch (err) {
      console.error("Timetable loading error:", err);
      setLectureError(
        err.message || "Unable to load today's timetable."
      );
    } finally {
      setLecturesLoading(false);
    }
  }

  function goBack() {
    navigate("/teacher");
  }

  
function startAttendance(lecture) {
  if (!assignment || !lecture?.id) {
    alert("Please select a valid scheduled lecture.");
    return;
  }

  const lectureState = {
    assignmentId: assignment.id,

    subjectId: assignment.subject_id,
    subjectName: assignment.subjects?.name,
    subjectCode: assignment.subjects?.code,

    divisionId: assignment.division_id,
    divisionName: assignment.divisions?.name,

    classId: assignment.divisions?.classes?.id,
    className: assignment.divisions?.classes?.name,

    timetableId: lecture.id,
    timetable_id: lecture.id,

    startTime: lecture.start_time,
    endTime: lecture.end_time,
    lectureDate: dateText,
    room: lecture.room || "",

    sessionId: null,
    isLocked: false,
  };

  console.log("Opening attendance for lecture:", lectureState);

  navigate(`/teacher/class/${assignment.id}/attendance`, {
    state: lectureState,
  });
}


  function formatTime(time) {
    if (!time) return "—";

    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  if (loading) {
    return (
      <div className="teacher-class-dashboard">
        <div className="section">
          <h2>Loading class...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-class-dashboard">
        <div className="section">
          <div className="alert-error">{error}</div>
          <button className="btn-secondary" onClick={goBack}>
            ← Back to My Classes
          </button>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="teacher-class-dashboard">
        <div className="section">
          <h2>Assignment not found</h2>
          <button className="btn-secondary" onClick={goBack}>
            ← Back to My Classes
          </button>
        </div>
      </div>
    );
  }

  const subjectName =
    assignment.subjects?.name || "Unknown Subject";

  const subjectCode = assignment.subjects?.code || "";

  const className =
    assignment.divisions?.classes?.name || "Unknown Class";

  const divisionName =
    assignment.divisions?.name || "Unknown Division";

  return (
    <div className="teacher-class-dashboard">
      <div className="section">
        <button
          className="btn-secondary"
          onClick={goBack}
          style={{ marginBottom: "25px" }}
        >
          ← Back to My Classes
        </button>

        <h1>{subjectName}</h1>

        {subjectCode && (
          <p style={{ color: "#666", marginTop: "5px" }}>
            Subject Code: {subjectCode}
          </p>
        )}

        <p style={{ color: "#666", marginTop: "10px" }}>
          {className} • Division {divisionName}
        </p>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Class Information</h2>
        </div>

        <div className="class-info-grid">
          <div className="info-card">
            <div className="info-icon">📚</div>
            <div className="info-label">Subject</div>
            <div className="info-value">{subjectName}</div>
          </div>

          <div className="info-card">
            <div className="info-icon">🎓</div>
            <div className="info-label">Class</div>
            <div className="info-value">{className}</div>
          </div>

          <div className="info-card">
            <div className="info-icon">🔤</div>
            <div className="info-label">Division</div>
            <div className="info-value">{divisionName}</div>
          </div>

          <div className="info-card">
            <div className="info-icon">📅</div>
            <div className="info-label">Date</div>
            <div className="info-value">{dateText}</div>
          </div>

          <div className="info-card">
            <div className="info-icon">⏰</div>
            <div className="info-label">Today's Lectures</div>
            <div className="info-value">
              {lecturesLoading ? "Loading..." : lectures.length}
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">📆</div>
            <div className="info-label">Day</div>
            <div className="info-value">{dayText}</div>
          </div>
        </div>
      </div>

      <div className="section">
        <h2>Today's Scheduled Lectures</h2>

        <p
          style={{
            color: "#666",
            marginTop: "10px",
            marginBottom: "20px",
          }}
        >
          Select a published lecture to start attendance.
        </p>

        {lecturesLoading && <p>Loading timetable...</p>}

        {lectureError && (
          <div className="alert-error">{lectureError}</div>
        )}

        {!lecturesLoading &&
          !lectureError &&
          lectures.length === 0 && (
            <div className="info-card">
              No published lectures found for this subject and
              division today.
            </div>
          )}

        {!lecturesLoading &&
          lectures.map((lecture) => (
            <div
              className="info-card"
              key={lecture.id}
              style={{
                marginBottom: "15px",
                padding: "20px",
              }}
            >
              <h3>
                {lecture.subjects?.name || subjectName}
                {lecture.lecture_no
                  ? ` — Lecture ${lecture.lecture_no}`
                  : ""}
              </h3>

              <p style={{ color: "#666", marginTop: "8px" }}>
                🕒 {formatTime(lecture.start_time)} –{" "}
                {formatTime(lecture.end_time)}
              </p>

              <p style={{ color: "#666", marginTop: "5px" }}>
                📍 Room: {lecture.room || "Not specified"}
              </p>

              <p style={{ color: "#666", marginTop: "5px" }}>
                👨‍🏫 Teacher:{" "}
                {lecture.teachers?.name || "Not assigned"}
              </p>

              <button
                className="btn-primary"
                style={{ marginTop: "15px" }}
                onClick={() => startAttendance(lecture)}
              >
                📷 Mark Attendance
              </button>
            </div>
          ))}

        <button
          className="btn-secondary"
          style={{ marginTop: "10px" }}
          onClick={() =>
            navigate(`/teacher/class/${assignment.id}/students`)
          }
        >
          👨‍🎓 View Students
        </button>
      </div>
    </div>
  );
}
