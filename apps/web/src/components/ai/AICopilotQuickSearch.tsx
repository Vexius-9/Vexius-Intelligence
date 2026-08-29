import React, { useState } from 'react';
import { Search, Loader, Globe, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface ScrapedPage {
  title: string;
  content: string;
  url: string;
  usedFallback: boolean;
}

interface AICopilotQuickSearchProps {
  token: string;
}

export function AICopilotQuickSearch({ token }: AICopilotQuickSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [scrapedPage, setScrapedPage] = useState<ScrapedPage | null>(null);
  const [loading, setLoading] = useState(false);

  const isUrl = (text: string) => /^https?:\/\/.+/i.test(text.trim());

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);
    setScrapedPage(null);
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
      
      const parsed = JSON.parse(data.result);
      // If it's a URL, the backend returns a ScrapedPage object (not an array)
      if (Array.isArray(parsed)) {
        setResults(parsed);
      } else if (parsed && parsed.url) {
        setScrapedPage(parsed as ScrapedPage);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to perform real-time search.');
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
            placeholder="Search web or paste a URL..."
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

      {/* Search results (keyword query) */}
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

      {/* Scraped page content (URL input) */}
      {scrapedPage && (
        <div style={{ marginTop: '10px', fontSize: '0.75rem', padding: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
          <a href={scrapedPage.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', marginBottom: '4px' }}>
            {scrapedPage.title || scrapedPage.url} <ExternalLink size={10} />
          </a>
          {scrapedPage.usedFallback && (
            <span style={{ fontSize: '0.65rem', color: '#f59e0b', marginBottom: '4px', display: 'block' }}>⚡ Rendered via Playwright</span>
          )}
          <div style={{ color: 'var(--text-secondary)', lineHeight: '1.3', maxHeight: '120px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
            {scrapedPage.content.slice(0, 600)}{scrapedPage.content.length > 600 ? '...' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
