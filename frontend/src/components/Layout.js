import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const location = useLocation();
  const { role, teacher } = useAuth();

  // Hide sidebar ONLY on the teacher profile-selection page
  const isTeacherSelection =
    location.pathname === "/teacher";

  // Top-right user text
  const topbarUser =
    role === "admin"
      ? "Admin (admin)"
      : `${teacher?.name || "Teacher"} (teacher)`;

  return (
    <div className="app-layout">

      {/* Sidebar appears after selecting a class */}
      {!isTeacherSelection && <Sidebar />}

      <main
        className={
          isTeacherSelection
            ? "main-content no-sidebar"
            : "main-content"
        }
      >
        <header className="topbar">
          <h1>
            {isTeacherSelection
              ? "Dashboard"
              : getPageTitle(location.pathname)}
          </h1>

          <div className="topbar-user">
            {topbarUser}
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>

    </div>
  );
}


function getPageTitle(pathname) {

  if (pathname === "/teacher/class") {
    return "Dashboard";
  }

  if (pathname.includes("/teacher/class/")) {
    return "Dashboard";
  }

  if (
    pathname === "/teacher/attendance" ||
    pathname === "/teacher/mark"
  ) {
    return "Face Attendance";
  }

  if (pathname === "/teacher/history") {
    return "Attendance History";
  }

  if (pathname === "/teacher/analytics") {
    return "Analytics";
  }

  if (pathname === "/teacher") {
    return "Dashboard";
  }

  return "Dashboard";
}