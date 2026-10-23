import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { supabase } from "../../supabaseClient";

export default function Analytics() {
  const { assignmentId } = useParams();

  const [subjectStats, setSubjectStats] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [studentData, setStudentData] = useState([]);
  const [cutoff, setCutoff] = useState(75);
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    pct: 0,
  });
  const [filterView, setFilterView] = useState("all");

  useEffect(() => {
    if (assignmentId) {
      fetchAll();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  async function fetchAll() {
    setLoading(true);

    try {
      // =====================================================
      // STEP 1: Get current teacher assignment
      // =====================================================

      const {
        data: assignment,
        error: assignmentError,
      } = await supabase
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
            name
          )
        `)
        .eq("id", assignmentId)
        .single();

      if (assignmentError) {
        console.error(
          "Analytics assignment error:",
          assignmentError
        );
        setLoading(false);
        return;
      }

      if (!assignment) {
        console.error("Assignment not found.");
        setLoading(false);
        return;
      }

      console.log(
        "Analytics assignment:",
        assignment
      );

      // =====================================================
      // STEP 2: Get attendance cutoff
      // =====================================================

      const {
        data: cutoffData,
        error: cutoffError,
      } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "attendance_cutoff")
        .maybeSingle();

      if (cutoffError) {
        console.log(
          "Attendance cutoff not available. Using 75%."
        );
      }

      const cut = Number(
        cutoffData?.value || 75
      );

      setCutoff(cut);

      // =====================================================
      // STEP 3: Get attendance sessions
      //
      // Use subject + division from the current assignment.
      // We do NOT use teacher_id here.
      // =====================================================

      const {
        data: sessions,
        error: sessionsError,
      } = await supabase
        .from("attendance_sessions")
        .select(`
          id,
          date,
          subject_id,
          division_id
        `)
        .eq(
          "subject_id",
          assignment.subject_id
        )
        .eq(
          "division_id",
          assignment.division_id
        )
        .order("date", {
          ascending: true,
        });

      if (sessionsError) {
        console.error(
          "Analytics sessions error:",
          sessionsError
        );
        setLoading(false);
        return;
      }

      console.log(
        "Analytics sessions:",
        sessions
      );

      if (!sessions || sessions.length === 0) {
        console.log(
          "No attendance sessions found for this subject/division."
        );

        setSubjectStats([]);
        setTrendData([]);
        setStudentData([]);

        setOverallStats({
          total: 0,
          present: 0,
          absent: 0,
          pct: 0,
        });

        setLoading(false);
        return;
      }

      // =====================================================
      // STEP 4: Get attendance records
      // =====================================================

      const sessionIds = sessions.map(
        (session) => session.id
      );

      const {
        data: records,
        error: recordsError,
      } = await supabase
        .from("attendance_records")
        .select(`
          session_id,
          student_id,
          status,
          students (
            id,
            name,
            roll_number
          )
        `)
        .in(
          "session_id",
          sessionIds
        );

      if (recordsError) {
        console.error(
          "Analytics records error:",
          recordsError
        );
        setLoading(false);
        return;
      }

      console.log(
        "Analytics records:",
        records
      );

      // =====================================================
      // STEP 5: Subject-wise statistics
      // =====================================================

      const subjectMap = {};

      sessions.forEach((session) => {
        const subjectId =
          session.subject_id;

        if (!subjectId) {
          return;
        }

        const subjectName =
          assignment.subjects?.name ||
          "Unknown Subject";

        if (!subjectMap[subjectId]) {
          subjectMap[subjectId] = {
            name: subjectName,
            total: 0,
            present: 0,
          };
        }

        const sessionRecords =
          (records || []).filter(
            (record) =>
              record.session_id ===
              session.id
          );

        subjectMap[subjectId].total +=
          sessionRecords.length;

        subjectMap[subjectId].present +=
          sessionRecords.filter(
            (record) =>
              record.status === "present"
          ).length;
      });

      const subStats =
        Object.values(subjectMap).map(
          (subject) => ({
            name: subject.name,

            avg: subject.total
              ? Math.round(
                  (subject.present /
                    subject.total) *
                    100
                )
              : 0,

            total: subject.total,

            present: subject.present,
          })
        );

      setSubjectStats(subStats);

      // =====================================================
      // STEP 6: Overall statistics
      // =====================================================

      const allRecords =
        records || [];

      const totalRecords =
        allRecords.length;

      const totalPresent =
        allRecords.filter(
          (record) =>
            record.status === "present"
        ).length;

      const totalAbsent =
        totalRecords -
        totalPresent;

      const percentage =
        totalRecords > 0
          ? Math.round(
              (totalPresent /
                totalRecords) *
                100
            )
          : 0;

      setOverallStats({
        total: totalRecords,
        present: totalPresent,
        absent: totalAbsent,
        pct: percentage,
      });

      // =====================================================
      // STEP 7: Attendance trend
      // =====================================================

      const last30 =
        sessions.slice(-30);

      const trendMap = {};

      last30.forEach((session) => {
        const date =
          session.date;

        if (!trendMap[date]) {
          trendMap[date] = {
            date,
            present: 0,
            absent: 0,
          };
        }

        const sessionRecords =
          (records || []).filter(
            (record) =>
              record.session_id ===
              session.id
          );

        sessionRecords.forEach(
          (record) => {
            if (
              record.status ===
              "present"
            ) {
              trendMap[date].present++;
            } else {
              trendMap[date].absent++;
            }
          }
        );
      });

      setTrendData(
        Object.values(trendMap)
      );

      // =====================================================
      // STEP 8: Student-wise attendance
      // =====================================================

      const studentMap = {};

      (records || []).forEach(
        (record) => {
          const student =
            record.students;

          if (!student) {
            return;
          }

          if (!studentMap[student.id]) {
            studentMap[student.id] = {
              ...student,
              total: 0,
              present: 0,
            };
          }

          studentMap[
            student.id
          ].total++;

          if (
            record.status ===
            "present"
          ) {
            studentMap[
              student.id
            ].present++;
          }
        }
      );

      const studentList =
        Object.values(
          studentMap
        ).map((student) => ({
          ...student,

          pct: student.total
            ? Math.round(
                (student.present /
                  student.total) *
                  100
              )
            : 0,
        }));

      studentList.sort(
        (a, b) =>
          a.pct - b.pct
      );

      setStudentData(
        studentList
      );

      // =====================================================
      // DEBUG INFORMATION
      // =====================================================

      console.log(
        "Analytics subject stats:",
        subStats
      );

      console.log(
        "Analytics overall:",
        {
          total: totalRecords,
          present: totalPresent,
          absent: totalAbsent,
          percentage,
        }
      );

      console.log(
        "Analytics students:",
        studentList
      );

    } catch (error) {
      console.error(
        "Analytics loading error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  const displayedStudents =
    filterView === "low"
      ? studentData.filter(
          (student) =>
            student.pct < cutoff
        )
      : studentData;

  if (loading) {
    return (
      <div className="page-loading">
        Loading analytics…
      </div>
    );
  }

  return (
    <div>

      {/* =====================================================
          Overall cards
      ====================================================== */}

      <div className="cards">

        <div className="card">
          <h3>Total Records</h3>
          <h2>
            {overallStats.total}
          </h2>
        </div>

        <div className="card green">
          <h3>Total Present</h3>
          <h2>
            {overallStats.present}
          </h2>
        </div>

        <div className="card red">
          <h3>Total Absent</h3>
          <h2>
            {overallStats.absent}
          </h2>
        </div>

        <div className="card blue">
          <h3>
            Overall Percentage
          </h3>

          <h2>
            {overallStats.pct}%
          </h2>
        </div>

      </div>


      {/* =====================================================
          Subject-wise bar chart
      ====================================================== */}

      <div className="section">

        <h2>
          Subject-wise Average Attendance
        </h2>

        {subjectStats.length === 0 ? (

          <p className="empty-state">
            No data yet.
          </p>

        ) : (

          <>

            <ResponsiveContainer
              width="100%"
              height={300}
            >

              <BarChart
                data={subjectStats}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 5,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 12,
                  }}
                />

                <YAxis
                  domain={[0, 100]}
                  unit="%"
                />

                <Tooltip
                  formatter={(value) =>
                    `${value}%`
                  }
                />

                <Bar
                  dataKey="avg"
                  fill="#2563eb"
                  name="Avg Attendance %"
                  radius={[
                    4,
                    4,
                    0,
                    0,
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>


            {/* Subject summary */}

            <div
              className="report"
              style={{
                marginTop: 20,
              }}
            >

              {subjectStats.map(
                (subject) => (

                  <div
                    key={
                      subject.name
                    }
                  >

                    <h3>
                      {subject.name}
                    </h3>

                    <strong
                      style={{
                        color:
                          subject.avg <
                          cutoff
                            ? "#dc2626"
                            : "#2563eb",
                      }}
                    >
                      {subject.avg}%
                    </strong>

                    <p
                      style={{
                        fontSize: 12,
                        color: "#666",
                        marginTop: 4,
                      }}
                    >
                      {subject.present}/
                      {subject.total}{" "}
                      present
                    </p>

                  </div>

                )
              )}

            </div>

          </>

        )}

      </div>


      {/* =====================================================
          Attendance trend
      ====================================================== */}

      <div className="section">

        <h2>
          Attendance Trend (last 30 days)
        </h2>

        {trendData.length === 0 ? (

          <p className="empty-state">
            No data yet.
          </p>

        ) : (

          <ResponsiveContainer
            width="100%"
            height={280}
          >

            <LineChart
              data={trendData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 5,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 11,
                }}
              />

              <YAxis />

              <Tooltip />

              <Legend />

              <Line
                type="monotone"
                dataKey="present"
                stroke="#22c55e"
                name="Present"
                strokeWidth={2}
                dot={false}
              />

              <Line
                type="monotone"
                dataKey="absent"
                stroke="#ef4444"
                name="Absent"
                strokeWidth={2}
                dot={false}
              />

            </LineChart>

          </ResponsiveContainer>

        )}

      </div>


      {/* =====================================================
          Student-wise attendance
      ====================================================== */}

      <div className="section">

        <div className="section-header">

          <h2>
            Student Attendance
          </h2>

          <div
            style={{
              display: "flex",
              gap: 8,
            }}
          >

            <button
              className={
                filterView === "all"
                  ? "btn-primary btn-sm"
                  : "btn-secondary btn-sm"
              }
              onClick={() =>
                setFilterView("all")
              }
            >
              All Students
            </button>

            <button
              className={
                filterView === "low"
                  ? "btn-primary btn-sm"
                  : "btn-secondary btn-sm"
              }
              onClick={() =>
                setFilterView("low")
              }
            >
              ⚠️ Below {cutoff}%
            </button>

          </div>

        </div>


        {displayedStudents.length ===
        0 ? (

          <p className="empty-state">

            {filterView === "low"
              ? `No students below ${cutoff}%.`
              : "No student data yet."}

          </p>

        ) : (

          <div className="table-wrap">

            <table>

              <thead>

                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Present</th>
                  <th>Total</th>
                  <th>%</th>
                  <th>Status</th>
                </tr>

              </thead>

              <tbody>

                {displayedStudents.map(
                  (student) => (

                    <tr
                      key={
                        student.id
                      }
                    >

                      <td>
                        {
                          student.roll_number
                        }
                      </td>

                      <td>
                        {student.name}
                      </td>

                      <td>
                        {
                          student.present
                        }
                      </td>

                      <td>
                        {
                          student.total
                        }
                      </td>

                      <td
                        className={
                          student.pct <
                          cutoff
                            ? "absent"
                            : "present"
                        }
                      >
                        {student.pct}%
                      </td>

                      <td>

                        {student.pct <
                        cutoff ? (

                          <span className="badge-inactive">
                            ⚠️ Low
                          </span>

                        ) : (

                          <span className="badge-active">
                            ✓ OK
                          </span>

                        )}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}