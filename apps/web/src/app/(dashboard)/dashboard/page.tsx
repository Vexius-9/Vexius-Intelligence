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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  const handleUploadClick = () => {
    setShowUploadModal(true);
    setSelectedFile(null);
    setUploadError(null);
  };

  const uploadDocument = async () => {
    if (!activeWorkspaceId || !selectedFile) return;
    if (creating) return;
    
    setCreating(true);
    setUploadError(null);
    try {
      const token = localStorage.getItem("vexius_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const res = await fetch(`${apiUrl}/documents/upload?workspaceId=${activeWorkspaceId}`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}` 
        },
        body: formData
      });
      
      if (!res.ok) throw new Error("Failed to upload document");
      const newDoc = await res.json();
      
      // Update state and close modal
      setDocuments(docs => [...docs, newDoc]);
      setShowUploadModal(false);
      setSelectedFile(null);
      
      // Redirect to editor
      router.push(`/workspace/${activeWorkspaceId}/document/${newDoc.id}`);
    } catch (err) {
      console.error(err);
      setUploadError("Failed to upload document. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDocToDelete(docId);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const token = localStorage.getItem("vexius_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/documents/${docToDelete}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to delete document");
      
      // Remove from state
      setDocuments(docs => docs.filter(d => d.id !== docToDelete));
      setShowDeleteModal(false);
      setDocToDelete(null);
    } catch (err) {
      console.error(err);
      setDeleteError("Failed to delete document. Please try again.");
    } finally {
      setIsDeleting(false);
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
            {/* Upload Document Card */}
            <div 
              onClick={handleUploadClick}
              style={{
                aspectRatio: "3/4",
                background: "transparent",
                border: "1px dashed var(--border-color)",
                borderRadius: "8px",
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
              }}
            >
              <Plus size={32} style={{ marginBottom: "8px" }} />
              <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>Upload Document</span>
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
                    onClick={(e) => handleDeleteClick(e, doc.id)}
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

      {/* Delete Modal */}
      {showDeleteModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            padding: "24px",
            borderRadius: "12px",
            width: "90%",
            maxWidth: "400px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
          }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "8px", color: "var(--text-primary)" }}>
              Delete Document
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "24px" }}>
              Are you sure you want to delete this document? This action cannot be undone.
            </p>
            {deleteError && (
              <p style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "16px" }}>{deleteError}</p>
            )}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                style={{
                  padding: "8px 16px", borderRadius: "6px", border: "1px solid var(--border-color)",
                  background: "transparent", color: "var(--text-primary)", cursor: isDeleting ? "not-allowed" : "pointer"
                }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{
                  padding: "8px 16px", borderRadius: "6px", border: "none",
                  background: "#ef4444", color: "#fff", cursor: isDeleting ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: "8px"
                }}
              >
                {isDeleting && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            padding: "24px",
            borderRadius: "12px",
            width: "90%",
            maxWidth: "400px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
          }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "8px", color: "var(--text-primary)" }}>
              Upload Document
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "24px" }}>
              Please select a document to upload to this workspace. Supported formats: .pdf, .docx, .xlsx, .pptx, .txt.
            </p>
            
            <input 
              type="file" 
              accept=".pdf,.docx,.xlsx,.pptx,.txt"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              style={{
                width: "100%", padding: "12px", marginBottom: "24px",
                border: "1px dashed var(--border-color)", borderRadius: "8px",
                color: "var(--text-primary)", background: "rgba(255,255,255,0.02)"
              }}
            />
            
            {uploadError && (
              <p style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "16px" }}>{uploadError}</p>
            )}
            
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button 
                onClick={() => { setShowUploadModal(false); setSelectedFile(null); }}
                disabled={creating}
                style={{
                  padding: "8px 16px", borderRadius: "6px", border: "1px solid var(--border-color)",
                  background: "transparent", color: "var(--text-primary)", cursor: creating ? "not-allowed" : "pointer"
                }}
              >
                Cancel
              </button>
              <button 
                onClick={uploadDocument}
                disabled={!selectedFile || creating}
                style={{
                  padding: "8px 16px", borderRadius: "6px", border: "none",
                  background: !selectedFile || creating ? "var(--border-color)" : "#fff", 
                  color: !selectedFile || creating ? "var(--text-secondary)" : "#000", 
                  cursor: !selectedFile || creating ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: "8px"
                }}
              >
                {creating && <Loader2 size={14} className="animate-spin" />}
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
