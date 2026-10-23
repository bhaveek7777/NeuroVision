import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";

export default function TeacherStudents() {
  const { assignmentId } = useParams();

  const [assignment, setAssignment] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (assignmentId) {
      loadStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  async function loadStudents() {
    setLoading(true);
    setError("");

    try {
      // Get selected teacher assignment
      const { data: assignmentData, error: assignmentError } =
        await supabase
          .from("teacher_assignments")
          .select(`
            id,
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

      if (assignmentError) {
        throw assignmentError;
      }

      if (!assignmentData) {
        throw new Error("Assignment not found.");
      }

      setAssignment(assignmentData);

      // Get students enrolled in this division
      const { data: enrollmentData, error: enrollmentError } =
        await supabase
          .from("student_enrollments")
          .select(`
            student_id,
            division_id,
            academic_year,

            students (
              id,
              name,
              roll_number,
              student_id_code,
              email
            )
          `)
          .eq("division_id", assignmentData.division_id);

      if (enrollmentError) {
        throw enrollmentError;
      }

      const studentList = (enrollmentData || [])
        .map((enrollment) => enrollment.students)
        .filter(Boolean)
        .sort((a, b) =>
          String(a.roll_number || "").localeCompare(
            String(b.roll_number || ""),
            undefined,
            { numeric: true }
          )
        );

      setStudents(studentList);

    } catch (err) {
      console.error("Student loading error:", err);
      setError(err.message || "Unable to load students.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="teacher-students-page">
        <div className="section">
          <h2>Loading students...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-students-page">
        <div className="section">
          <div className="alert-error">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const subjectName =
    assignment?.subjects?.name || "Unknown Subject";

  const className =
    assignment?.divisions?.classes?.name || "Unknown Class";

  const divisionName =
    assignment?.divisions?.name || "Unknown Division";

  return (
    <div className="teacher-students-page">

      {/* Header */}
      <div className="section">

        <h1>
          👨‍🎓 Students
        </h1>

        <p
          style={{
            color: "#666",
            marginTop: "8px"
          }}
        >
          {className} • Division {divisionName}
        </p>

        <p
          style={{
            color: "#666",
            marginTop: "5px"
          }}
        >
          Subject: {subjectName}
        </p>

      </div>

      {/* Student List */}
      <div className="section">

        <div
          className="section-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <h2>
            Student List
          </h2>

          <span>
            Total Students: <strong>{students.length}</strong>
          </span>
        </div>

        {students.length === 0 ? (
          <div className="empty-state">
            <h3>No students found</h3>
            <p>
              No students are enrolled in this division.
            </p>
          </div>
        ) : (
          <div className="table-container">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Roll Number</th>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Email</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student, index) => (
                  <tr key={student.id}>

                    <td>
                      {index + 1}
                    </td>

                    <td>
                      {student.roll_number || "-"}
                    </td>

                    <td>
                      {student.student_id_code || "-"}
                    </td>

                    <td>
                      <strong>
                        {student.name}
                      </strong>
                    </td>

                    <td>
                      {student.email || "-"}
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