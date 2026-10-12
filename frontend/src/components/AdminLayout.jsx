// ============================================================
// FILE: AdminLayout.jsx
// PURPOSE:
// Main layout container for the Administrator application.
// Wraps sidebar, topbar, and child page routes.
// ============================================================

import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar";
import Topbar from "./topbar";

export default function AdminLayout() {
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
