import React, { useState, useRef, useEffect } from "react";
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ArrowLeft, Loader2, Bot, ChevronRight } from 'lucide-react';
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
  getFullText?: () => Promise<string>;
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
  getFullText,
  onApplyAction,
  onAiStart,
  onAiEnd
}: VexiusEditorShellProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState(documentName);
  const [isCopilotVisible, setIsCopilotVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync state when props change
  React.useEffect(() => {
    setEditName(documentName);
  }, [documentName]);

  React.useEffect(() => {
    const handleToggleAI = () => setIsCopilotVisible(prev => !prev);
    const handleFullscreen = (e: any) => setIsFullscreen(e.detail);
    
    window.addEventListener('vexius:toggle-ai', handleToggleAI);
    window.addEventListener('vexius:fullscreen', handleFullscreen);
    
    return () => {
      window.removeEventListener('vexius:toggle-ai', handleToggleAI);
      window.removeEventListener('vexius:fullscreen', handleFullscreen);
    };
  }, []);

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
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('breadcrumb-portal-target'));
  }, []);

  const breadcrumbPortal = portalTarget && !isFullscreen ? createPortal(
    <>
      <ChevronRight size={14} />
      <div style={{ display: "flex", alignItems: "center" }}>
        {isRenaming ? (
          <input 
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleKeyDown}
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "0.85rem",
              fontWeight: 500,
              outline: "none",
              width: "150px"
            }}
          />
        ) : (
          <span 
            onClick={() => setIsRenaming(true)}
            style={{ 
              fontWeight: 500, 
              fontSize: "0.85rem", 
              cursor: "pointer",
              padding: "2px 8px",
              marginLeft: "-8px",
              borderRadius: "4px",
              transition: "background 0.2s",
              color: "#fff"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-secondary)"}
            onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
            title="Click to rename"
          >
            {documentName || "Untitled Document"}
          </span>
        )}
      </div>
    </>,
    portalTarget
  ) : null;

  const navbarElement = null; // Removing it from Ribbon


  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "calc(100vh - 64px)",
      margin: "-32px",
      background: "var(--bg-primary)",
      position: "relative",
      ...(isFullscreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        height: '100vh',
        margin: 0,
      } : {})
    }}>
      {breadcrumbPortal}
      
      {/* Editor & Copilot Container */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Main Editor Canvas */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", overflowY: "hidden", background: "#f3f4f6" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            React.isValidElement(children) ? React.cloneElement(children as any, {
              navbarElement,
              documentName,
              sidebar: (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <AICopilot 
                      documentContext={{
                        documentTitle: documentName || "Untitled Document",
                        workspaceId: workspaceId,
                        documentId: documentId,
                        documentType: documentType
                      }}
                      getCurrentSelection={getCurrentSelection}
                      getFullText={getFullText}
                      onApplyAction={onApplyAction}
                      onAiStart={onAiStart}
                      onAiEnd={onAiEnd}
                    />
                  </div>
                </div>
              )
            }) : children
          )}
        </div>
      </div>
    </div>
  );
}
