"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      {/* Navigation */}
      <nav className="nav-bar">
        <div className="nav-content">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                background: "#fff",
                borderRadius: "4px",
              }}
            />
            <span style={{ fontWeight: 600, fontSize: "1.05rem", letterSpacing: "-0.01em" }}>
              Vexius
            </span>
          </div>
          
          <div style={{ display: "flex", gap: "24px", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
            <Link href="#features" style={{ transition: "color 0.2s" }} onMouseOver={(e) => (e.currentTarget.style.color = "#fff")} onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}>Features</Link>
            <Link href="#security" style={{ transition: "color 0.2s" }} onMouseOver={(e) => (e.currentTarget.style.color = "#fff")} onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}>Security</Link>
            <Link href="#enterprise" style={{ transition: "color 0.2s" }} onMouseOver={(e) => (e.currentTarget.style.color = "#fff")} onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}>Enterprise</Link>
          </div>

          <button className="btn-secondary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "100vh",
          padding: "160px 24px 80px 24px",
          textAlign: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ maxWidth: "800px", width: "100%" }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "100px",
              border: "1px solid var(--border-color)",
              background: "rgba(255,255,255,0.02)",
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              marginBottom: "32px",
              letterSpacing: "-0.01em",
            }}
          >
            Introducing Vexius Engine 2.0
          </div>
          
          <h1 className="heading-hero" style={{ marginBottom: "24px" }}>
            Document collaboration, <br />
            engineered for speed.
          </h1>
          
          <p
            style={{
              fontSize: "1.1rem",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              marginBottom: "48px",
              maxWidth: "500px",
              margin: "0 auto 48px auto",
              letterSpacing: "-0.01em",
            }}
          >
            Vexius brings deep reasoning directly into your workspace. No context switching, just seamless AI integration.
          </p>
          
          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <button className="btn-primary">
              Start Building
              <ChevronRight size={16} />
            </button>
            <button className="btn-secondary">
              Documentation
            </button>
          </div>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="bento-grid"
          style={{ marginTop: "80px" }}
        >
          <div className="bento-box" style={{ gridColumn: "span 2" }}>
            <h3 className="text-bento-title">Native RAG Architecture</h3>
            <p className="text-bento-desc">
              Instantly query across all your workspace documents. Our infrastructure indexes your data in real-time, enabling semantic search with sub-second latency.
            </p>
          </div>
          
          <div className="bento-box">
            <h3 className="text-bento-title">Deep Integration</h3>
            <p className="text-bento-desc">
              AI actions that format and write directly into your canvas.
            </p>
          </div>

          <div className="bento-box">
            <h3 className="text-bento-title">Enterprise Security</h3>
            <p className="text-bento-desc">
              Isolated RLS security, audit logs, and token tracking out of the box.
            </p>
          </div>
          
          <div className="bento-box" style={{ gridColumn: "span 2" }}>
            <h3 className="text-bento-title">Dual-LLM Engine</h3>
            <p className="text-bento-desc">
              Powered by Grok (T2) and DeepSeek (T1) for complex reasoning, and OpenAI solely for high-dimensional embeddings. Optimized for cost and performance.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
