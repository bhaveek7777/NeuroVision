import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../context/AuthContext";

export default function TeacherDashboard() {
  const { teacher } = useAuth();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (teacher?.id) {
      fetchAssignments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacher?.id]);

  async function fetchAssignments() {
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
        .eq("teacher_id", teacher.id)
        .order("id");

      if (error) {
        throw error;
      }

      setAssignments(data || []);

    } catch (err) {
      console.error("Assignment error:", err);
      setError(err.message || "Could not load assignments.");
    } finally {
      setLoading(false);
    }
  }

  function openAttendance(assignment) {

    navigate("/teacher/mark", {
      state: {
        assignmentId: assignment.id,

        subjectId: assignment.subjects?.id,
        subjectName: assignment.subjects?.name,

        divisionId: assignment.divisions?.id,
        divisionName: assignment.divisions?.name,

        classId: assignment.divisions?.classes?.id,
        className: assignment.divisions?.classes?.name,

        startTime: null,
        endTime: null,

        timetableId: null,
        sessionId: null,
        isLocked: false
      }
    });
  }

  if (loading) {
    return (
      <div className="page-loading">
        Loading your assigned classes…
      </div>
    );
  }

  return (
    <div>

      {/* Welcome section */}
      <div className="section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20
          }}
        >
          <div>
            <h2 style={{ marginBottom: 8 }}>
              Welcome back 👋
            </h2>

            <p style={{ color: "#666", margin: 0 }}>
              {teacher?.name || "Teacher"}
            </p>
          </div>

          <button
            className="btn-secondary"
            onClick={fetchAssignments}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="alert-error"
          style={{ marginBottom: 20 }}
        >
          {error}
        </div>
      )}

      {/* Assigned classes */}
      <div className="section">

        <div
          className="section-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div>
            <h2>My Assigned Classes</h2>

            <p style={{ color: "#666", marginTop: 5 }}>
              Select a subject and class to manage attendance.
            </p>
          </div>

          <strong>
            {assignments.length} Assignment
            {assignments.length !== 1 ? "s" : ""}
          </strong>
        </div>

        {assignments.length === 0 ? (

          <div className="empty-state">
            <h3>No assignments yet</h3>

            <p>
              No subjects or classes have been assigned to you.
              Please contact the administrator.
            </p>
          </div>

        ) : (

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
              marginTop: 25
            }}
          >

            {assignments.map((assignment) => {

              const subject =
                assignment.subjects?.name || "Subject";

              const code =
                assignment.subjects?.code || "";

              const division =
                assignment.divisions?.name || "-";

              const className =
                assignment.divisions?.classes?.name || "-";

              return (
                <div
                  key={assignment.id}
                  className="card"
                  style={{
                    cursor: "pointer",
                    padding: 25,
                    transition: "0.2s",
                    border: "1px solid #e5e7eb"
                  }}
                  onClick={() =>
                    openAttendance(assignment)
                  }
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-3px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 20px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "none";
                  }}
                >

                  <div
                    style={{
                      fontSize: 35,
                      marginBottom: 15
                    }}
                  >
                    📚
                  </div>

                  <h3 style={{ marginBottom: 8 }}>
                    {subject}
                  </h3>

                  {code && (
                    <p
                      style={{
                        color: "#666",
                        marginBottom: 15
                      }}
                    >
                      {code}
                    </p>
                  )}

                  <div
                    style={{
                      borderTop: "1px solid #eee",
                      paddingTop: 15,
                      marginTop: 10
                    }}
                  >

                    <p style={{ margin: "6px 0" }}>
                      <strong>Class:</strong>{" "}
                      {className}
                    </p>

                    <p style={{ margin: "6px 0" }}>
                      <strong>Division:</strong>{" "}
                      {division}
                    </p>

                  </div>

                  <button
                    className="btn-primary"
                    style={{
                      width: "100%",
                      marginTop: 20
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openAttendance(assignment);
                    }}
                  >
                    📷 Mark Attendance
                  </button>

                </div>
              );
            })}

          </div>
        )}

      </div>

    </div>
  );
}