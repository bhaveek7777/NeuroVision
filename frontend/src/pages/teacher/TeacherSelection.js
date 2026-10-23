import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../context/AuthContext";

export default function TeacherSelection() {
  const { teacher } = useAuth();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (teacher?.id) {
      loadAssignments();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacher?.id]);

  async function loadAssignments() {
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

      console.log("TEACHER ASSIGNMENTS:", data);

      setAssignments(data || []);

    } catch (err) {
      console.error("Assignment loading error:", err);
      setError(err.message || "Unable to load assignments.");
    } finally {
      setLoading(false);
    }
  }

  function openAssignment(assignment) {
    navigate(`/teacher/class/${assignment.id}`);
  }

  // Logout
  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  if (loading) {
    return (
      <div className="teacher-selection-page">
        <div className="selection-header">
          <h2>Loading classes...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-selection-page">

      {/* Header */}
      <div
        className="selection-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px"
        }}
      >

        <div>
          <h2>Profile Selection</h2>

          <p>
            Select a subject and class to continue
          </p>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: "8px",
            background: "#dc3545",
            color: "white",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          🚪 Logout
        </button>

      </div>

      {/* Error */}
      {error && (
        <div className="alert-error">
          {error}
        </div>
      )}

      {/* No assignments */}
      {assignments.length === 0 ? (

        <div className="empty-state">

          <h3>No assignments found</h3>

          <p>
            No subjects or classes have been assigned to you.
          </p>

        </div>

      ) : (

        /* Assignment Cards */
        <div className="profile-grid">

          {assignments.map((assignment) => {

            const subjectName =
              assignment.subjects?.name || "Unknown Subject";

            const subjectCode =
              assignment.subjects?.code || "";

            const className =
              assignment.divisions?.classes?.name || "Unknown Class";

            const divisionName =
              assignment.divisions?.name || "Unknown Division";

            return (

              <div
                className="profile-card"
                key={assignment.id}
              >

                <div className="profile-top">
                  {className} - {divisionName}
                </div>

                <h3>
                  {subjectName}
                </h3>

                {subjectCode && (
                  <p>
                    Subject Code: {subjectCode}
                  </p>
                )}

                <p>
                  Class: {className}
                </p>

                <p>
                  Division: {divisionName}
                </p>

                <button
                  className="profile-next"
                  onClick={() => openAssignment(assignment)}
                >
                  Next →
                </button>

                <div className="profile-decoration">
                  ●
                  <br />
                  ●●
                </div>

              </div>

            );
          })}

        </div>

      )}

    </div>
  );
}