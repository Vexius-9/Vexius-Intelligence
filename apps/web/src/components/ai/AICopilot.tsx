"use client";

import React, { useState, useEffect } from "react";
import { Send, Bot, Sparkles, ChevronDown, Edit3, Type, CheckCircle, BarChart } from "lucide-react";
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
    body: {
      model: selectedModel,
      context: documentContext
    },
    initialMessages: [
      { id: "1", role: "assistant", content: "I am Vexius Intelligence. How can I help you today?" }
    ]
  });

  const handleInlineAction = async (action: 'rewrite' | 'summarize' | 'grammar' | 'generate_formula' | 'explain_formula' | 'slide_structure' | 'summarize_pdf') => {
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
        if (action === 'summarize_pdf' || action === 'summarize' || action === 'slide_structure') {
          text = documentContext?.documentContent || "";
        }
        
        // For grammar, rewrite, and formula generation, text is absolutely REQUIRED.
        if ((!text || text.trim() === "") && ['grammar', 'rewrite', 'generate_formula'].includes(action)) {
          toast.error("ONLYOFFICE membatasi akses teks dari luar. Silakan gunakan tab 'Plugins' -> 'ChatGPT/AI' bawaan ONLYOFFICE di toolbar atas untuk aksi ini (Anda bisa memasukkan API Key di sana).", { duration: 6000 });
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

  const overrideHandleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
    handleSubmit(e);
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
            onChange={(e) => setSelectedModel(e.target.value as "t1" | "t2")}
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
            <option value="openai:gpt-4o">OpenAI GPT-4o</option>
            <option value="xai:grok-beta">X.AI Grok</option>
            <option value="deepseek:deepseek-chat">DeepSeek</option>
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
      <div style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px" }}>
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
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
              {msg.role === "assistant" && msg.id !== "1" && documentContext?.documentType !== 'pdf' && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => {
                      if (onApplyAction) {
                        if (documentContext?.documentType === 'spreadsheet') {
                          onApplyAction(msg.content);
                        } else {
                          let text = msg.content.replace(/^\*\*.*?\*\*\n\n/, ''); // Remove title like **Summary**
                          
                          // If it looks like HTML, don't wrap it in <p> tags
                          const isHtml = /<[a-z][\s\S]*>/i.test(text);
                          
                          if (!isHtml) {
                            // Basic markdown to HTML
                            text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                            text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
                            text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
                            text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
                            text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');
                            // Handle paragraphs, avoiding empty ones
                            text = text.split('\n\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
                          } else {
                            // Sanitize HTML by removing whitespace between tags
                            // This prevents ProseMirror/Tiptap from wrapping whitespace text nodes into dummy <td> or <tr> elements
                            text = text.replace(/>\s+</g, '><');
                          }
                          onApplyAction(text);
                        }
                      }
                    }} 
                    style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                    <CheckCircle size={14} /> Apply to {documentContext?.documentType === 'spreadsheet' ? 'Sheet' : documentContext?.documentType === 'presentation' ? 'Slide' : 'Document'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {(isLoading || isProcessingAction) && (
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
               <Sparkles size={12} color="#000" />
            </div>
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", alignSelf: "center" }}>
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-color)" }}>
        
        {/* Quick Actions for PDF */}
        {documentContext?.documentType === 'pdf' && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
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
            placeholder={`Ask ${selectedModel === "t1" ? "DeepSeek" : "Grok"} for help...`}
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
