import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
const { teacher, role, logout: authLogout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Selected teacher assignment
  const match = location.pathname.match(
    /^\/teacher\/class\/([^/]+)/
  );

  const assignmentId = match?.[1];

  const teacherBase = assignmentId
    ? `/teacher/class/${assignmentId}`
    : "/teacher";

const teacherLinks = [
  {
    to: teacherBase,
    label: "🏠 Dashboard",
    end: true,
  },
  {
    to: `${teacherBase}/attendance`,
    label: "📷 Face Attendance",
  },
  {
    to: `${teacherBase}/students`,
    label: "👨‍🎓 Students",
  },
  {
    to: `${teacherBase}/history`,
    label: "📋 Attendance History",
  },
  {
    to: `${teacherBase}/analytics`,
    label: "📊 Analytics",
  },
];

  const adminLinks = [
    {
      to: "/admin",
      label: "🏠 Dashboard",
      end: true,
    },
    {
      to: "/admin/departments",
      label: "🏢 Departments",
    },
    {
      to: "/admin/classes",
      label: "🎓 Classes",
    },
    {
      to: "/admin/subjects",
      label: "📚 Subjects",
    },
    {
      to: "/admin/teachers",
      label: "👨‍🏫 Teachers",
    },
    {
      to: "/admin/students",
      label: "👨‍🎓 Students",
    },
    {
      to: "/admin/timetable",
      label: "🗓️ Timetable",
    },
   // {
     // to: "/admin/settings",
     // label: "⚙️ Settings",
    //},
  ];

  const links = role === "admin" ? adminLinks : teacherLinks;

  async function logout() {
  await authLogout();
  navigate("/login", { replace: true });
}

  return (
    <aside className="sidebar">

      {/* Logo */}
      <div className="sidebar-logo">
        🎓 College
        <br />
        Attendance
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="sidebar-bottom">

        <div className="sidebar-user">
          <strong>
            {role === "admin"
              ? "Admin"
              : teacher?.name || "Teacher"}
          </strong>

          <span>
            {role === "admin" ? "ADMIN" : "TEACHER"}
          </span>
        </div>

        <button
          className="sidebar-logout"
          onClick={logout}
        >
          🚪 Logout
        </button>

      </div>

    </aside>
  );
}