"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, FileText, Settings, Trash2, Bot } from "lucide-react";

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  // 1. Fetch workspaces on mount
  useEffect(() => {
    const fetchWs = async () => {
      try {
        const token = localStorage.getItem("vexius_token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        const wsRes = await fetch(`${apiUrl}/workspaces`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!wsRes.ok) throw new Error("Failed to fetch workspaces");
        const wsData = await wsRes.json();
        setWorkspaces(wsData);
        
        if (wsData.length > 0) {
          setActiveWorkspaceId(wsData[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWs();
  }, []);

  // 2. Fetch documents whenever activeWorkspaceId changes
  useEffect(() => {
    const fetchDocs = async () => {
      if (!activeWorkspaceId) return;
      try {
        const token = localStorage.getItem("vexius_token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const docRes = await fetch(`${apiUrl}/documents/workspace/${activeWorkspaceId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (docRes.ok) {
          const docData = await docRes.json();
          setDocuments(docData);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDocs();
  }, [activeWorkspaceId]);

  const createDocument = async (workspaceId: string) => {
    if (creating) return;
    setCreating(true);
    try {
      const token = localStorage.getItem("vexius_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      const res = await fetch(`${apiUrl}/documents/create`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ workspaceId, name: "Untitled Document" })
      });
      
      if (!res.ok) throw new Error("Failed to create document");
      const newDoc = await res.json();
      
      // Redirect to editor
      router.push(`/workspace/${workspaceId}/document/${newDoc.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create document.");
      setCreating(false);
    }
  };

  const deleteDocument = async (e: React.MouseEvent, docId: string) => {
    e.preventDefault(); // prevent Link navigation
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this document? This action cannot be undone.")) return;

    try {
      const token = localStorage.getItem("vexius_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/documents/${docId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to delete document");
      
      // Remove from state
      setDocuments(docs => docs.filter(d => d.id !== docId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete document");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
      {/* Workspaces Section */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: "8px" }}>
              Workspaces
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Select a workspace to manage your documents.
            </p>
          </div>
        </div>

        <div className="workspace-grid" style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
          gap: "24px" 
        }}>
          {workspaces.map((ws) => {
            const isActive = activeWorkspaceId === ws.id;
            return (
              <div 
                key={ws.id} 
                onClick={() => setActiveWorkspaceId(ws.id)}
                style={{
                  padding: "24px",
                  background: isActive ? "var(--bg-secondary)" : "transparent",
                  border: isActive ? "1px solid var(--text-primary)" : "1px solid var(--border-color)",
                  borderRadius: "12px",
                  transition: "all 0.2s",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => {
                  if(!isActive) e.currentTarget.style.borderColor = "var(--text-secondary)";
                }}
                onMouseOut={(e) => {
                  if(!isActive) e.currentTarget.style.borderColor = "var(--border-color)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div style={{ width: "40px", height: "40px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Settings size={18} color={isActive ? "var(--text-primary)" : "var(--text-secondary)"} />
                  </div>
                  {isActive && (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-primary)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "100px", border: "1px solid var(--border-subtle)" }}>
                      Active
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 500, marginBottom: "8px" }}>{ws.name}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Bot size={14} /> {ws.aiTokensUsed || 0} AI Tokens Used
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Documents Section */}
      {activeWorkspace && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: "4px" }}>
                Documents
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                In {activeWorkspace.name}
              </p>
            </div>
          </div>

          <div className="document-grid" style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", 
            gap: "16px" 
          }}>
            {/* Create New Document Card */}
            <div 
              onClick={() => createDocument(activeWorkspace.id)}
              style={{
                aspectRatio: "3/4",
                background: "transparent",
                border: "1px dashed var(--border-color)",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: creating ? "wait" : "pointer",
                color: "var(--text-secondary)",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => {
                if(creating) return;
                e.currentTarget.style.borderColor = "var(--text-primary)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseOut={(e) => {
                if(creating) return;
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              {creating ? <Loader2 size={32} className="animate-spin mb-2" /> : <Plus size={32} style={{ marginBottom: "8px" }} />}
              <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>New Document</span>
            </div>

            {/* List existing documents */}
            {documents.map((doc) => (
              <Link key={doc.id} href={`/workspace/${activeWorkspace.id}/document/${doc.id}`} style={{
                aspectRatio: "3/4",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                padding: "16px",
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                flexDirection: "column",
                transition: "border-color 0.2s",
                position: "relative"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "var(--text-primary)";
                const trashBtn = e.currentTarget.querySelector('.trash-btn') as HTMLElement;
                if(trashBtn) trashBtn.style.opacity = "1";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                const trashBtn = e.currentTarget.querySelector('.trash-btn') as HTMLElement;
                if(trashBtn) trashBtn.style.opacity = "0";
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flex: 1 }}>
                  <div style={{ color: "var(--text-secondary)" }}>
                    <FileText size={24} />
                  </div>
                  <button
                    className="trash-btn"
                    onClick={(e) => deleteDocument(e, doc.id)}
                    style={{
                      opacity: 0,
                      transition: "opacity 0.2s",
                      background: "transparent",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      padding: "4px"
                    }}
                    title="Delete Document"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 500, marginBottom: "4px" }}>{doc.name}</h3>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>

          {documents.length === 0 && (
            <div style={{ marginTop: "32px", padding: "48px", textAlign: "center", border: "1px dashed var(--border-color)", borderRadius: "12px", color: "var(--text-secondary)" }}>
              <FileText size={48} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 500, color: "var(--text-primary)", marginBottom: "8px" }}>No documents yet</h3>
              <p style={{ fontSize: "0.9rem" }}>Create a new document to start collaborating in this workspace.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
