"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Database, Lock, Globe, Cpu, ArrowRight, Coins } from "lucide-react";
import Image from "next/image";
import { IsometricStack } from "@/components/ui/IsometricStack";
import Link from "next/link";

export default function Home() {
  const [activeEditorTab, setActiveEditorTab] = useState(0);

  const editorsData = [
    { 
      name: "Vexius Docs", 
      img: "/img/docs.png", 
      desc: "Collaborative word processing with real-time AI assistance.",
      features: ["Live Multiplayer Editing", "AI Drafting & Summarization", "Markdown Support"]
    },
    { 
      name: "Vexius Sheets", 
      img: "/img/sheet.png", 
      desc: "Powerful spreadsheets with AI-driven formulas and data analysis.",
      features: ["AI Formula Generation", "Data Validation", "Large Dataset Support"]
    },
    { 
      name: "Vexius Slides", 
      img: "/img/slides.png", 
      desc: "Dynamic presentations generated instantly from prompts.",
      features: ["Prompt to Presentation", "Web3 Themes", "PDF Export"]
    },
    { 
      name: "Vexius PDF", 
      img: "/img/pdf.png", 
      desc: "Secure PDF viewing, annotation, and cryptographic signatures.",
      features: ["Digital Signatures", "Annotations", "High Fidelity Rendering"]
    }
  ];

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      {/* Navigation */}
      <nav className="nav-bar">
        <div className="nav-content">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Image src="/logo.png" alt="Vexius Logo" width={24} height={24} />
            <span style={{ fontWeight: 600, fontSize: "1.05rem", letterSpacing: "-0.01em" }}>
              Vexius
            </span>
          </div>
          
          <div className="nav-links" style={{ display: "flex", gap: "32px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            <Link href="/docs" className="hover-link">Docs</Link>
            <Link href="#features" className="hover-link">Features</Link>
            <Link href="#security" className="hover-link">Security</Link>
            <Link href="#enterprise" className="hover-link">Enterprise</Link>
            <Link href="https://x.com/vexiusint" target="_blank" rel="noopener noreferrer" className="hover-link" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </Link>
          </div>

          <Link href="/login" className="btn-secondary" style={{ padding: "8px 16px", fontSize: "0.85rem", display: "inline-block", textAlign: "center" }}>
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        <section
          style={{
            position: "relative",
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "160px 24px 80px 24px",
            width: "100%",
            overflow: "hidden",
          }}
        >
          {/* Ambient Glow (Right) */}
          <motion.div
            animate={{
              x: [0, 60, -30, 0],
              y: [0, 40, -50, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              position: "absolute",
              top: "20%",
              right: "10%",
              width: "600px",
              height: "600px",
              background: "radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(0,0,0,0) 70%)",
              filter: "blur(80px)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* Ambient Glow (Top Left) */}
          <motion.div
            animate={{
              x: [0, -50, 40, 0],
              y: [0, -30, 60, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              position: "absolute",
              top: "-10%",
              left: "-10%",
              width: "500px",
              height: "500px",
              background: "radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(0,0,0,0) 70%)",
              filter: "blur(80px)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* Grid Pattern */}
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
            pointerEvents: "none",
            zIndex: 0,
          }} />

          <div className="hero-container" style={{ display: "flex", flexWrap: "wrap", width: "100%", maxWidth: "1200px", gap: "64px", alignItems: "center", position: "relative", zIndex: 1 }}>
            
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ flex: "1 1 400px", textAlign: "left" }}
            >
              <div className="hero-content" style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                <div
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: "100px",
                    border: "1px solid var(--border-color)",
                    background: "rgba(255,255,255,0.02)",
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Introducing Vexius Engine 2.0
                </div>

                {process.env.NEXT_PUBLIC_VEXIUS_CA && (
                  <a href={`https://pump.fun/coin/${process.env.NEXT_PUBLIC_VEXIUS_CA}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(168, 85, 247, 0.1)", border: "1px solid rgba(168, 85, 247, 0.2)", padding: "4px 12px", borderRadius: "100px", color: "#a855f7", textDecoration: "none", fontSize: "0.85rem", fontWeight: 500, transition: "all 0.2s" }} onMouseOver={(e) => { e.currentTarget.style.background = "rgba(168, 85, 247, 0.2)"; e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.4)"; }} onMouseOut={(e) => { e.currentTarget.style.background = "rgba(168, 85, 247, 0.1)"; e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.2)"; }}>
                    <Coins size={14} />
                    CA: {process.env.NEXT_PUBLIC_VEXIUS_CA}
                  </a>
                )}
              </div>
              
              <h1 className="heading-hero hero-text-container" style={{ marginBottom: "24px" }}>
                Document collaboration, <br />
                engineered for speed.
              </h1>
              
              <p
                className="hero-text-container"
                style={{
                  fontSize: "1.1rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  marginBottom: "48px",
                  maxWidth: "500px",
                  letterSpacing: "-0.01em",
                  margin: "0 auto 48px auto",
                }}
              >
                Vexius brings deep reasoning directly into your workspace. No context switching, just seamless AI integration.
              </p>
              
              <div className="hero-buttons" style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <Link href="/login" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  Start Building
                  <ChevronRight size={16} />
                </Link>
                <Link href="/docs" className="btn-secondary" style={{ display: "inline-block", textAlign: "center", padding: "12px 24px" }}>
                  Documentation
                </Link>
              </div>


            </motion.div>

            {/* Right Content - Isometric Stack */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              style={{ flex: "1 1 400px", display: "flex", justifyContent: "center" }}
            >
              <IsometricStack />
            </motion.div>

          </div>
        </section>

        {/* Features Section */}
        <section id="features" style={{ width: "100%", maxWidth: "1200px", padding: "120px 24px" }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ textAlign: "center", marginBottom: "80px" }}
          >
            <h2 style={{ fontSize: "2.5rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: "16px" }}>
              Built for complex workflows.
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "500px", margin: "0 auto" }}>
              Everything you need to scale intelligent document processing without the overhead.
            </p>
          </motion.div>

          {/* Bento Grid */}
          <div className="bento-grid">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              className="bento-box" style={{ gridColumn: "span 2" }}
            >
              <h3 className="text-bento-title">Native RAG Architecture</h3>
              <p className="text-bento-desc">
                Instantly query across all your workspace documents. Our infrastructure indexes your data in real-time, enabling semantic search with sub-second latency powered by OpenAI embeddings.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              className="bento-box"
            >
              <h3 className="text-bento-title">Vexius Native Engine</h3>
              <p className="text-bento-desc">
                Proprietary intelligent editors built from the ground up for speed, seamless AI integration, and unmatched flexibility.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
              className="bento-box"
            >
              <h3 className="text-bento-title">Dual-LLM Engine</h3>
              <p className="text-bento-desc">
                Powered by Grok (T2) and DeepSeek (T1) for complex reasoning. Smart routing optimizes for both cost and speed.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
              className="bento-box" style={{ gridColumn: "span 2" }}
            >
              <h3 className="text-bento-title">Workspace Isolation</h3>
              <p className="text-bento-desc">
                Every document belongs to a strictly isolated workspace, ensuring complete separation of concerns and data privacy.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Editors Preview Section */}
        <section id="editors" style={{ width: "100%", padding: "120px 24px", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ marginBottom: "64px" }}
            >
              <h2 style={{ fontSize: "2.5rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: "16px" }}>
                A complete suite for every document.
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
                Whether you're drafting a memo, crunching numbers, presenting ideas, or signing contracts, Vexius has an intelligent editor for it.
              </p>
            </motion.div>

            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "40px", flexWrap: "wrap" }}>
              {editorsData.map((editor, i) => (
                <button
                  key={i}
                  onClick={() => setActiveEditorTab(i)}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "100px",
                    border: activeEditorTab === i ? "1px solid #a855f7" : "1px solid var(--border-color)",
                    background: activeEditorTab === i ? "rgba(168, 85, 247, 0.1)" : "transparent",
                    color: activeEditorTab === i ? "#fff" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    transition: "all 0.2s ease"
                  }}
                >
                  {editor.name}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div 
                key={activeEditorTab}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="bento-box"
                style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxWidth: "1000px", margin: "0 auto" }}
              >
              <div style={{ padding: "32px", borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                <h3 className="text-bento-title" style={{ marginBottom: "12px" }}>{editorsData[activeEditorTab].name}</h3>
                <p className="text-bento-desc" style={{ marginBottom: "24px" }}>{editorsData[activeEditorTab].desc}</p>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  {editorsData[activeEditorTab].features.map((feat, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)", fontSize: "0.9rem", background: "rgba(255,255,255,0.05)", padding: "8px 16px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a855f7" }} />
                      {feat}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "#0f172a", padding: "0", width: "100%", display: "flex", justifyContent: "center" }}>
                <Image src={editorsData[activeEditorTab].img} alt={editorsData[activeEditorTab].name} width={1200} height={800} style={{ width: "100%", height: "auto", display: "block" }} />
              </div>
            </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" style={{ width: "100%", padding: "120px 24px", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "64px", alignItems: "center" }}>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ flex: "1 1 400px" }}
            >
              <h2 style={{ fontSize: "2.5rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: "24px" }}>
                Enterprise-grade security by default.
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", lineHeight: 1.6, marginBottom: "32px" }}>
                We do not compromise on security. Vexius Engine uses PostgreSQL Row Level Security (RLS) to guarantee that users can only access their own workspace data at the database level.
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  "Immutable Audit Logging for all actions.",
                  "Strict API Throttling & Rate Limiting.",
                  "Comprehensive AI Token Tracking per Workspace.",
                  "Zero-Trust Architecture via Supabase Auth."
                ].map((item, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-primary)", fontSize: "0.95rem" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a855f7" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              style={{ flex: "1 1 400px" }}
            >
              {/* Mock Code Block UI */}
              <div className="bento-box" style={{ padding: "0", background: "#000" }}>
                <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", gap: "8px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
                </div>
                <div style={{ padding: "24px", fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <span style={{ color: "#a855f7" }}>CREATE POLICY</span> "Isolated Workspace Access"<br />
                  <span style={{ color: "#a855f7" }}>ON</span> documents<br />
                  <span style={{ color: "#a855f7" }}>FOR ALL</span><br />
                  <span style={{ color: "#a855f7" }}>USING</span> (workspace_id <span style={{ color: "#a855f7" }}>IN</span> (<br />
                  &nbsp;&nbsp;<span style={{ color: "#a855f7" }}>SELECT</span> workspace_id <span style={{ color: "#a855f7" }}>FROM</span> members<br />
                  &nbsp;&nbsp;<span style={{ color: "#a855f7" }}>WHERE</span> user_id <span style={{ color: "#a855f7" }}>=</span> auth.uid()<br />
                  ));
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Enterprise CTA */}
        <section id="enterprise" style={{ width: "100%", maxWidth: "800px", margin: "0 auto", padding: "160px 24px", textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h2 style={{ fontSize: "3rem", fontWeight: 600, letterSpacing: "-0.04em", marginBottom: "24px" }}>
              Ready for the intelligence era?
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginBottom: "48px" }}>
              Deploy Vexius Intelligence Suite on your own infrastructure or let us manage it for you. Perfect for high-compliance environments.
            </p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
              <button className="btn-primary" style={{ padding: "16px 32px" }}>
                Contact Sales
              </button>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer style={{ width: "100%", borderTop: "1px solid var(--border-color)", padding: "48px 24px", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "var(--text-primary)" }}>
              <Image src="/logo.png" alt="Vexius Logo" width={16} height={16} />
              Vexius
            </div>
            <div style={{ display: "flex", gap: "24px" }}>
              <Link href="/docs" className="hover-link">Documentation</Link>
              <Link href="https://x.com/vexiusint" target="_blank" rel="noopener noreferrer" className="hover-link" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
