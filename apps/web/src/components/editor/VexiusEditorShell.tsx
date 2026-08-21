import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Bot } from 'lucide-react';
import { AICopilot } from '@/components/ai/AICopilot';

interface VexiusEditorShellProps {
  documentId: string;
  workspaceId: string;
  documentType: string;
  documentName: string;
  onRename: (newName: string) => Promise<void>;
  loading: boolean;
  children: React.ReactNode;
  getCurrentSelection: () => Promise<string>;
  onApplyAction: (newText: string) => void;
  onAiStart?: () => void;
  onAiEnd?: () => void;
}

export function VexiusEditorShell({
  documentId,
  workspaceId,
  documentType,
  documentName,
  onRename,
  loading,
  children,
  getCurrentSelection,
  onApplyAction,
  onAiStart,
  onAiEnd
}: VexiusEditorShellProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState(documentName);
  const [isCopilotVisible, setIsCopilotVisible] = useState(true);

  // Sync state when props change
  React.useEffect(() => {
    setEditName(documentName);
  }, [documentName]);

  const handleRenameSubmit = async () => {
    setIsRenaming(false);
    if (!editName.trim() || editName === documentName) {
      setEditName(documentName || "Untitled Document");
      return;
    }
    await onRename(editName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setIsRenaming(false);
      setEditName(documentName);
    }
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
        <Link href={`/workspace/${workspaceId}`} style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", transition: "color 0.2s" }}
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
              {documentName || "Untitled Document"}
            </span>
          )}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
          <button 
            onClick={() => setIsCopilotVisible(!isCopilotVisible)}
            style={{
              background: isCopilotVisible ? "rgba(168, 85, 247, 0.1)" : "transparent",
              color: isCopilotVisible ? "#a855f7" : "var(--text-secondary)",
              border: `1px solid ${isCopilotVisible ? "rgba(168, 85, 247, 0.2)" : "var(--border-color)"}`,
              padding: "6px 12px",
              borderRadius: "6px",
              fontWeight: 500,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s"
            }}
          >
            <Bot size={16} />
            {isCopilotVisible ? "Hide Copilot" : "Show Copilot"}
          </button>
          
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
          ) : (
            children
          )}
        </div>

        {/* AI Copilot Sidebar */}
        <div style={{ display: isCopilotVisible ? 'flex' : 'none', flexShrink: 0 }}>
          <AICopilot 
            documentContext={{
              documentTitle: documentName || "Untitled Document",
              workspaceId: workspaceId,
              documentId: documentId,
              documentType: documentType
            }}
            getCurrentSelection={getCurrentSelection}
            onApplyAction={onApplyAction}
            onAiStart={onAiStart}
            onAiEnd={onAiEnd}
          />
        </div>

      </div>
    </div>
  );
}
