"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, Sparkles, ChevronDown, Edit3, Type, CheckCircle, BarChart, Search, BookOpen } from "lucide-react";
import { useChat } from "ai/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "react-hot-toast";

interface AICopilotProps {
  documentContext?: {
    selectedText?: string;
    documentTitle?: string;
    documentContent?: string;
    workspaceId?: string;
    documentId?: string;
    documentType?: string;
  };
  getCurrentSelection?: () => Promise<string>;
  getFullText?: () => Promise<string>;
  onApplyAction?: (text: string) => void;
  onAiStart?: () => void;
  onAiEnd?: () => void;
}



export function AICopilot({ documentContext, getCurrentSelection, getFullText, onApplyAction, onAiStart, onAiEnd }: AICopilotProps) {
  const [selectedModel, setSelectedModel] = useState<string>("deepseek:deepseek-chat");
  const [token, setToken] = useState<string>("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [cachedSelection, setCachedSelection] = useState<string>("");
  const [deepResearchSteps, setDeepResearchSteps] = useState<{label: string; done: boolean}[]>([]);
  const [isDeepResearching, setIsDeepResearching] = useState(false);
  const [deepResearchSources, setDeepResearchSources] = useState<{title: string; url: string; snippet: string}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setToken(localStorage.getItem("vexius_token") || "");
  }, []);


  
  // Cache the selection when the mouse enters the sidebar, BEFORE the iframe loses focus on click
  const handleMouseEnter = async () => {
    if (getCurrentSelection) {
      try {
        const text = await getCurrentSelection();
        if (text && text.trim() !== "") {
          setCachedSelection(text);
        }
      } catch (err) {
        // ignore errors during silent cache
      }
    }
  };

  const { messages, input, handleInputChange, handleSubmit, isLoading, append, setMessages } = useChat({
    api: `${process.env.NEXT_PUBLIC_API_URL}/ai/chat`,
    streamProtocol: "text",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    // NOTE: body here is static at init time — we override it dynamically in overrideHandleSubmit below
    body: {
      model: selectedModel,
      context: documentContext
    },
    initialMessages: [
      { id: "1", role: "assistant", content: "I am Vexius Intelligence. How can I help you today?" }
    ],
    onError: (error) => {
      console.error('[AICopilot] useChat error:', error);
      toast.error(`AI Error: ${error.message || 'Unknown error'}`);
    }
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isProcessingAction]);

  const handleInlineAction = async (action: 'rewrite' | 'summarize' | 'grammar' | 'generate_formula' | 'explain_formula' | 'slide_structure' | 'summarize_pdf' | 'text_to_bullets' | 'speaker_notes' | 'generate_slide') => {
    if (!getCurrentSelection || !onApplyAction) {
      toast.error("Inline actions are not available in this context.");
      return;
    }

    try {
      if (onAiStart) onAiStart();
      setIsProcessingAction(true);
      let text = await getCurrentSelection();
      
      // Fallback to cached selection if iframe lost focus and returned empty
      if (!text || text.trim() === "") {
        text = cachedSelection;
      }
      
      if (!text || text.trim() === "") {
        if (action === 'summarize_pdf' || action === 'summarize' || action === 'slide_structure' || action === 'generate_slide') {
          text = documentContext?.documentContent || "";
        }
        
        // For grammar, rewrite, and formula generation, text is absolutely REQUIRED.
        if ((!text || text.trim() === "") && ['grammar', 'rewrite', 'generate_formula'].includes(action)) {
          toast.error("ONLYOFFICE membatasi akses teks dari luar. Silakan gunakan tab 'Plugins' -> 'Vexius AI' bawaan ONLYOFFICE di toolbar atas untuk aksi ini (Anda bisa memasukkan API Key di sana).", { duration: 6000 });
          setIsProcessingAction(false);
          if (onAiEnd) onAiEnd();
          return;
        }
      }

      // General fallback if text is still empty and we have no documentId
      if ((!text || text.trim() === "") && !documentContext?.documentId) {
        toast.error("Please select some text in the document first or ensure the document has content.");
        setIsProcessingAction(false);
        if (onAiEnd) onAiEnd();
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/inline-action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          text,
          workspaceId: documentContext?.workspaceId,
          documentId: documentContext?.documentId
        })
      });

      if (!res.ok) throw new Error("Action failed");
      const data = await res.json();
      
      if (action === 'explain_formula' || action === 'summarize_pdf') {
        setMessages([...messages, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: `**${action === 'explain_formula' ? 'Formula Explanation' : 'PDF Summary'}**\n\n${data.result}` 
        }]);
      } else {
        const actionNames = {
          rewrite: 'Rewrite Result',
          grammar: 'Grammar Correction',
          summarize: 'Summary'
        };
        const title = actionNames[action as keyof typeof actionNames] || 'AI Result';
        setMessages([...messages, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: `**${title}**\n\n${data.result}` 
        }]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to execute action.");
    } finally {
      setIsProcessingAction(false);
      if (onAiEnd) onAiEnd();
    }
  };

  const handleRunFinancialAnalyst = async () => {
    if (!documentContext?.documentId || !documentContext?.workspaceId || !getFullText) return;
    
    if (onAiStart) onAiStart();
    setIsProcessingAction(true);
    
    try {
      const fullText = await getFullText();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/ai/agents/financial-analyst`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          documentId: documentContext.documentId,
          workspaceId: documentContext.workspaceId,
          documentContent: fullText
        })
      });
      
      if (!res.ok) throw new Error("Failed to run agent");
      const data = await res.json();
      
      setMessages([...messages, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: `**Financial Analysis Report**\n\n${data.result}` 
      }]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to run Financial Analyst.");
    } finally {
      setIsProcessingAction(false);
      if (onAiEnd) onAiEnd();
    }
  };

  const handleDeepResearch = async (query?: string) => {
    const researchQuery = query || input.trim();
    if (!researchQuery) {
      toast.error('Please enter a research topic first.');
      return;
    }
    if (!documentContext?.workspaceId) {
      toast.error('Open a workspace document first to use Deep Research.');
      return;
    }

    // Add user message to chat
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: researchQuery }]);

    const steps = [
      { label: 'Planning research strategy...', done: false },
      { label: 'Searching the web for sources...', done: false },
      { label: 'Extracting & reading sources...', done: false },
      { label: 'Synthesizing findings & citations...', done: false },
      { label: 'Writing structured report...', done: false },
    ];

    setDeepResearchSteps([...steps]);
    setIsDeepResearching(true);
    if (onAiStart) onAiStart();

    // Animate steps progressively as the backend works
    const stepTimings = [600, 3000, 8000, 18000, 25000];
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    stepTimings.forEach((delay, i) => {
      const t = setTimeout(() => {
        setDeepResearchSteps(prev => prev.map((s, idx) => idx === i ? { ...s, done: true } : s));
      }, delay);
      timeouts.push(t);
    });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/ai/agents/deep-researcher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workspaceId: documentContext.workspaceId,
          documentId: documentContext.documentId || 'temp',
          query: researchQuery
        })
      });

      // Clear pending timers
      timeouts.forEach(clearTimeout);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Deep Research failed');
      }

      const data = await res.json();
      const sources: {title: string; url: string; snippet: string}[] = data.sources || [];

      // Mark all steps done
      setDeepResearchSteps(prev => prev.map(s => ({ ...s, done: true })));

      setTimeout(() => {
        setDeepResearchSources(sources);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `**Deep Research Report**\n\n${data.result}`
        }]);
        setIsDeepResearching(false);
        setDeepResearchSteps([]);
        if (onAiEnd) onAiEnd();
      }, 800);
    } catch (err: any) {
      timeouts.forEach(clearTimeout);
      console.error('[DeepResearch]', err);
      toast.error(`Deep Research failed: ${err.message}`);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Deep Research encountered an error: ${err.message}`
      }]);
      setIsDeepResearching(false);
      setDeepResearchSteps([]);
      if (onAiEnd) onAiEnd();
    }
  };

  const handleWebSearch = async () => {
    const query = input.trim();
    if (!query) return;

    const isUrl = /^https?:\/\/.+/i.test(query);

    // Add user message to chat
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: isUrl ? `🌐 Extract page: ${query}` : `🔍 Search: ${query}`
    }]);

    setIsProcessingAction(true);
    if (onAiStart) onAiStart();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/ai/inline-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'browser_search', text: query })
      });

      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      const parsed = JSON.parse(data.result);

      let content = '';
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Keyword search results
        content = `**Search Results for "${query}"**\n\n` +
          parsed.map((r: any, i: number) => `**${i + 1}. [${r.title}](${r.link})**\n${r.snippet}`).join('\n\n');
      } else if (parsed && parsed.url) {
        // URL scrape result — show full extracted content
        const badge = parsed.usedFallback ? ' ⚡ via Playwright' : '';
        content = `**[${parsed.title || parsed.url}](${parsed.url})**${badge}\n\n${parsed.content || '_No content extracted._'}`;
      } else {
        content = `No results found for "${query}".`;
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content }]);
    } catch (err: any) {
      console.error('[WebSearch]', err);
      toast.error(`Search failed: ${err.message}`);
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: 'assistant',
        content: `❌ Search failed: ${err.message}`
      }]);
    } finally {
      setIsProcessingAction(false);
      if (onAiEnd) onAiEnd();
    }
  };

  const overrideHandleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Auto-detect deep research intent — route to handleDeepResearch instead of regular chat
    const trimmed = input.trim();
    const isResearchIntent = /\b(deep\s*research|conduct\s*(in[- ]?depth|deep|comprehensive)\s*research|in[- ]?depth\s*(research|analysis)|analyze\s+.{5,}\s+(ecosystem|market|trend|landscape|comparison|performance)|research\s+(on|about|comparing|into)\b)/i.test(trimmed);
    const startsWithUrl = /^https?:\/\//i.test(trimmed);
    const hasResearchKeywordsAfterUrl = startsWithUrl && /\b(research|analyze|analysis|compare|investigate|explore|examine)\b/i.test(trimmed);

    if (isResearchIntent || hasResearchKeywordsAfterUrl) {
      handleDeepResearch();
      return;
    }

    if (getCurrentSelection) {
      const text = await getCurrentSelection();
      if (text && text.trim() !== "") {
         if (documentContext) documentContext.selectedText = text;
      }
    }
    if (getFullText) {
      const fullText = await getFullText();
      if (fullText && documentContext) {
        documentContext.documentContent = fullText;
      }
    }
    // Inject the CURRENT selectedModel into the request body dynamically,
    // because useChat's body is static and doesn't react to state changes.
    handleSubmit(e, {
      body: {
        model: selectedModel,
        context: documentContext
      }
    });
  };

  useEffect(() => {
    const handleInlineEvent = async (e: any) => {
      const { action, text, context } = e.detail;
      
      if (action === 'rewrite' && context) {
        if (onAiStart) onAiStart();
        setIsProcessingAction(true);
        try {
          const prompt = `Rewrite the following text with this instruction: "${context}".\n\nText:\n${text}`;
          await append({ id: Date.now().toString(), role: 'user', content: prompt });
        } catch (err) {
          toast.error("Failed to execute rewrite action.");
        } finally {
          setIsProcessingAction(false);
          if (onAiEnd) onAiEnd();
        }
      } else {
        handleInlineAction(action);
      }
    };
    
    window.addEventListener('vexius:inline-ai-action', handleInlineEvent);
    return () => window.removeEventListener('vexius:inline-ai-action', handleInlineEvent);
  }, [append, messages]);

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderLeft: "1px solid var(--border-color)",
        background: "var(--bg-secondary)",
        width: "320px",
        minWidth: "320px"
      }}>
      {/* Header */}
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: '#f8fafc',
        color: '#475569'
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", justifyContent: "space-between" }}>
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              background: "rgba(168, 85, 247, 0.1)",
              border: "1px solid rgba(168, 85, 247, 0.2)",
              color: "#a855f7",
              fontSize: "0.7rem",
              fontWeight: 700,
              padding: "4px 8px",
              borderRadius: "6px",
              outline: "none",
              cursor: "pointer",
              appearance: "none"
            }}
          >
            <option value="openai:gpt-4o">Vexius General</option>
            <option value="xai:grok-4.3">Vexius Creative</option>
            <option value="deepseek:deepseek-chat">Vexius Reasoning</option>
          </select>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('vexius:toggle-ai'))}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '14px', display: 'flex', alignItems: 'center' }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="custom-scrollbar" style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", gap: "12px", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
            {msg.role === "assistant" && (
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Sparkles size={12} color="#000" />
              </div>
            )}
            <div style={{
              background: msg.role === "user" ? "var(--text-primary)" : "transparent",
              color: msg.role === "user" ? "var(--bg-primary)" : "var(--text-primary)",
              padding: msg.role === "user" ? "8px 16px" : "4px 0",
              borderRadius: "8px",
              fontSize: "0.9rem",
              lineHeight: 1.5,
              maxWidth: "85%"
            }}>
              {msg.role === "user" ? (
                msg.content
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ node, ...props }) => <p style={{ margin: "0 0 8px 0" }} {...props} />,
                    ul: ({ node, ...props }) => <ul style={{ margin: "0 0 8px 0", paddingLeft: "20px" }} {...props} />,
                    ol: ({ node, ...props }) => <ol style={{ margin: "0 0 8px 0", paddingLeft: "20px" }} {...props} />,
                    li: ({ node, ...props }) => <li style={{ marginBottom: "4px" }} {...props} />,
                    table: ({ node, ...props }) => <table className="w-full text-left border-collapse my-2 text-sm" {...props} />,
                    th: ({ node, ...props }) => <th className="border-b border-gray-600 bg-gray-800/50 p-2 font-semibold" {...props} />,
                    td: ({ node, ...props }) => <td className="border-b border-gray-700/50 p-2" {...props} />,
                    pre: ({ node, ...props }) => <pre style={{ background: "var(--bg-secondary)", padding: "12px", borderRadius: "8px", overflowX: "auto", margin: "8px 0", border: "1px solid var(--border-color)", color: "var(--text-primary)" }} {...props} />,
                    code: ({ node, inline, ...props }: any) => inline 
                      ? <code style={{ background: "rgba(255, 255, 255, 0.1)", padding: "2px 4px", borderRadius: "4px", fontSize: "0.85em", color: "var(--text-primary)" }} {...props} /> 
                      : <code style={{ color: "var(--text-primary)" }} {...props} />,
                    blockquote: ({ node, ...props }) => <blockquote style={{ borderLeft: "4px solid var(--border-color)", paddingLeft: "16px", color: "var(--text-secondary)", margin: "8px 0", background: "rgba(255,255,255,0.02)", padding: "8px 16px", borderRadius: "0 8px 8px 0" }} {...props} />,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
              {msg.role === "assistant" && msg.id !== "1" && documentContext?.documentType !== 'pdf' && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => {
                      if (onApplyAction) {
                        if (documentContext?.documentType === 'spreadsheet') {
                          onApplyAction(msg.content);
                        } else {
                          let text = msg.content.replace(/^\*\*.*?\*\*\n\n/, ''); // Remove title like **Summary**
                          
                          const isHtml = /<[a-z][\s\S]*>/i.test(text);
                          
                          if (!isHtml) {
                            // Comprehensive markdown-to-HTML converter
                            const lines = text.split('\n');
                            const htmlLines: string[] = [];

                            const transform = (s: string) => s
                              .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
                              .replace(/`([^`]+)`/g, '<code>$1</code>')
                              .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
                              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.+?)\*/g, '<em>$1</em>')
                              .replace(/\[\^(\d+)\]/g, '<sup>[$1]</sup>');

                            // ── PRE-PASS: group lines into blocks ──────────────────
                            const blocks: string[] = [];
                            let i = 0;
                            while (i < lines.length) {
                              const line = lines[i];
                              // Detect markdown table: line starts with '|' and next non-empty line is a separator
                              if (/^\|/.test(line)) {
                                let tableLines: string[] = [];
                                while (i < lines.length && /^\|/.test(lines[i])) {
                                  tableLines.push(lines[i]);
                                  i++;
                                }
                                // Build HTML table
                                const [headerLine, separatorLine, ...bodyLines] = tableLines;
                                if (separatorLine && /^[\s|:-]+$/.test(separatorLine)) {
                                  const parseRow = (row: string) =>
                                    row.split('|').filter((_, ci) => ci > 0 && ci < row.split('|').length - 1).map(c => c.trim());
                                  const headers = parseRow(headerLine);
                                  const theadHtml = `<thead><tr>${headers.map(h => `<th style="border:1px solid #334155;padding:8px 12px;background:#1e293b;font-weight:600;text-align:left;white-space:nowrap">${transform(h)}</th>`).join('')}</tr></thead>`;
                                  const tbodyHtml = bodyLines.map(row => {
                                    const cells = parseRow(row);
                                    return `<tr>${cells.map(c => `<td style="border:1px solid #334155;padding:8px 12px;vertical-align:top">${transform(c)}</td>`).join('')}</tr>`;
                                  }).join('');
                                  blocks.push(`<table style="border-collapse:collapse;width:100%;margin:12px 0;font-size:0.85em">${theadHtml}<tbody>${tbodyHtml}</tbody></table>`);
                                } else {
                                  // Not a real table, add as raw lines
                                  tableLines.forEach(tl => blocks.push(tl));
                                }
                              } else {
                                blocks.push(line);
                                i++;
                              }
                            }

                            // ── MAIN PASS: process non-table blocks line by line ────
                            let inList = false;
                            let inOrderedList = false;

                            for (const block of blocks) {
                              // Already-rendered HTML block (e.g. our tables)
                              if (/^<table/.test(block)) {
                                if (inList) { htmlLines.push('</ul>'); inList = false; }
                                if (inOrderedList) { htmlLines.push('</ol>'); inOrderedList = false; }
                                htmlLines.push(block);
                                continue;
                              }

                              const isListItem = /^[-*+] /.test(block);
                              const isOrderedItem = /^\d+\.\s/.test(block);

                              if (inList && !isListItem) { htmlLines.push('</ul>'); inList = false; }
                              if (inOrderedList && !isOrderedItem) { htmlLines.push('</ol>'); inOrderedList = false; }

                              if (/^#### /.test(block)) { htmlLines.push(`<h4>${transform(block.slice(5))}</h4>`); continue; }
                              if (/^### /.test(block)) { htmlLines.push(`<h3>${transform(block.slice(4))}</h3>`); continue; }
                              if (/^## /.test(block)) { htmlLines.push(`<h2>${transform(block.slice(3))}</h2>`); continue; }
                              if (/^# /.test(block)) { htmlLines.push(`<h1>${transform(block.slice(2))}</h1>`); continue; }
                              if (/^[-*_]{3,}$/.test(block.trim())) { htmlLines.push('<hr>'); continue; }
                              if (/^> /.test(block)) { htmlLines.push(`<blockquote><p>${transform(block.slice(2))}</p></blockquote>`); continue; }

                              // Footnote definition: [^n]: text
                              const fnMatch = block.match(/^\[\^(\d+)\]: (.*)/);
                              if (fnMatch) {
                                htmlLines.push(`<p style="font-size:0.8em;color:#94a3b8;margin:2px 0"><sup>[${fnMatch[1]}]</sup> ${transform(fnMatch[2])}</p>`);
                                continue;
                              }

                              if (isListItem) {
                                if (!inList) { htmlLines.push('<ul>'); inList = true; }
                                htmlLines.push(`<li>${transform(block.replace(/^[-*+] /, ''))}</li>`);
                                continue;
                              }
                              if (isOrderedItem) {
                                if (!inOrderedList) { htmlLines.push('<ol>'); inOrderedList = true; }
                                htmlLines.push(`<li>${transform(block.replace(/^\d+\.\s/, ''))}</li>`);
                                continue;
                              }
                              if (block.trim() === '') { htmlLines.push(''); continue; }
                              htmlLines.push(`<p>${transform(block)}</p>`);
                            }

                            if (inList) htmlLines.push('</ul>');
                            if (inOrderedList) htmlLines.push('</ol>');
                            text = htmlLines.join('\n');
                          } else {
                            text = text.replace(/>\s+</g, '><');
                          }
                          onApplyAction(text);
                        }
                      }
                    }} 
                    style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <CheckCircle size={14} /> Apply to {documentContext?.documentType === 'spreadsheet' ? 'Sheet' : documentContext?.documentType === 'presentation' ? 'Slide' : 'Document'}
                  </button>
                  {documentContext?.documentType === 'presentation' && (
                    <button 
                      onClick={() => {
                        if (onApplyAction) {
                          let text = msg.content;
                          const jsonMatch = text.match(/```(?:html|json)?\s*([\s\S]*?)```/);
                          if (jsonMatch) text = jsonMatch[1];
                          onApplyAction(`<!-- ACTION:NEW_SLIDE -->\n${text}`);
                        }
                      }}
                      style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '16px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                    >
                      <CheckCircle size={14} /> Insert as New Slide
                    </button>
                  )}
                  {documentContext?.documentType === 'presentation' && (
                    <button 
                      onClick={() => {
                        if (onApplyAction) {
                          let text = msg.content;
                          const jsonMatch = text.match(/```(?:html|json)?\s*([\s\S]*?)```/);
                          if (jsonMatch) text = jsonMatch[1];
                          onApplyAction(`<!-- ACTION:REPLACE_SLIDE -->\n${text}`);
                        }
                      }}
                      style={{ padding: '6px 12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '16px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                    >
                      <CheckCircle size={14} /> Replace Current Slide
                    </button>
                  )}
                  {documentContext?.documentType === 'presentation' && (
                    <button 
                      onClick={() => {
                        if (onApplyAction) {
                          let text = msg.content;
                          onApplyAction(`<!-- ACTION:SPEAKER_NOTES -->\n${text}`);
                        }
                      }}
                      style={{ padding: '6px 12px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '16px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                    >
                      <CheckCircle size={14} /> Apply to Notes
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {(isLoading || isProcessingAction) && !isDeepResearching && (
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
               <Sparkles size={12} color="#000" />
            </div>
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", alignSelf: "center" }}>
              Thinking...
            </div>
          </div>
        )}
        {isDeepResearching && deepResearchSteps.length > 0 && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={12} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b5cf6', marginBottom: '8px', letterSpacing: '0.05em' }}>DEEP RESEARCH IN PROGRESS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {deepResearchSteps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                      background: step.done ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                      border: `1.5px solid ${step.done ? '#10b981' : 'rgba(148, 163, 184, 0.3)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.4s ease'
                    }}>
                      {step.done
                        ? <CheckCircle size={10} color="#10b981" />
                        : i === deepResearchSteps.findIndex(s => !s.done)
                          ? <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6', animation: 'pulse 1s infinite' }} />
                          : null
                      }
                    </div>
                    <span style={{
                      color: step.done ? 'var(--text-primary)' : i === deepResearchSteps.findIndex(s => !s.done) ? '#a78bfa' : 'var(--text-secondary)',
                      fontWeight: step.done ? 500 : i === deepResearchSteps.findIndex(s => !s.done) ? 600 : 400,
                      transition: 'all 0.3s ease'
                    }}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-color)" }}>
        
        {/* Action buttons — Deep Research & Search Web */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <button
            onClick={() => handleDeepResearch()}
            disabled={isLoading || isProcessingAction || isDeepResearching || !input.trim()}
            title="Run multi-step deep web research on your query"
            style={{
              background: input.trim() ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))' : 'rgba(148, 163, 184, 0.05)',
              color: input.trim() ? '#818cf8' : 'var(--text-secondary)',
              border: `1px solid ${input.trim() ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-color)'}`,
              padding: '5px 10px', borderRadius: '16px', fontSize: '11px', fontWeight: 600,
              cursor: (isLoading || isProcessingAction || isDeepResearching || !input.trim()) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px',
              transition: 'all 0.2s ease', whiteSpace: 'nowrap'
            }}
          >
            <BookOpen size={11} /> Deep Research
          </button>
          <button
            onClick={() => handleWebSearch()}
            disabled={isLoading || isProcessingAction || isDeepResearching || !input.trim()}
            title="Search the web or scrape a URL"
            style={{
              background: input.trim() ? 'rgba(20, 184, 166, 0.1)' : 'rgba(148, 163, 184, 0.05)',
              color: input.trim() ? '#2dd4bf' : 'var(--text-secondary)',
              border: `1px solid ${input.trim() ? 'rgba(20, 184, 166, 0.3)' : 'var(--border-color)'}`,
              padding: '5px 10px', borderRadius: '16px', fontSize: '11px', fontWeight: 600,
              cursor: (isLoading || isProcessingAction || isDeepResearching || !input.trim()) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px',
              transition: 'all 0.2s ease', whiteSpace: 'nowrap'
            }}
          >
            <Search size={11} /> Search Web
          </button>
        </div>

        {/* Quick Actions for Presentation */}
        {documentContext?.documentType === 'presentation' && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', paddingBottom: '4px' }}>
            <button 
              onClick={() => handleInlineAction('generate_slide')}
              disabled={isLoading || isProcessingAction}
              style={{
                background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.2)',
                padding: '6px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <Sparkles size={12} /> Generate Slide
            </button>
            <button 
              onClick={() => handleInlineAction('text_to_bullets')}
              disabled={isLoading || isProcessingAction}
              style={{
                background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)',
                padding: '6px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <Type size={12} /> Text to Bullets
            </button>
            <button 
              onClick={() => handleInlineAction('speaker_notes')}
              disabled={isLoading || isProcessingAction}
              style={{
                background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)',
                padding: '6px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <Edit3 size={12} /> Speaker Notes
            </button>
          </div>
        )}

        {/* Quick Actions for PDF */}
        {documentContext?.documentType === 'pdf' && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', paddingBottom: '4px' }}>
            <button 
              onClick={() => handleInlineAction('summarize_pdf')}
              disabled={isLoading || isProcessingAction}
              style={{
                background: 'rgba(168, 85, 247, 0.1)',
                color: '#a855f7',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Sparkles size={12} />
              Summarize PDF
            </button>
            <button 
              onClick={() => {
                if (onAiStart) onAiStart();
                setIsProcessingAction(true);
                const prompt = "Extract and list the key points of this document.";
                append({ id: Date.now().toString(), role: 'user', content: prompt })
                  .finally(() => {
                    setIsProcessingAction(false);
                    if (onAiEnd) onAiEnd();
                  });
              }}
              disabled={isLoading || isProcessingAction}
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Sparkles size={12} />
              Key Points
            </button>
          </div>
        )}

        {/* Quick Actions for Spreadsheet */}
        {(documentContext?.documentType === 'spreadsheet' || documentContext?.documentType === 'xlsx') && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', paddingBottom: '4px' }}>
            <button 
              type="button"
              onClick={handleRunFinancialAnalyst}
              disabled={isLoading || isProcessingAction}
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <BarChart size={12} />
              Audit Formulas
            </button>
          </div>
        )}

        <form onSubmit={overrideHandleSubmit} style={{
          display: "flex",
          background: "var(--bg-primary)",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          overflow: "hidden",
          transition: "border-color 0.2s"
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = "var(--text-secondary)"}
        onBlur={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}
        >
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask Vexius AI for help..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              padding: "12px 16px",
              color: "var(--text-primary)",
              outline: "none",
              fontSize: "0.9rem"
            }}
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              background: "transparent",
              border: "none",
              padding: "0 16px",
              cursor: (isLoading || !input.trim()) ? "not-allowed" : "pointer",
              color: (isLoading || !input.trim()) ? "var(--text-secondary)" : "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
