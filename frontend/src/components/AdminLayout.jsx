// ============================================================
// FILE: AdminLayout.jsx
// PURPOSE:
// Main layout container for the Administrator application.
// Wraps sidebar, topbar, and child page routes.
// ============================================================

import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import { getStoredToken } from "../services/api";

export default function AdminLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(getStoredToken())
  );

  useEffect(() => {
    function handleAuthExpired() {
      setIsAuthenticated(false);
    }

    window.addEventListener("admin-auth-expired", handleAuthExpired);
    return () => window.removeEventListener("admin-auth-expired", handleAuthExpired);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Topbar />
        <main className="page">
          <div className="page-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
