import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wraps a route so only authenticated users with the required role can access it.
 * allowedRoles: array of strings, e.g. ['admin'] or ['teacher'] or ['admin','teacher']
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // wrong role — redirect to their own home
    if (role === "admin")   return <Navigate to="/admin"   replace />;
    if (role === "teacher") return <Navigate to="/teacher" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
