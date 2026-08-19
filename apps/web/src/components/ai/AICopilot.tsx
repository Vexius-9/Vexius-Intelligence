"use client";

import React, { useState } from "react";
import { Send, Bot, Sparkles } from "lucide-react";

export function AICopilot() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<{role: "user" | "assistant", content: string}[]>([
    { role: "assistant", content: "I am your Vexius AI Copilot. How can I help you write today?" }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!prompt.trim() || loading) return;

    const userMessage = prompt;
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setPrompt("");
    setLoading(true);

    try {
      // Connect to the API running on port 8080 (Grok/DeepSeek gateway)
      // This is a placeholder fetch. Ensure you have a corresponding endpoint in apps/api.
      // e.g., POST http://localhost:8080/ai/chat
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = localStorage.getItem("vexius_token");
      
      const res = await fetch(`${apiUrl}/ai/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ prompt: userMessage }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to communicate with AI Backend");
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "AI Response (Mock)" }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I am unable to connect to the backend right now. Is the API running on port 8080?" }]);
    } finally {
      setLoading(false);
    }
  };

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
        <div style={{ marginLeft: "auto", background: "rgba(168, 85, 247, 0.1)", padding: "2px 8px", borderRadius: "100px", color: "#a855f7", fontSize: "0.7rem", fontWeight: 700 }}>
          Grok/DeepSeek
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
        {loading && (
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
        <div style={{
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
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask AI for help..."
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
            onClick={handleSend}
            disabled={loading || !prompt.trim()}
            style={{
              background: "transparent",
              border: "none",
              padding: "0 16px",
              cursor: (loading || !prompt.trim()) ? "not-allowed" : "pointer",
              color: (loading || !prompt.trim()) ? "var(--text-secondary)" : "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
