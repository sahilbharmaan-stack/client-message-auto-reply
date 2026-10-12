// ============================================================
// FILE: Sidebar.jsx
// PURPOSE:
// Premium amber sidebar navigation with active route highlights,
// grouped items, live chat portal launcher, and admin user badge.
// ============================================================

import { NavLink } from "react-router-dom";
import "./sidebar.css";

const NAV_ITEMS = [
  {
    group: "Main",
    items: [
      {
        to: "/",
        label: "Dashboard",
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        ),
      },
      {
        to: "/conversations",
        label: "Conversations",
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        ),
      },
    ],
  },
  {
    group: "Automation Engine",
    items: [
      {
        to: "/auto-reply-rules",
        label: "Auto-Reply Rules",
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
        ),
      },
      {
        to: "/auto-replies",
        label: "Quick Snippets",
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        ),
      },
    ],
  },
  {
    group: "Insights & Controls",
    items: [
      {
        to: "/analytics",
        label: "Analytics",
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6"  y1="20" x2="6"  y2="14"/>
          </svg>
        ),
      },
      {
        to: "/settings",
        label: "Settings",
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        ),
      },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Header / Logo */}
      <div className="sidebar-header">
        <div className="logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div>
          <h1 className="logo-text">AutoReply</h1>
          <span style={{ fontSize: "10.5px", color: "var(--text-muted)", fontWeight: 600, display: "block" }}>Enterprise AI Suite</span>
        </div>
      </div>

      {/* Live Customer Simulator Launcher Banner */}
      <div style={{ padding: "0 16px 14px" }}>
        <a
          href="/customer"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "9px 12px",
            background: "linear-gradient(135deg, rgba(217,119,6,0.12), rgba(79,70,229,0.12))",
            border: "1px solid rgba(217,119,6,0.3)",
            borderRadius: "10px",
            textDecoration: "none",
            color: "var(--text-primary)",
            fontSize: "12px",
            fontWeight: "700",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(217,119,6,0.3)"}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)", display: "inline-block", boxShadow: "0 0 8px var(--success)" }}></span>
            Customer Chat
          </span>
          <span style={{
            fontSize: "10px",
            padding: "2px 6px",
            background: "var(--primary)",
            color: "#fff",
            borderRadius: "6px",
            fontWeight: "800"
          }}>
            TEST ↗
          </span>
        </a>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((group) => (
          <div key={group.group} style={{ marginBottom: 18 }}>
            <p className="nav-group-label">{group.group}</p>
            <ul className="nav-list">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      "nav-link" + (isActive ? " active" : "")
                    }
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer user card */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">SA</div>
          <div className="user-info">
            <span className="user-name">Sahil A.</span>
            <span className="user-role">Super Admin</span>
          </div>
          <div className="online-dot" title="Connected" />
        </div>
      </div>
    </aside>
  );
}
