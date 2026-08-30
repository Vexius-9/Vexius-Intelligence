"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, FileText, Settings, Trash2, Bot, Folder, ChevronRight, Sparkles, ChevronDown, Upload, Table, Presentation, File, Copy, Check } from "lucide-react";
import { toast } from 'react-hot-toast';

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<{id: string, name: string}[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, message: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success(message);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };
  const [creating, setCreating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [showCreateMenu, setShowCreateMenu] = useState(false);

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

  // 2. Fetch documents whenever activeWorkspaceId or currentFolderId changes
  useEffect(() => {
    const fetchDocs = async () => {
      if (!activeWorkspaceId) return;
      setLoadingDocs(true);
      try {
        const token = localStorage.getItem("vexius_token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const url = new URL(`${apiUrl}/documents/workspace/${activeWorkspaceId}`);
        if (currentFolderId) {
          url.searchParams.append('parentId', currentFolderId);
        }
        const docRes = await fetch(url.toString(), {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (docRes.ok) {
          const docData = await docRes.json();
          setDocuments(docData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDocs(false);
      }
    };
    fetchDocs();
  }, [activeWorkspaceId, currentFolderId]);

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

  const createNewDocument = async (type: 'document' | 'spreadsheet' | 'presentation' | 'folder') => {
    if (!activeWorkspaceId) return;
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
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          name: type === 'folder' ? 'Untitled Folder' : `Untitled ${type}`,
          type,
          parentId: currentFolderId || undefined
        })
      });

      if (!res.ok) throw new Error("Failed to create document");
      const newDoc = await res.json();
      
      setDocuments(docs => [newDoc, ...docs]); // add to beginning
      
      if (type !== 'folder') {
        router.push(`/workspace/${activeWorkspaceId}/document/${newDoc.id}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create new document.");
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

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{type: "success" | "error", text: string} | null>(null);

  const [runningAgent, setRunningAgent] = useState<string | null>(null);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !activeWorkspaceId) return;

    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const token = localStorage.getItem("vexius_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/ai/search?q=${encodeURIComponent(searchQuery)}&workspaceId=${activeWorkspaceId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId || !inviteEmail.trim()) return;

    setInviting(true);
    setInviteMessage(null);
    try {
      const token = localStorage.getItem("vexius_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/workspaces/${activeWorkspaceId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to invite user");
      }
      
      setInviteMessage({ type: "success", text: `Successfully invited ${inviteEmail}` });
      setInviteEmail("");
    } catch (err: any) {
      console.error(err);
      setInviteMessage({ type: "error", text: err.message || "Failed to invite user" });
    } finally {
      setInviting(false);
    }
  };

  const handleRunAgent = async (e: React.MouseEvent, docId: string, agentType: 'financial-analyst' | 'legal-reviewer') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (runningAgent) return;
    setRunningAgent(docId);
    
    try {
      const token = localStorage.getItem("vexius_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/ai/agents/${agentType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ documentId: docId, workspaceId: activeWorkspaceId })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to run agent");
      }
      
      const newDoc = await res.json();
      setDocuments(docs => [newDoc, ...docs]);
      alert(`Agent finished! Created analysis document: ${newDoc.name}`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to run agent.");
    } finally {
      setRunningAgent(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
      {/* Documents Section */}
      {activeWorkspace && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <h1 
                  onClick={() => {
                    setCurrentFolderId(null);
                    setFolderHistory([]);
                  }}
                  style={{ fontSize: "2rem", fontWeight: 600, letterSpacing: "-0.03em", cursor: "pointer", color: currentFolderId ? "var(--text-secondary)" : "var(--text-primary)" }}
                >
                  Documents
                </h1>
                {folderHistory.map((folder, idx) => (
                  <React.Fragment key={folder.id}>
                    <ChevronRight size={20} color="var(--text-secondary)" />
                    <h1 
                      onClick={() => {
                        const newHistory = folderHistory.slice(0, idx + 1);
                        setCurrentFolderId(folder.id);
                        setFolderHistory(newHistory);
                      }}
                      style={{ fontSize: "2rem", fontWeight: 600, letterSpacing: "-0.03em", cursor: "pointer", color: idx === folderHistory.length - 1 ? "var(--text-primary)" : "var(--text-secondary)" }}
                    >
                      {folder.name}
                    </h1>
                  </React.Fragment>
                ))}
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                Manage your documents in {activeWorkspace.name}.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>Workspace ID:</span>
                <code style={{ fontSize: "0.85rem", color: "var(--text-primary)", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border-color)", fontFamily: "monospace" }}>
                  {activeWorkspace.id}
                </code>
                <button 
                  onClick={() => handleCopy(activeWorkspace.id, 'Workspace ID copied')}
                  style={{ background: "transparent", border: "none", color: copiedId === activeWorkspace.id ? "#10b981" : "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", transition: "color 0.2s" }}
                  title="Copy Workspace ID"
                >
                  {copiedId === activeWorkspace.id ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", position: "relative" }}>
              <button 
                onClick={() => {
                  setShowShareModal(true);
                  setInviteMessage(null);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "#a855f7",
                  color: "#fff",
                  border: "none",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                Share
              </button>

              <Link
                href={`/workspace/${activeWorkspaceId}/settings`}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                  fontWeight: 500,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <Settings size={16} />
                Settings
              </Link>
              
              <form onSubmit={handleSearch} style={{ display: "flex", alignItems: "center" }}>
                <input 
                  type="text" 
                  placeholder="Search inside documents (AI)..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    width: "300px",
                    outline: "none"
                  }}
                />
              </form>
              
              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div style={{
                  position: "absolute", top: "100%", right: 0, marginTop: "8px",
                  background: "var(--bg-secondary)", border: "1px solid var(--border-color)",
                  borderRadius: "8px", width: "400px", maxHeight: "400px", overflowY: "auto",
                  zIndex: 50, boxShadow: "0 10px 25px rgba(0,0,0,0.5)", padding: "16px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <h4 style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>SEMANTIC SEARCH RESULTS</h4>
                    <button onClick={() => setShowSearchResults(false)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>✕</button>
                  </div>
                  
                  {isSearching ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}><Loader2 className="animate-spin" size={24} /></div>
                  ) : searchResults.length === 0 ? (
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", textAlign: "center", padding: "24px 0" }}>No matching contents found.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {searchResults.map((res: any, idx: number) => (
                        <Link key={idx} href={`/workspace/${activeWorkspaceId}/document/${res.id}`} style={{ textDecoration: "none" }}>
                          <div style={{ padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", border: "1px solid transparent", transition: "border-color 0.2s" }}
                            onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = "transparent"}
                          >
                            <h5 style={{ fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "4px" }}>{res.documentName}</h5>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              "...{res.content}..."
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="document-grid" style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", 
            gap: "16px" 
          }}>
            {/* Create New / Upload Card */}
            <div>
              <div 
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                style={{
                  aspectRatio: "3/4", background: "transparent", border: "1px dashed var(--border-color)", borderRadius: "8px",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "var(--text-secondary)", transition: "all 0.2s",
                  position: "relative"
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--text-primary)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Plus size={32} style={{ marginBottom: "8px" }} />
                  <span style={{ fontSize: "0.9rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                    New <ChevronDown size={14} />
                  </span>

                  {showCreateMenu && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: "8px",
                        background: "var(--bg-secondary)", border: "1px solid var(--border-color)",
                        borderRadius: "8px", width: "180px", zIndex: 50, boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                        display: "flex", flexDirection: "column", padding: "8px"
                      }}>
                      <button onClick={(e) => { e.stopPropagation(); setShowCreateMenu(false); createNewDocument('folder'); }} style={{ textAlign: "left", padding: "8px 12px", background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", borderRadius: "4px", display: "flex", alignItems: "center", gap: "8px" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseOut={(e) => e.currentTarget.style.background = "none"}><Folder size={16} color="#eab308" /> New Folder</button>
                      <button onClick={(e) => { e.stopPropagation(); setShowCreateMenu(false); createNewDocument('document'); }} style={{ textAlign: "left", padding: "8px 12px", background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", borderRadius: "4px", display: "flex", alignItems: "center", gap: "8px" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseOut={(e) => e.currentTarget.style.background = "none"}><FileText size={16} color="#3b82f6" /> New Word</button>
                      <button onClick={(e) => { e.stopPropagation(); setShowCreateMenu(false); createNewDocument('spreadsheet'); }} style={{ textAlign: "left", padding: "8px 12px", background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", borderRadius: "4px", display: "flex", alignItems: "center", gap: "8px" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseOut={(e) => e.currentTarget.style.background = "none"}><Table size={16} color="#10b981" /> New Excel</button>
                      <button onClick={(e) => { e.stopPropagation(); setShowCreateMenu(false); createNewDocument('presentation'); }} style={{ textAlign: "left", padding: "8px 12px", background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", borderRadius: "4px", display: "flex", alignItems: "center", gap: "8px" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseOut={(e) => e.currentTarget.style.background = "none"}><Presentation size={16} color="#f97316" /> New PowerPoint</button>
                      <div style={{ height: "1px", background: "var(--border-color)", margin: "4px 0" }} />
                      <button onClick={(e) => { e.stopPropagation(); setShowCreateMenu(false); handleUploadClick(); }} style={{ textAlign: "left", padding: "8px 12px", background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", borderRadius: "4px", display: "flex", alignItems: "center", gap: "8px" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseOut={(e) => e.currentTarget.style.background = "none"}><Upload size={16} /> Upload Document</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* List existing documents */}
            {loadingDocs ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={`shimmer-${i}`} className="animate-pulse" style={{
                  aspectRatio: "3/4",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column"
                }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "4px", background: "rgba(255,255,255,0.05)", marginBottom: "auto" }} />
                  <div style={{ height: "14px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", width: "70%", marginBottom: "8px" }} />
                  <div style={{ height: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", width: "40%" }} />
                </div>
              ))
            ) : (
              documents.map((doc) => {
                const isFolder = doc.type === 'folder';
                
                const cardContent = (
                  <>
                    <div style={{ 
                      flex: 1, 
                      background: isFolder ? "transparent" : "var(--bg-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderBottom: isFolder ? "none" : "1px solid var(--border-color)",
                      position: "relative",
                      overflow: "hidden"
                    }}>

                      
                      <div style={{ zIndex: 1, opacity: isFolder ? 1 : 0.8, display: "flex", justifyContent: "center", alignItems: "center" }}>
                        {isFolder ? <Folder size={64} fill="#eab308" color="#eab308" fillOpacity={0.2} /> : (
                          doc.type === 'spreadsheet' ? <img src="/sheet.png" alt="Sheet" style={{ width: 64, height: 64, objectFit: 'contain' }} /> :
                          doc.type === 'presentation' ? <img src="/slides.png" alt="Presentation" style={{ width: 64, height: 64, objectFit: 'contain' }} /> :
                          doc.type === 'pdf' ? <img src="/pdf.png" alt="PDF" style={{ width: 64, height: 64, objectFit: 'contain' }} /> :
                          <img src="/docs.png" alt="Document" style={{ width: 64, height: 64, objectFit: 'contain' }} />
                        )}
                      </div>

                      <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", gap: "4px", zIndex: 2 }}>
                        {doc.type === 'spreadsheet' && (
                          <button
                            className="agent-btn"
                            onClick={(e) => handleRunAgent(e, doc.id, 'financial-analyst')}
                            style={{ opacity: 0, transition: "opacity 0.2s", background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", cursor: "pointer", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}
                            title="Run Financial Analyst Agent"
                          >
                            <Sparkles size={12} /> Analyze
                          </button>
                        )}
                        {(doc.type === 'document' || doc.type === 'pdf') && (
                          <button
                            className="agent-btn"
                            onClick={(e) => handleRunAgent(e, doc.id, 'legal-reviewer')}
                            style={{ opacity: 0, transition: "opacity 0.2s", background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", cursor: "pointer", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}
                            title="Run Legal Reviewer Agent"
                          >
                            <Sparkles size={12} /> Review
                          </button>
                        )}
                        <button
                          className="trash-btn"
                          onClick={(e) => handleDeleteClick(e, doc.id)}
                          style={{
                            opacity: 0,
                            transition: "opacity 0.2s",
                            background: "rgba(0,0,0,0.6)",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "6px",
                            borderRadius: "4px"
                          }}
                          title="Delete Document"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ padding: "12px 16px", background: "var(--bg-secondary)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                          {isFolder ? <Folder size={16} fill="#eab308" color="#eab308" /> : (
                            doc.type === 'spreadsheet' ? <img src="/sheet.png" alt="Sheet" style={{ width: 16, height: 16, objectFit: 'contain' }} /> :
                            doc.type === 'presentation' ? <img src="/slides.png" alt="Presentation" style={{ width: 16, height: 16, objectFit: 'contain' }} /> :
                            doc.type === 'pdf' ? <img src="/pdf.png" alt="PDF" style={{ width: 16, height: 16, objectFit: 'contain' }} /> :
                            <img src="/docs.png" alt="Document" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                          )}
                        </div>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.name}</h3>
                      </div>
                      <div style={{ paddingLeft: "24px" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                          {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontFamily: "monospace", opacity: 0.8 }}>ID: {doc.id.substring(0,8)}...</span>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCopy(doc.id, `${isFolder ? 'Folder' : 'Document'} ID copied`);
                            }}
                            style={{ background: "transparent", border: "none", color: copiedId === doc.id ? "#10b981" : "var(--text-secondary)", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center", transition: "color 0.2s" }}
                            title="Copy full ID"
                          >
                            {copiedId === doc.id ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                );

                const cardStyle = {
                  aspectRatio: "3/4",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  padding: 0,
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column" as const,
                  transition: "border-color 0.2s, transform 0.2s",
                  position: "relative" as const,
                  cursor: "pointer",
                  overflow: "hidden"
                };

                const hoverHandlers = {
                  onMouseOver: (e: React.MouseEvent<HTMLElement>) => {
                    e.currentTarget.style.borderColor = isFolder ? "#eab308" : "var(--text-primary)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                    const trashBtn = e.currentTarget.querySelector('.trash-btn') as HTMLElement;
                    if(trashBtn) trashBtn.style.opacity = "1";
                    const agentBtn = e.currentTarget.querySelector('.agent-btn') as HTMLElement;
                    if(agentBtn) agentBtn.style.opacity = "1";
                  },
                  onMouseOut: (e: React.MouseEvent<HTMLElement>) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.transform = "translateY(0)";
                    const trashBtn = e.currentTarget.querySelector('.trash-btn') as HTMLElement;
                    if(trashBtn) trashBtn.style.opacity = "0";
                    const agentBtn = e.currentTarget.querySelector('.agent-btn') as HTMLElement;
                    if(agentBtn) agentBtn.style.opacity = "0";
                  }
                };

                if (isFolder) {
                  return (
                    <div 
                      key={doc.id} 
                      style={cardStyle}
                      {...hoverHandlers}
                      onClick={() => {
                        setCurrentFolderId(doc.id);
                        setFolderHistory([...folderHistory, { id: doc.id, name: doc.name }]);
                      }}
                    >
                      {cardContent}
                    </div>
                  );
                }

                return (
                  <Link 
                    key={doc.id} 
                    href={`/workspace/${activeWorkspace.id}/document/${doc.id}`} 
                    style={cardStyle}
                    {...hoverHandlers}
                  >
                    {cardContent}
                  </Link>
                );
              })
            )}
          </div>

          {!loadingDocs && documents.length === 0 && (
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
      {/* Share Modal */}
      {showShareModal && (
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
              Share Workspace
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "24px" }}>
              Invite a user to collaborate in {activeWorkspace?.name}.
            </p>
            
            <form onSubmit={handleInvite}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "8px" }}>User Email</label>
                <input 
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: "6px",
                    border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.02)",
                    color: "var(--text-primary)", outline: "none"
                  }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "8px" }}>Role</label>
                <select 
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: "6px",
                    border: "1px solid var(--border-color)", background: "var(--bg-secondary)",
                    color: "var(--text-primary)", outline: "none", cursor: "pointer"
                  }}
                >
                  <option value="editor">Editor (Can edit and comment)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                  <option value="owner">Owner (Full access)</option>
                </select>
              </div>
              
              {inviteMessage && (
                <p style={{ color: inviteMessage.type === "error" ? "#ef4444" : "#10b981", fontSize: "0.85rem", marginBottom: "16px" }}>
                  {inviteMessage.text}
                </p>
              )}
              
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button 
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  disabled={inviting}
                  style={{
                    padding: "8px 16px", borderRadius: "6px", border: "1px solid var(--border-color)",
                    background: "transparent", color: "var(--text-primary)", cursor: inviting ? "not-allowed" : "pointer"
                  }}
                >
                  Close
                </button>
                <button 
                  type="submit"
                  disabled={!inviteEmail || inviting}
                  style={{
                    padding: "8px 16px", borderRadius: "6px", border: "none",
                    background: !inviteEmail || inviting ? "var(--border-color)" : "#a855f7", 
                    color: !inviteEmail || inviting ? "var(--text-secondary)" : "#fff", 
                    cursor: !inviteEmail || inviting ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: "8px"
                  }}
                >
                  {inviting && <Loader2 size={14} className="animate-spin" />}
                  Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
