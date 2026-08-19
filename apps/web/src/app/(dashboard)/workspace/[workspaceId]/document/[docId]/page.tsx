"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { DocumentEditor } from "@/components/editor/DocumentEditor";
import { AICopilot } from "@/components/ai/AICopilot";
import Link from "next/link";
import { ArrowLeft, Loader2, Check } from "lucide-react";

export default function DocumentPage({ params }: { params: { workspaceId: string; docId: string } }) {
  const [docContent, setDocContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchDocContent = async () => {
      try {
        const token = localStorage.getItem("vexius_token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        // Fetch the signed download URL from backend
        const res = await fetch(`${apiUrl}/documents/${params.docId}/download`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
          const { url } = await res.json();
          // Fetch the actual HTML content from Supabase Storage
          const contentRes = await fetch(url);
          if (contentRes.ok) {
            const html = await contentRes.text();
            setDocContent(html);
          }
        }
      } catch (err) {
        console.error("Failed to load document content", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocContent();
  }, [params.docId]);

  const saveToBackend = useCallback(async (content: string) => {
    setSaveStatus("saving");
    try {
      const token = localStorage.getItem("vexius_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      const res = await fetch(`${apiUrl}/documents/${params.docId}/content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      if (!res.ok) throw new Error("Failed to save");
      setSaveStatus("saved");
      
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    }
  }, [params.docId]);

  const handleUpdate = (content: string) => {
    setDocContent(content);
    setSaveStatus("saving");
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveToBackend(content);
    }, 1000);
  };
  
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
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
            {saveStatus === "saving" && <Loader2 size={12} className="animate-spin" />}
            {saveStatus === "saved" && <Check size={12} className="text-green-500" />}
            {saveStatus === "error" && <span style={{color: "var(--color-error)"}}>Error saving</span>}
            {saveStatus === "idle" && "Saved locally"}
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "saved" && "Saved to cloud"}
          </span>
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
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "100px", color: "var(--text-secondary)" }}>
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              <DocumentEditor 
                initialContent={docContent}
                onUpdate={handleUpdate}
              />
            )}
          </div>
        </div>

        {/* AI Copilot Sidebar */}
        <AICopilot 
          documentContext={{
            documentTitle: "Untitled Document",
            documentContent: docContent
          }}
        />

      </div>
    </div>
  );
}
