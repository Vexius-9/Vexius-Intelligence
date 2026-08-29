"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Database, Lock, Globe, Cpu, ArrowRight, Coins } from "lucide-react";
import Image from "next/image";
import { IsometricStack } from "@/components/ui/IsometricStack";
import Link from "next/link";
import logoImg from "../../public/logo.png";
import { FluidBackground } from "@/components/ui/FluidBackground";

export default function Home() {
  const [activeEditorTab, setActiveEditorTab] = useState(0);

  const editorsData = [
    { 
      name: "Vexius Docs", 
      img: "/img/docs-v2.png", 
      desc: "Collaborative word processing with real-time AI assistance, custom agent actions, and Deep Research modes.",
      features: ["Live Multiplayer Editing", "AI Drafting & Deep Research Synthesis", "Markdown Support", "Structural Provenance Logging"]
    },
    { 
      name: "Vexius Sheets", 
      img: "/img/sheet-v2.png", 
      desc: "Powerful spreadsheets with AI-driven formulas, error auditing, and target calculations.",
      features: ["AI Formula Generation & Audit", "Cell Error Verification (#REF!)", "Scenario Comparison Modes", "Automatic Assumption Recalls"]
    },
    { 
      name: "Vexius Slides", 
      img: "/img/slides-v2.png", 
      desc: "Dynamic presentations generated instantly from prompts using custom template styles.",
      features: ["Prompt to Presentation", "Web3 Themes & Layout Adapters", "PDF Export"]
    },
    { 
      name: "Vexius PDF", 
      img: "/img/pdf-v2.png", 
      desc: "Secure PDF viewing, annotation, and cryptographic signatures.",
      features: ["Digital Signatures", "Annotations", "High Fidelity Rendering", "Audit Log Records"]
    }
  ];

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden", color: "white" }}>
      <FluidBackground />
      
      {/* Navigation */}
      <nav className="nav-bar">
        <div className="nav-content">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Image src={logoImg} alt="Vexius Logo" width={24} height={24} />
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
          position: "relative",
          zIndex: 5
        }}
      >
        <section
          style={{
            position: "relative",
            minHeight: "calc(100vh - 80px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "120px 6vw 60px 6vw",
            width: "100%",
          }}
        >
          <div className="hero-container" style={{ display: "flex", flexWrap: "wrap", width: "100%", maxWidth: "1200px", gap: "64px", alignItems: "center", position: "relative" }}>
            
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ flex: "1 1 500px", textAlign: "left", maxWidth: "650px" }}
            >
              <div className="hero-content" style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                <div
                  className="ios-glass-pill"
                  style={{
                    display: "inline-block",
                    padding: "6px 16px",
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Introducing Vexius Engine 2.0
                </div>

                {process.env.NEXT_PUBLIC_VEXIUS_CA && (
                  <a href={`https://pump.fun/coin/${process.env.NEXT_PUBLIC_VEXIUS_CA}`} target="_blank" rel="noopener noreferrer" className="ios-glass-pill" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", color: "var(--text-primary)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 500 }}>
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
                Instantly query across all your workspace documents. Our infrastructure indexes your data in real-time, enabling semantic search with sub-second latency powered by Vexius embeddings.
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
              <h3 className="text-bento-title">Smart Model Router</h3>
              <p className="text-bento-desc">
                Dynamically select the optimal Vexius AI model depending on task complexity, latency targets, and context size.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
              className="bento-box" style={{ gridColumn: "span 2" }}
            >
              <h3 className="text-bento-title">Workspace Memory & RLS</h3>
              <p className="text-bento-desc">
                Store explicit targets, preferences, and board decisions. RLS policies guarantee total isolation of facts and documents at the DB level.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
              className="bento-box"
            >
              <h3 className="text-bento-title">Scheduled Automation</h3>
              <p className="text-bento-desc">
                Configure recurrent research routines and automated document generation templates utilizing our background Redis task queue.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
              className="bento-box"
            >
              <h3 className="text-bento-title">Verified Provenance</h3>
              <p className="text-bento-desc">
                Audit every document change dynamically. Keep track of what Vexius model executed what action, total tokens spent, and verified web sources.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
              className="bento-box" style={{ gridColumn: "span 2" }}
            >
              <h3 className="text-bento-title">Agent SDK & Marketplace</h3>
              <p className="text-bento-desc">
                Build custom agent plugins using the <code>@vexius/sdk</code> library. Publish manifests directly to the secure marketplace registry for others to load.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Editors Preview Section */}
        <section id="editors" style={{ width: "100%", padding: "120px 24px", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", background: "transparent" }}>
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
                  className={activeEditorTab === i ? "ios-glass-pill" : ""}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "100px",
                    border: activeEditorTab === i ? undefined : "1px solid transparent",
                    background: activeEditorTab === i ? undefined : "transparent",
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
              <div style={{ background: "transparent", padding: "0", width: "100%", display: "flex", justifyContent: "center" }}>
                <Image src={editorsData[activeEditorTab].img} alt={editorsData[activeEditorTab].name} width={1200} height={800} style={{ width: "100%", height: "auto", display: "block" }} />
              </div>
            </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" style={{ width: "100%", padding: "120px 24px", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", background: "transparent" }}>
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
              <Image src={logoImg} alt="Vexius Logo" width={16} height={16} />
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
