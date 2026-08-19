"use client";

import React, { useState, useEffect } from "react";
import { Send, Bot, Sparkles, ChevronDown } from "lucide-react";
import { useChat } from "ai/react";

interface AICopilotProps {
  documentContext?: {
    selectedText?: string;
    documentTitle?: string;
    documentContent?: string;
  };
}

export function AICopilot({ documentContext }: AICopilotProps) {
  const [selectedModel, setSelectedModel] = useState<"t1" | "t2">("t1"); // t1 = DeepSeek, t2 = Grok
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    setToken(localStorage.getItem("vexius_token") || "");
  }, []);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: `${process.env.NEXT_PUBLIC_API_URL}/ai/chat`,
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: {
      model: selectedModel,
      context: documentContext
    },
    initialMessages: [
      { id: "1", role: "assistant", content: "I am your Vexius AI Copilot. How can I help you write today?" }
    ]
  });

  return (
    <div style={{
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
        gap: "12px"
      }}>
        <div style={{
          width: "28px", height: "28px", background: "rgba(255,255,255,0.1)",
          borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Bot size={16} color="#fff" />
        </div>
        <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Copilot</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
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
            <option value="t1">DeepSeek (T1)</option>
            <option value="t2">Grok (T2)</option>
          </select>
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
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
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
        <form onSubmit={handleSubmit} style={{
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
