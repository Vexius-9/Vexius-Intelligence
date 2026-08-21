"use client";

import React, { useState, useEffect, useRef } from "react";
import { AICopilot } from "@/components/ai/AICopilot";
import Link from "next/link";
import { ArrowLeft, Loader2, Check } from "lucide-react";
import { DocumentEditor } from "@onlyoffice/document-editor-react";

export default function DocumentPage({ params }: { params: Promise<{ workspaceId: string; docId: string }> }) {
  const unwrappedParams = React.use(params);
  const [docMetadata, setDocMetadata] = useState<any>(null);
  const [editorConfig, setEditorConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Renaming state
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    const initDocument = async () => {
      try {
        const token = localStorage.getItem("vexius_token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        // 1. Fetch metadata
        const metaRes = await fetch(`${apiUrl}/documents/${unwrappedParams.docId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (metaRes.ok) {
          const data = await metaRes.json();
          setDocMetadata(data);
          setEditName(data.name);
        }

        // 2. Fetch editor config
        const confRes = await fetch(`${apiUrl}/documents/${unwrappedParams.docId}/editor-config`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (confRes.ok) {
          const configData = await confRes.json();
          setEditorConfig(configData);
        }
      } catch (err) {
        console.error("Failed to load document", err);
      } finally {
        setLoading(false);
      }
    };
    initDocument();
  }, [unwrappedParams.docId]);

  const handleRenameSubmit = async () => {
    setIsRenaming(false);
    if (!editName.trim() || editName === docMetadata?.name) {
      setEditName(docMetadata?.name || "Untitled Document");
      return;
    }

    try {
      const token = localStorage.getItem("vexius_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/documents/${unwrappedParams.docId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: editName })
      });
      if (res.ok) {
        setDocMetadata({ ...docMetadata, name: editName });
      } else {
        throw new Error("Failed to rename");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to rename document");
      setEditName(docMetadata?.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setIsRenaming(false);
      setEditName(docMetadata?.name);
    }
  };

  const [editorConnector, setEditorConnector] = useState<any>(null);

  const onDocumentReady = () => {
    console.log("ONLYOFFICE Editor is ready");
    if ((window as any).DocEditor && (window as any).DocEditor.instances["docxEditor"]) {
      const connector = (window as any).DocEditor.instances["docxEditor"].createConnector();
      setEditorConnector(connector);
    }
  };

  const getCurrentSelection = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!editorConnector) {
        resolve("");
        return;
      }
      editorConnector.executeMethod("GetSelectedText", [], (text: string) => {
        resolve(text || "");
      });
    });
  };

  const onApplyAction = (newText: string) => {
    if (!editorConnector) return;
    editorConnector.executeMethod("SetTrackRevisions", [true]);
    editorConnector.executeMethod("PasteText", [newText]);
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
        
        {/* Breadcrumb / Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isRenaming ? (
            <input 
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleKeyDown}
              style={{
                background: "transparent",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "0.95rem",
                fontWeight: 500,
                outline: "none",
                width: "300px"
              }}
            />
          ) : (
            <span 
              onClick={() => setIsRenaming(true)}
              style={{ 
                fontWeight: 500, 
                fontSize: "0.95rem", 
                cursor: "pointer",
                padding: "4px 8px",
                marginLeft: "-8px", // visual alignment
                borderRadius: "4px",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-secondary)"}
              onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
              title="Click to rename"
            >
              {docMetadata?.name || "Untitled Document"}
            </span>
          )}
        </div>
        
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
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
        <div style={{ flex: 1, display: "flex", justifyContent: "center", overflowY: "hidden", background: "#f3f4f6" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
              <Loader2 className="animate-spin" />
            </div>
          ) : editorConfig && process.env.NEXT_PUBLIC_ONLYOFFICE_URL ? (
            <DocumentEditor
              id="docxEditor"
              documentServerUrl={process.env.NEXT_PUBLIC_ONLYOFFICE_URL}
              config={editorConfig}
              events_onDocumentReady={onDocumentReady}
            />
          ) : (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
              {!process.env.NEXT_PUBLIC_ONLYOFFICE_URL 
                ? "Missing NEXT_PUBLIC_ONLYOFFICE_URL in .env" 
                : "Failed to load document editor"}
            </div>
          )}
        </div>

        {/* AI Copilot Sidebar */}
        <AICopilot 
          documentContext={{
            documentTitle: docMetadata?.name || "Untitled Document",
            workspaceId: unwrappedParams.workspaceId,
            documentId: unwrappedParams.docId,
            documentType: docMetadata?.type
          }}
          getCurrentSelection={getCurrentSelection}
          onApplyAction={onApplyAction}
        />

      </div>
    </div>
  );
}
