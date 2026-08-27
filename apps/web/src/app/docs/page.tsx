import React from "react";
import Link from "next/link";
import { ChevronRight, Book, Shield, Zap, Database, Code } from "lucide-react";
import Image from "next/image";
import logoImg from "../../../public/logo.png";
import { FluidBackground } from "@/components/ui/FluidBackground";

export default function DocsPage() {
  return (
    <div style={{ position: "relative", minHeight: "100vh", backgroundColor: "transparent", overflow: "hidden", color: "white" }}>
      <FluidBackground />
      {/* Navigation */}
      <nav className="nav-bar">
        <div className="nav-content">
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
            <Image src={logoImg} alt="Vexius Logo" width={24} height={24} />
            <span style={{ fontWeight: 600, fontSize: "1.05rem", letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
              Vexius
            </span>
          </Link>
          <div className="nav-links" style={{ display: "flex", gap: "32px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            <Link href="/" className="hover-link">Home</Link>
            <Link href="/#features" className="hover-link">Features</Link>
            <Link href="/#security" className="hover-link">Security</Link>
            <Link href="/#enterprise" className="hover-link">Enterprise</Link>
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

      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-start", maxWidth: "1200px", margin: "0 auto", paddingTop: "64px" }}>
        
        {/* Sidebar */}
        <aside style={{ 
          width: "280px", 
          position: "sticky", 
          top: "64px", 
          height: "calc(100vh - 64px)", 
          overflowY: "auto",
          padding: "32px 24px",
          borderRight: "1px solid var(--border-color)",
          flexDirection: "column",
          gap: "24px",
          display: "none" /* Would be block on desktop, handled by media queries if needed, but let's keep it simple inline */
        }} className="docs-sidebar">
          <div>
            <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "12px", fontWeight: 600 }}>Getting Started</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><Link href="#introduction" style={{ color: "var(--text-primary)", fontSize: "0.9rem", textDecoration: "none" }}>Introduction</Link></li>
              <li><Link href="#architecture" style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textDecoration: "none" }}>Architecture</Link></li>
              <li><Link href="#authentication" style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textDecoration: "none" }}>Authentication</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "12px", fontWeight: 600 }}>Core Concepts</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><Link href="#workspaces" style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textDecoration: "none" }}>Workspaces & RLS</Link></li>
              <li><Link href="#vexius-editors" style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textDecoration: "none" }}>Vexius Native Engine</Link></li>
              <li><Link href="#ai-routing" style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textDecoration: "none" }}>Dual-LLM Routing</Link></li>
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: "48px 24px 120px", maxWidth: "800px" }}>
          <div style={{ marginBottom: "16px", color: "#a855f7", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
            <Book size={16} />
            Documentation
          </div>
          <h1 style={{ fontSize: "3rem", fontWeight: 700, letterSpacing: "-0.04em", marginBottom: "24px", color: "var(--text-primary)" }}>
            Vexius Engine Documentation
          </h1>
          <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "48px" }}>
            Comprehensive guide to understanding, deploying, and building upon the Vexius Engine—a highly secure, AI-powered document collaboration platform.
          </p>

          <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "48px 0" }} />

          {/* Section: Introduction */}
          <section id="introduction" style={{ marginBottom: "64px" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: "16px", color: "var(--text-primary)" }}>Introduction</h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "16px" }}>
              Vexius Engine is built to solve two major problems in modern enterprise collaboration: <strong>Data isolation</strong> and <strong>AI capability constraints</strong>. 
            </p>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "24px" }}>
              By combining strict database-level Row-Level Security (RLS) with our proprietary Vexius Native Engine, Vexius ensures zero data leakage between workspaces without sacrificing performance. Furthermore, the built-in AI Copilot dynamically routes queries between multiple LLM providers (e.g., Grok, DeepSeek) based on task complexity and latency requirements.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "32px" }}>
              <div className="bento-box" style={{ padding: "24px" }}>
                <Shield size={24} color="#a855f7" style={{ marginBottom: "16px" }} />
                <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "8px", color: "var(--text-primary)" }}>Zero-Trust Architecture</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>Every document access is authenticated at the database level.</p>
              </div>
              <div className="bento-box" style={{ padding: "24px" }}>
                <Zap size={24} color="#10b981" style={{ marginBottom: "16px" }} />
                <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "8px", color: "var(--text-primary)" }}>Real-time Sync</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>Multi-user editing powered by the Vexius Native Engine.</p>
              </div>
            </div>
          </section>

          {/* Section: Architecture */}
          <section id="architecture" style={{ marginBottom: "64px" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: "16px", color: "var(--text-primary)" }}>Architecture</h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "24px" }}>
              Vexius is structured as a modern monorepo utilizing a frontend/backend split with a unified database schema.
            </p>
            <ul style={{ paddingLeft: "24px", color: "var(--text-secondary)", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              <li><strong>Frontend (Next.js):</strong> React Server Components, Framer Motion for animations, and Zustand for state management. Connects to Solana wallets for Web3 native authentication.</li>
              <li><strong>Backend API (NestJS):</strong> A robust, modular monolith handling workspace creation, WOPI protocol endpoints, and AI prompt orchestration.</li>
              <li><strong>Database (PostgreSQL via Supabase):</strong> The single source of truth. Uses Row-Level Security (RLS) to enforce workspace boundaries at the kernel level of the database.</li>
              <li><strong>Vexius Editors:</strong> Proprietary, native components for Docs, Sheets, Slides, and PDF built directly into the frontend for maximum performance and seamless AI integration.</li>
            </ul>
          </section>

          {/* Section: Authentication */}
          <section id="authentication" style={{ marginBottom: "64px" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: "16px", color: "var(--text-primary)" }}>Authentication</h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "16px" }}>
              Vexius supports seamless Web3 authentication. Instead of traditional email/password setups, users authenticate by cryptographically signing a message using their Solana wallet (e.g., Phantom, Solflare).
            </p>
            <div className="ios-glass-card" style={{ padding: "24px", fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-secondary)", overflowX: "auto" }}>
              <span style={{ color: "#a855f7" }}>const</span> message <span style={{ color: "#a855f7" }}>=</span> new TextEncoder().encode(<span style={{ color: "#10b981" }}>"Sign this message to authenticate with Vexius Engine"</span>);<br />
              <span style={{ color: "#a855f7" }}>const</span> signature <span style={{ color: "#a855f7" }}>=</span> await wallet.signMessage(message);<br />
              <br />
              // Send to backend for verification<br />
              <span style={{ color: "#a855f7" }}>const</span> token <span style={{ color: "#a855f7" }}>=</span> await api.post(<span style={{ color: "#10b981" }}>"/auth/verify"</span>, &#123; publicKey, signature &#125;);
            </div>
          </section>

          {/* Section: Workspaces & RLS */}
          <section id="workspaces" style={{ marginBottom: "64px" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: "16px", color: "var(--text-primary)" }}>Workspaces & RLS</h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "16px" }}>
              Everything in Vexius belongs to a <strong>Workspace</strong>. A workspace is an isolated logical container. To enforce this, we use PostgreSQL Row-Level Security.
            </p>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "24px" }}>
              Even if a vulnerability exists in the application code, the database itself will reject queries attempting to read documents from a workspace the user is not a member of.
            </p>
            <div className="ios-glass-card" style={{ padding: "24px", fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-secondary)", overflowX: "auto" }}>
              <span style={{ color: "#3b82f6" }}>-- Example RLS Policy</span><br />
              <span style={{ color: "#a855f7" }}>CREATE POLICY</span> "Users can read workspace documents"<br />
              <span style={{ color: "#a855f7" }}>ON</span> documents <span style={{ color: "#a855f7" }}>FOR SELECT</span><br />
              <span style={{ color: "#a855f7" }}>USING</span> (<br />
              &nbsp;&nbsp;workspace_id <span style={{ color: "#a855f7" }}>IN</span> (<br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: "#a855f7" }}>SELECT</span> workspace_id <span style={{ color: "#a855f7" }}>FROM</span> members <span style={{ color: "#a855f7" }}>WHERE</span> user_id <span style={{ color: "#a855f7" }}>=</span> auth.uid()<br />
              &nbsp;&nbsp;)<br />
              );
            </div>
          </section>

          {/* Section: Vexius Editors */}
          <section id="vexius-editors" style={{ marginBottom: "64px" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: "16px", color: "var(--text-primary)" }}>Vexius Native Engine</h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "16px" }}>
              To provide enterprise-grade document editing, Vexius relies on its proprietary native engine, bypassing the need for third-party integrations like ONLYOFFICE or complex WOPI protocols.
            </p>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "16px" }}>
              Our suite includes four intelligent editors:
            </p>
            <ol style={{ paddingLeft: "24px", color: "var(--text-secondary)", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
              <li><strong>Vexius Docs:</strong> A rich text collaborative editor with real-time AI drafting.</li>
              <li><strong>Vexius Sheets:</strong> High-performance spreadsheets featuring AI-generated formulas and data analysis.</li>
              <li><strong>Vexius Slides:</strong> Dynamic, layout-aware presentation generator utilizing responsive scaling.</li>
              <li><strong>Vexius PDF:</strong> Secure document viewer with cryptographic signatures and on-chain verification capability.</li>
            </ol>
          </section>

          {/* Section: Dual-LLM Routing */}
          <section id="ai-routing" style={{ marginBottom: "64px" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: "16px", color: "var(--text-primary)" }}>Dual-LLM AI Routing</h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "16px" }}>
              Vexius does not rely on a single AI provider. The <strong>Dual-LLM Router</strong> automatically determines the best model for the current task.
            </p>
            <ul style={{ paddingLeft: "24px", color: "var(--text-secondary)", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
              <li><strong>DeepSeek (Coder/Reasoning):</strong> Used for complex document restructuring, code generation, and heavy analytical reasoning.</li>
              <li><strong>Grok (Fast/Creative):</strong> Used for rapid summarization, drafting emails, and general quick-response Q&A.</li>
            </ul>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
              This architecture ensures the highest quality output while optimizing API costs and response latency.
            </p>
          </section>

        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .docs-sidebar {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
