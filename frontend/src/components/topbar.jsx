// ============================================================
// FILE: Topbar.jsx
// PURPOSE:
// Top navigation bar with dark mode toggle, quick demo data loader,
// export CSV action, notification drawer, and customer chat link.
// ============================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { seedDemoData, exportConversations, resetAndReseedData } from "../services/api";
import "./topbar.css";

export default function Topbar() {
  const { isDark, toggleTheme } = useTheme();
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  async function handleSeed() {
    setSeeding(true);
    setSeedMsg("");
    try {
      const result = await seedDemoData();
      if (result.seeded) {
        setSeedMsg("✅ Loaded 6 demo conversations!");
        setTimeout(() => window.location.reload(), 700);
      } else {
        setSeedMsg("ℹ️ Conversations already exist");
        setTimeout(() => setSeedMsg(""), 3000);
      }
    } catch (error) {
      setSeedMsg(error.message || "❌ Failed to seed");
      setTimeout(() => setSeedMsg(""), 3000);
    } finally {
      setSeeding(false);
    }
  }

  async function handleResetSeed() {
    if (!window.confirm("Reset all conversations and load fresh demo data?")) return;
    setSeeding(true);
    try {
      await resetAndReseedData();
      setSeedMsg("✅ Reset & loaded fresh demo data!");
      setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      setSeedMsg(error.message || "❌ Reset failed");
      setTimeout(() => setSeedMsg(""), 3000);
    } finally {
      setSeeding(false);
    }
  }

  function handleSearchSubmit(e) {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/conversations?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  const notifications = [
    { id: 1, text: "Elena Rostova requested a refund", time: "2 min ago", dot: "pending" },
    { id: 2, text: "David Chen inquiry auto-replied", time: "5 min ago", dot: "info" },
    { id: 3, text: "Auto-reply rule 'pricing' triggered", time: "18 min ago", dot: "info" },
  ];

  return (
    <header className="topbar">
      {/* Brand / breadcrumb */}
      <div className="topbar-brand">
        <span className="topbar-title">AutoReply Console</span>
        <span className="topbar-subtitle">Customer Service Intelligence Hub</span>
      </div>

      {/* Global Search */}
      <div className="topbar-search">
        <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search conversations, rules… (Press Enter)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchSubmit}
        />
      </div>

      {/* Actions */}
      <div className="topbar-actions">
        {/* Seed message or action buttons */}
        {seedMsg ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)" }}>{seedMsg}</span>
        ) : (
          <div style={{ display: "flex", gap: "6px" }}>
            <button className="seed-btn" onClick={handleSeed} disabled={seeding} title="Load realistic sample conversations">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a9 9 0 0 1 9 9c0 4.97-4.03 9-9 9S3 15.97 3 11a9 9 0 0 1 9-9Z"/>
                <path d="m15 9-3 3-3-3"/>
              </svg>
              {seeding ? "Loading…" : "Load Demo"}
            </button>
            <button
              className="seed-btn"
              style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              onClick={handleResetSeed}
              disabled={seeding}
              title="Reset conversations to clean sample state"
            >
              Reset
            </button>
          </div>
        )}

        {/* Customer Portal Link */}
        <a
          href="/customer"
          target="_blank"
          rel="noopener noreferrer"
          className="topbar-icon-btn"
          title="Open Live Customer Chat"
          style={{ textDecoration: "none" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </a>

        {/* Export button */}
        <button
          className="topbar-icon-btn"
          title="Export all conversations as CSV"
          onClick={exportConversations}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>

        {/* Dark mode toggle */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            className="topbar-icon-btn"
            title="Notifications"
            onClick={() => setNotifOpen(o => !o)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="badge">3</span>
          </button>

          {notifOpen && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 10px)",
              width: 320, background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", zIndex: 999, overflow: "hidden"
            }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: 13, color: "var(--text-primary)" }}>Recent Activity</strong>
                <span style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700, cursor: "pointer" }} onClick={() => setNotifOpen(false)}>Close</span>
              </div>
              {notifications.map(n => (
                <div key={n.id} style={{
                  padding: "12px 16px", borderBottom: "1px solid var(--border)",
                  display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer",
                  transition: "background 0.15s"
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-soft)"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}
                  onClick={() => { setNotifOpen(false); navigate("/conversations"); }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                    background: n.dot === "pending" ? "var(--warning)" : "var(--info)"
                  }} />
                  <div>
                    <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>{n.text}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{n.time}</div>
                  </div>
                </div>
              ))}
              <div style={{ padding: "10px 16px", textAlign: "center", background: "var(--surface-soft)" }}>
                <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, cursor: "pointer" }} onClick={() => { setNotifOpen(false); navigate("/conversations"); }}>
                  View All Conversations →
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
