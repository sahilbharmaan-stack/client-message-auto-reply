import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { getStoredToken, loginAdmin } from "../../services/api";
import "./AdminLogin.css";

export default function AdminLogin() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (getStoredToken()) {
    return <Navigate to={location.state?.from?.pathname || "/"} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await loginAdmin(email, password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (loginError) {
      setError(loginError.message || "Could not log in. Check your credentials.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="admin-login-mark" aria-hidden="true">AR</div>
        <p className="admin-login-eyebrow">ADMIN CONSOLE</p>
        <h1>Welcome back</h1>
        <p className="admin-login-description">Sign in to manage conversations and auto-reply rules.</p>

        {error && <p className="admin-login-error" role="alert">{error}</p>}

        <label htmlFor="admin-email">Email</label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
