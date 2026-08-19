"use client";

import React, { useState } from "react";
import { DocumentEditor } from "@/components/editor/DocumentEditor";
import { AICopilot } from "@/components/ai/AICopilot";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DocumentPage({ params }: { params: { workspaceId: string; docId: string } }) {
  const [docContent, setDocContent] = useState("<p>This is a new Vexius document.</p>");
  
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "calc(100vh - 64px)", // 64px is the height of the Dashboard Header
      margin: "-32px", // Negate the padding from the dashboard layout to make editor full width
      background: "var(--bg-primary)",
    }}>
      {/* Document Sub-header */}
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        gap: "16px"
      }}>
        <Link href="/dashboard" style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", transition: "color 0.2s" }}
          onMouseOver={(e) => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseOut={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
        >
          <ArrowLeft size={18} />
        </Link>
        <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Workspace {params.workspaceId}</span>
        <span style={{ color: "var(--text-secondary)" }}>/</span>
        <span style={{ fontWeight: 500, fontSize: "0.95rem" }}>Untitled Document</span>
        
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Saved locally</span>
          <button style={{
            background: "#fff",
            color: "#000",
            border: "none",
            padding: "6px 16px",
            borderRadius: "6px",
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: "pointer"
          }}>
            Share
          </button>
        </div>
      </div>

      {/* Editor & Copilot Container */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Main Editor Canvas */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", overflowY: "auto" }}>
          <div style={{
            width: "100%",
            maxWidth: "800px",
            padding: "48px 32px"
          }}>
            <DocumentEditor 
              initialContent={docContent}
              onUpdate={(content) => setDocContent(content)}
            />
          </div>
        </div>

        {/* AI Copilot Sidebar */}
        <AICopilot />

      </div>
    </div>
  );
}
