"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight, Database, Lock, Globe, Cpu, ArrowRight } from "lucide-react";
import Image from "next/image";
import { IsometricStack } from "@/components/ui/IsometricStack";
import Link from "next/link";

export default function Home() {
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
              
              <h1 className="heading-hero" style={{ marginBottom: "24px", textAlign: "left" }}>
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
                  letterSpacing: "-0.01em",
                }}
              >
                Vexius brings deep reasoning directly into your workspace. No context switching, just seamless AI integration.
              </p>
              
              <div style={{ display: "flex", gap: "16px", justifyContent: "flex-start" }}>
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
              <h3 className="text-bento-title">ONLYOFFICE Core</h3>
              <p className="text-bento-desc">
                AI actions that format and write directly into your canvas using robust JWT-secured WOPI protocols.
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
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />
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
        <section id="enterprise" style={{ width: "100%", maxWidth: "800px", padding: "160px 24px", textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h2 style={{ fontSize: "3rem", fontWeight: 600, letterSpacing: "-0.04em", marginBottom: "24px" }}>
              Ready to scale?
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginBottom: "48px" }}>
              Deploy Vexius Engine on your own infrastructure or let us manage it for you. Perfect for high-compliance environments.
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
              <Link href="/twitter" className="hover-link">Twitter</Link>
              <Link href="/terms" className="hover-link">Terms</Link>
              <Link href="/privacy" className="hover-link">Privacy</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
