"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, FileText, Settings } from "lucide-react";

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("vexius_token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        // 1. Fetch workspaces
        const wsRes = await fetch(`${apiUrl}/workspaces`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!wsRes.ok) throw new Error("Failed to fetch workspaces");
        const wsData = await wsRes.json();
        setWorkspaces(wsData);

        // 2. If user has workspaces, fetch documents for the first one for quick access
        if (wsData.length > 0) {
          const defaultWs = wsData[0];
          const docRes = await fetch(`${apiUrl}/documents/workspace/${defaultWs.id}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (docRes.ok) {
            const docData = await docRes.json();
            setDocuments(docData);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const activeWorkspace = workspaces[0];

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
              Select a workspace to start collaborating.
            </p>
          </div>
        </div>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
          gap: "24px" 
        }}>
          {workspaces.map((ws) => (
            <div key={ws.id} style={{
              padding: "24px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              transition: "border-color 0.2s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div style={{ width: "40px", height: "40px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Settings size={18} color="var(--text-secondary)" />
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "100px" }}>
                  Active
                </span>
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 500, marginBottom: "8px" }}>{ws.name}</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                ID: {ws.id.substring(0,8)}...
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Documents Section for First Workspace */}
      {activeWorkspace && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: "4px" }}>
                Documents in {activeWorkspace.name}
              </h2>
            </div>
          </div>

          <div style={{ 
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
                transition: "border-color 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--text-primary)"}
              onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}>
                <div style={{ flex: 1, color: "var(--text-secondary)" }}>
                  <FileText size={24} />
                </div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 500, marginBottom: "4px" }}>{doc.name}</h3>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
