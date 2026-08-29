import React, { useState } from 'react';
import { Search, Loader, Globe, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface AICopilotQuickSearchProps {
  token: string;
}

export function AICopilotQuickSearch({ token }: AICopilotQuickSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/inline-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'browser_search',
          text: query
        })
      });

      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      
      const parsedResults = JSON.parse(data.result);
      setResults(parsedResults);
    } catch (err) {
      console.error(err);
      toast.error('Gagal melakukan pencarian real-time.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari web real-time..."
            style={{
              width: '100%',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '6px 28px 6px 10px',
              fontSize: '0.8rem',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
          <Globe size={12} style={{ position: 'absolute', right: '10px', color: 'var(--text-secondary)' }} />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{
            background: 'var(--text-primary)',
            color: 'var(--bg-primary)',
            border: 'none',
            borderRadius: '6px',
            padding: '0 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {loading ? <Loader size={12} className="animate-spin" /> : <Search size={12} />}
        </button>
      </form>

      {results.length > 0 && (
        <div style={{ marginTop: '10px', maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
          {results.map((res, i) => (
            <div key={i} style={{ fontSize: '0.75rem', padding: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
              <a href={res.link} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', marginBottom: '2px' }}>
                {res.title} <ExternalLink size={10} />
              </a>
              <div style={{ color: 'var(--text-secondary)', lineHeight: '1.2' }}>{res.snippet}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
