import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IS_MOCK } from "../supabaseClient";

export default function Login() {
  const { login, role, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Whenever role becomes known (after login resolves through AuthContext),
  // redirect to the correct dashboard.
  useEffect(() => {
    if (!loading && role === "admin")   navigate("/admin",   { replace: true });
    if (!loading && role === "teacher") navigate("/teacher", { replace: true });
  }, [role, loading, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // AuthContext's onAuthStateChange fires → loadProfile → sets role →
      // the useEffect above handles redirect automatically.
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials.");
      setSubmitting(false);
    }
  }

  function fillAndSubmit(em, pw) {
    setEmail(em);
    setPassword(pw);
    setError("");
    // Use a small timeout so state updates before submit
    setTimeout(() => {
      login(em, pw).catch(err => setError(err.message));
    }, 50);
  }

  // If already authenticated, don't render login form (avoids flash)
  if (!loading && role) return null;

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🎓</div>
        <h1 className="login-title">College Attendance</h1>
        <p className="login-sub">Sign in to your account</p>

        {/* Demo credentials banner */}
        {IS_MOCK && (
          <div className="demo-banner">
            <p>🧪 <strong>Demo Mode</strong> — click a button to sign in instantly</p>
            <div className="demo-btns">
              <button
                type="button"
                className="demo-btn demo-btn-admin"
                onClick={() => fillAndSubmit("admin@demo.com", "admin123")}
              >
                👑 Admin
              </button>
              <button
                type="button"
                className="demo-btn demo-btn-teacher"
                onClick={() => fillAndSubmit("teacher@demo.com", "teacher123")}
              >
                👩‍🏫 Teacher – Poonam
              </button>
              <button
                type="button"
                className="demo-btn demo-btn-teacher"
                onClick={() => fillAndSubmit("swapnali@demo.com", "teacher123")}
              >
                👩‍🏫 Teacher – Swapnali
              </button>
            </div>
          </div>
        )}

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@college.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="start-btn login-submit"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="login-hint">
          {IS_MOCK
            ? "Demo mode — no real database needed"
            : "Contact your administrator if you don't have an account."}
        </p>
      </div>
    </div>
  );
}
