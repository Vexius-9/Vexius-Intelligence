'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { KeyRound, Plus, Trash2, Copy, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
}

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams() as { workspaceId: string };
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchApiKeys();
  }, [workspaceId]);

  const fetchApiKeys = async () => {
    try {
      const token = localStorage.getItem('vexius_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api-keys/workspace/${workspaceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setIsGenerating(true);
    try {
      const token = localStorage.getItem('vexius_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workspaceId,
          name: newKeyName
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to generate key');
      }

      const newKey = await res.json();
      setGeneratedKey(newKey.key);
      setNewKeyName('');
      fetchApiKeys();
      toast.success('API Key generated successfully');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);
  const [revokeStatus, setRevokeStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevokeKey = (id: string) => {
    setKeyToRevoke(id);
  };

  const confirmRevokeKey = async () => {
    if (!keyToRevoke) return;

    setIsRevoking(true);
    try {
      const token = localStorage.getItem('vexius_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api-keys/${keyToRevoke}/workspace/${workspaceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to revoke key');
      }

      setRevokeStatus({ type: 'success', message: 'API Key has been revoked successfully and is no longer active.' });
      fetchApiKeys();
    } catch (err: any) {
      setRevokeStatus({ type: 'error', message: err.message });
    } finally {
      setIsRevoking(false);
      setKeyToRevoke(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px", display: "flex", flexDirection: "column", gap: "32px" }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", margin: 0 }}>Workspace Settings</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "8px", fontSize: "0.95rem" }}>
          Manage your workspace configuration and integrations.
        </p>
      </div>

      <div style={{ 
        background: "var(--bg-secondary)", 
        border: "1px solid var(--border-color)", 
        borderRadius: "12px", 
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "24px"
      }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
            <div style={{ padding: "6px", background: "rgba(168, 85, 247, 0.1)", borderRadius: "6px", color: "#a855f7" }}>
              <KeyRound size={18} />
            </div>
            API Keys
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "8px" }}>
            API keys allow external applications (like Claude Desktop or Cursor) to securely access this workspace.
          </p>
        </div>

        {/* Generate New Key Form */}
        <form onSubmit={handleGenerateKey} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key Name (e.g. Claude Desktop Mac)"
            style={{
              flex: 1,
              padding: "10px 16px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              fontSize: "0.9rem",
              outline: "none"
            }}
            required
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={isGenerating || !newKeyName.trim()}
            style={{
              padding: "10px 20px",
              background: "#a855f7",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 500,
              fontSize: "0.9rem",
              cursor: (isGenerating || !newKeyName.trim()) ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              opacity: (isGenerating || !newKeyName.trim()) ? 0.6 : 1,
              transition: "opacity 0.2s"
            }}
          >
            <Plus size={16} />
            {isGenerating ? 'Generating...' : 'Generate Key'}
          </button>
        </form>

        {/* Newly Generated Key Alert */}
        {generatedKey && (
          <div style={{
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: "8px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            <div style={{ display: "flex", gap: "12px", color: "#10b981" }}>
              <AlertTriangle size={20} style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 600, margin: 0, fontSize: "0.9rem" }}>Please copy this API key and save it somewhere safe.</p>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", opacity: 0.9 }}>For security reasons, you won't be able to see it again after you close this page.</p>
              </div>
            </div>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              background: "rgba(0,0,0,0.2)", 
              padding: "8px 12px", 
              borderRadius: "6px",
              border: "1px solid rgba(16, 185, 129, 0.15)"
            }}>
              <code style={{ flex: 1, color: "#10b981", fontSize: "0.85rem", fontFamily: "monospace", wordBreak: "break-all" }}>
                {generatedKey}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(generatedKey)}
                style={{
                  padding: "6px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "4px",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                title="Copy to clipboard"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Key List */}
        <div style={{ marginTop: "16px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Loading API keys...
            </div>
          ) : apiKeys.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "48px 24px", 
              border: "1px dashed var(--border-color)", 
              borderRadius: "8px", 
              color: "var(--text-secondary)",
              fontSize: "0.9rem"
            }}>
              No API keys generated yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-primary)", borderBottom: "1px solid var(--border-color)" }}>
                    <th style={{ padding: "12px 16px", fontWeight: 500, color: "var(--text-secondary)" }}>Name</th>
                    <th style={{ padding: "12px 16px", fontWeight: 500, color: "var(--text-secondary)" }}>Key Prefix</th>
                    <th style={{ padding: "12px 16px", fontWeight: 500, color: "var(--text-secondary)" }}>Created On</th>
                    <th style={{ padding: "12px 16px", fontWeight: 500, color: "var(--text-secondary)", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((key, i) => (
                    <tr key={key.id} style={{ 
                      borderBottom: i === apiKeys.length - 1 ? "none" : "1px solid var(--border-color)",
                      background: "var(--bg-secondary)"
                    }}>
                      <td style={{ padding: "12px 16px", fontWeight: 500, color: "var(--text-primary)" }}>{key.name}</td>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>
                            {visibleKeys[key.id] ? key.key : `vex_live_${'*'.repeat(Math.max(key.key.length - 9, 20))}`}
                          </span>
                          <button
                            onClick={() => toggleKeyVisibility(key.id)}
                            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
                            title={visibleKeys[key.id] ? "Hide Key" : "Show Key"}
                          >
                            {visibleKeys[key.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(key.key)}
                            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
                            title="Copy Key"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                        {new Date(key.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "6px",
                            borderRadius: "4px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
                          onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                          title="Revoke Key"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Revoke Confirmation Modal */}
      {keyToRevoke && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "var(--bg-secondary)", padding: "24px", borderRadius: "12px", border: "1px solid var(--border-color)", width: "400px", maxWidth: "90%" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 12px 0" }}>Revoke API Key</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: "0 0 24px 0", lineHeight: 1.5 }}>
              Are you sure you want to revoke this API Key? Any application using it will stop working immediately. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setKeyToRevoke(null)}
                disabled={isRevoking}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-primary)", cursor: isRevoking ? "not-allowed" : "pointer", fontSize: "0.9rem", fontWeight: 500, opacity: isRevoking ? 0.5 : 1 }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmRevokeKey}
                disabled={isRevoking}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff", cursor: isRevoking ? "not-allowed" : "pointer", fontSize: "0.9rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px", opacity: isRevoking ? 0.7 : 1 }}
              >
                {isRevoking ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Revoking...
                  </>
                ) : (
                  'Yes, Revoke'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Information Modal */}
      {revokeStatus && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "var(--bg-secondary)", padding: "24px", borderRadius: "12px", border: "1px solid var(--border-color)", width: "400px", maxWidth: "90%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              {revokeStatus.type === 'success' ? (
                <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertTriangle size={20} />
                </div>
              ) : (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertTriangle size={20} />
                </div>
              )}
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                {revokeStatus.type === 'success' ? 'Revoked Successfully' : 'Action Failed'}
              </h3>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: "0 0 24px 0", lineHeight: 1.5 }}>
              {revokeStatus.message}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setRevokeStatus(null)}
                style={{ padding: "8px 24px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)", cursor: "pointer", fontSize: "0.9rem", fontWeight: 500 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
