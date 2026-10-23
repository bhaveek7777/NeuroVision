import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import DepartmentManagement from "./pages/admin/DepartmentManagement";
import ClassManagement from "./pages/admin/ClassManagement";
import SubjectManagement from "./pages/admin/SubjectManagement";
import TeacherManagement from "./pages/admin/TeacherManagement";
import StudentManagement from "./pages/admin/StudentManagement";
import TimetableManagement from "./pages/admin/TimetableManagement";
//import AttendanceSettings from "./pages/admin/AttendanceSettings";

// Teacher
import TeacherSelection from "./pages/teacher/TeacherSelection";
import TeacherClassDashboard from "./pages/teacher/TeacherClassDashboard";
import MarkAttendance from "./pages/teacher/MarkAttendance";
import AttendanceHistory from "./pages/teacher/AttendanceHistory";
import Analytics from "./pages/teacher/Analytics";
import TeacherStudents from "./pages/teacher/TeacherStudents";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ================= LOGIN ================= */}

          <Route
            path="/login"
            element={<Login />}
          />


          {/* =================================================
              TEACHER SELECTION PAGE
              NO SIDEBAR
              
              Example:
              /teacher
          ================================================= */}

          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherSelection />
              </ProtectedRoute>
            }
          />


          {/* =================================================
              SELECTED CLASS / SUBJECT APPLICATION
              SIDEBAR IS SHOWN HERE
              
              Example:
              /teacher/class/1
          ================================================= */}

          <Route
            path="/teacher/class/:assignmentId"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <Layout />
              </ProtectedRoute>
            }
          >

            {/* Dashboard */}

            <Route
              index
              element={<TeacherClassDashboard />}
            />


            {/* Face Attendance */}

            <Route
              path="attendance"
              element={<MarkAttendance />}
            />


            {/* Attendance History */}

            <Route
              path="history"
              element={<AttendanceHistory />}
            />


            {/* Analytics */}

            <Route
              path="analytics"
              element={<Analytics />}
            />

            <Route path="students" element={<TeacherStudents />} />

          </Route>


          {/* =================================================
              ADMIN
          ================================================= */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Layout />
              </ProtectedRoute>
            }
          >

            <Route
              index
              element={<AdminDashboard />}
            />

            <Route
              path="departments"
              element={<DepartmentManagement />}
            />

            <Route
              path="classes"
              element={<ClassManagement />}
            />

            <Route
              path="subjects"
              element={<SubjectManagement />}
            />

            <Route
              path="teachers"
              element={<TeacherManagement />}
            />

            <Route
              path="students"
              element={<StudentManagement />}
            />

            <Route
              path="timetable"
              element={<TimetableManagement />}
            />

           {/* <Route path="settings" element={<AttendanceSettings />} />  */}

          </Route>


          {/* ================= DEFAULT ================= */}

          <Route
            path="/"
            element={<Navigate to="/login" replace />}
          />

          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;