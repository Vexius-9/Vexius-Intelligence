'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { KeyRound, Plus, Trash2, Copy, AlertTriangle } from 'lucide-react';

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

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API Key? Any application using it will stop working immediately.')) return;

    try {
      const token = localStorage.getItem('vexius_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api-keys/${id}/workspace/${workspaceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to revoke key');
      }

      toast.success('API Key revoked');
      fetchApiKeys();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Workspace Settings</h1>
        <p className="text-gray-400 mt-2">Manage your workspace configuration and integrations.</p>
      </div>

      <div className="bg-[#1C1C1F] border border-[#333] rounded-xl p-6 shadow-xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-400" />
            API Keys
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            API keys allow external applications (like Claude Desktop or Cursor) to securely access this workspace.
          </p>
        </div>

        {/* Generate New Key Form */}
        <form onSubmit={handleGenerateKey} className="flex gap-3">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key Name (e.g. Claude Desktop Mac)"
            className="flex-1 bg-[#2C2C30] border border-[#444] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={isGenerating || !newKeyName.trim()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {isGenerating ? 'Generating...' : 'Generate Key'}
          </button>
        </form>

        {/* Newly Generated Key Alert */}
        {generatedKey && (
          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-4 space-y-3">
            <div className="flex gap-2 text-emerald-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Please copy this API key and save it somewhere safe.</p>
                <p className="opacity-90 mt-0.5">For security reasons, you won't be able to see it again after you close this page.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-black/50 p-2 rounded-lg border border-emerald-900/30">
              <code className="flex-1 text-emerald-300 text-sm font-mono break-all">{generatedKey}</code>
              <button
                type="button"
                onClick={() => copyToClipboard(generatedKey)}
                className="p-2 bg-[#2C2C30] hover:bg-[#3C3C40] rounded text-gray-300 transition"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Key List */}
        <div className="mt-8">
          {loading ? (
            <div className="text-center py-8 text-sm text-gray-500 animate-pulse">Loading API keys...</div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#444] rounded-xl text-gray-500 text-sm">
              No API keys generated yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs text-gray-500 uppercase bg-[#2C2C30]/50 rounded-t-lg">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">Name</th>
                    <th className="px-4 py-3 font-medium">Key Prefix</th>
                    <th className="px-4 py-3 font-medium">Created On</th>
                    <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333]">
                  {apiKeys.map(key => (
                    <tr key={key.id} className="hover:bg-[#2C2C30]/30 transition">
                      <td className="px-4 py-3 font-medium text-white">{key.name}</td>
                      <td className="px-4 py-3 font-mono text-xs opacity-70">
                        {key.key.substring(0, 15)}...
                      </td>
                      <td className="px-4 py-3 opacity-70">
                        {new Date(key.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-400/10 transition inline-flex"
                          title="Revoke Key"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
