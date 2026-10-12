// ============================================================
// FILE: Settings.jsx
// PURPOSE: App settings — theme, notifications, about
// ============================================================

import { useTheme } from "../context/ThemeContext";

export default function Settings() {
  const { isDark, toggleTheme } = useTheme();

  const sections = [
    {
      title: "Appearance",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ),
      controls: [
        {
          id: "dark-mode",
          label: "Dark Mode",
          description: "Switch between light and dark interface",
          type: "toggle",
          value: isDark,
          onChange: toggleTheme,
        },
        {
          id: "compact",
          label: "Compact View",
          description: "Use smaller spacing for dense data views",
          type: "toggle",
          value: false,
          onChange: () => {},
        },
      ],
    },
    {
      title: "Notifications",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ),
      controls: [
        {
          id: "new-msg",
          label: "New Message Alerts",
          description: "Get notified when a new customer message arrives",
          type: "toggle",
          value: true,
          onChange: () => {},
        },
        {
          id: "pending",
          label: "Pending Reply Reminders",
          description: "Remind when a conversation is pending for 1+ hour",
          type: "toggle",
          value: true,
          onChange: () => {},
        },
        {
          id: "summary",
          label: "Daily Summary Email",
          description: "Receive a daily digest of conversation stats",
          type: "toggle",
          value: false,
          onChange: () => {},
        },
      ],
    },
    {
      title: "Auto-Reply",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      ),
      controls: [
        {
          id: "auto-enabled",
          label: "Enable Auto-Reply",
          description: "Automatically respond to matching keywords",
          type: "toggle",
          value: true,
          onChange: () => {},
        },
        {
          id: "case-sensitive",
          label: "Case-Sensitive Matching",
          description: "Match keywords exactly with original casing",
          type: "toggle",
          value: false,
          onChange: () => {},
        },
        {
          id: "delay",
          label: "Reply Delay",
          description: "Add a small delay before sending auto-replies",
          type: "select",
          value: "0",
          options: [
            { value: "0",  label: "Instant (0 sec)" },
            { value: "3",  label: "3 seconds" },
            { value: "5",  label: "5 seconds" },
            { value: "10", label: "10 seconds" },
          ],
          onChange: () => {},
        },
      ],
    },
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Configuration</p>
          <h2>Settings</h2>
          <p>Manage your account, appearance, and automation preferences</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>
        {sections.map(section => (
          <div key={section.title} className="dashboard-panel">
            <div className="panel-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ color: "var(--primary)" }}>{section.icon}</div>
                <div>
                  <h3>{section.title}</h3>
                </div>
              </div>
            </div>

            <div style={{ padding: "8px 0" }}>
              {section.controls.map(ctrl => (
                <div key={ctrl.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 22px", borderBottom: "1px solid var(--border)"
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{ctrl.label}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{ctrl.description}</div>
                  </div>

                  {ctrl.type === "toggle" && (
                    <Toggle value={ctrl.value} onChange={ctrl.onChange} id={ctrl.id} />
                  )}

                  {ctrl.type === "select" && (
                    <select
                      defaultValue={ctrl.value}
                      style={{
                        border: "1.5px solid var(--border)", borderRadius: 9,
                        padding: "7px 12px", fontSize: 13, fontWeight: 600,
                        color: "var(--text-primary)", background: "var(--surface)",
                        outline: "none", cursor: "pointer"
                      }}
                    >
                      {ctrl.options.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* About */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h3>About</h3>
              <p>System information</p>
            </div>
          </div>
          <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["Application", "AutoReply Dashboard"],
              ["Version", "v2.0.0"],
              ["Backend", "FastAPI + SQLite"],
              ["Frontend", "React 18 + Vite"],
              ["Author", "Sahil"],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{label}</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ---- Toggle Switch Component ----
function Toggle({ value, onChange, id }) {
  return (
    <label
      htmlFor={id}
      style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0 }}
    >
      <div
        onClick={onChange}
        style={{
          width: 46, height: 26, borderRadius: 13,
          background: value ? "var(--primary)" : "var(--border)",
          position: "relative",
          transition: "background 0.25s ease",
          cursor: "pointer",
          boxShadow: value ? "0 2px 8px rgba(217,119,6,0.35)" : "none",
        }}
      >
        <div style={{
          width: 20, height: 20,
          background: "white",
          borderRadius: "50%",
          position: "absolute",
          top: 3,
          left: value ? 22 : 3,
          transition: "left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: value ? "var(--primary)" : "var(--text-muted)" }}>
        {value ? "ON" : "OFF"}
      </span>
    </label>
  );
}
