import React from "react";

export default function DashboardPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "2rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: "8px" }}>
          Your Workspaces
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Select a workspace to start collaborating or create a new one.
        </p>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
        gap: "24px" 
      }}>
        {/* Mock Workspace Card 1 */}
        <div style={{
          padding: "24px",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          transition: "border-color 0.2s"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div style={{ width: "40px", height: "40px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "100px" }}>
              Owner
            </span>
          </div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 500, marginBottom: "8px" }}>Engineering Team</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>3 active documents • 5 members</p>
        </div>

        {/* Mock Workspace Card 2 */}
        <div style={{
          padding: "24px",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          transition: "border-color 0.2s"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div style={{ width: "40px", height: "40px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "100px" }}>
              Guest
            </span>
          </div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 500, marginBottom: "8px" }}>Marketing Copy</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>12 active documents • 2 members</p>
        </div>

        {/* Create New Workspace */}
        <div style={{
          padding: "24px",
          background: "transparent",
          border: "1px dashed var(--border-color)",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--text-secondary)",
          transition: "all 0.2s"
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.borderColor = "var(--text-primary)";
          e.currentTarget.style.color = "var(--text-primary)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.borderColor = "var(--border-color)";
          e.currentTarget.style.color = "var(--text-secondary)";
        }}>
          <span style={{ fontSize: "2rem", marginBottom: "8px", fontWeight: 300 }}>+</span>
          <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>New Workspace</span>
        </div>
      </div>
    </div>
  );
}
