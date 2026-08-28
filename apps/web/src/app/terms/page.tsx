import React from "react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      padding: "120px 24px 80px",
      maxWidth: "800px",
      margin: "0 auto",
      color: "var(--text-primary)"
    }}>
      <h1 style={{ fontSize: "3rem", fontWeight: 700, letterSpacing: "-0.04em", marginBottom: "16px" }}>Terms of Service</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "48px", fontSize: "1.1rem" }}>Last updated: August 19, 2026</p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "32px", lineHeight: 1.7, color: "var(--text-secondary)" }}>
        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>1. Acceptance of Terms</h2>
          <p>By accessing or using Vexius Engine ("Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service. These terms apply to all visitors, users, and others who access or use the Service.</p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>2. Description of Service</h2>
          <p>Vexius provides an AI-powered document collaboration platform integrating ONLYOFFICE infrastructure with advanced Vexius AI routing capabilities. We provide real-time aggregation and strictly isolated workspace environments for secure document editing.</p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>3. User Accounts & Workspace Security</h2>
          <p>When you create an account, you must provide accurate and complete information. You are solely responsible for safeguarding the password that you use to access the Service. Vexius utilizes Row-Level Security (RLS) to enforce strict workspace isolation; however, you are responsible for any activities or actions under your password and within your workspaces.</p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>4. AI Usage and Token Billing</h2>
          <p>The Service utilizes third-party Large Language Models (LLMs) for reasoning and document generation. Your use of these features consumes "AI Tokens." You agree to comply with our token usage limits and billing structures. Vexius employs smart routing to optimize costs, but excessive or abusive querying may result in temporary suspension of AI capabilities.</p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>5. Acceptable Use Policy</h2>
          <p>You agree not to use the Service to generate, store, or transmit any content that is illegal, harmful, threatening, abusive, or infringing on intellectual property rights. You may not attempt to breach the workspace isolation protocols or reverse-engineer the Dual-LLM routing engine.</p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>6. Limitation of Liability</h2>
          <p>In no event shall Vexius, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>7. Modifications to Service</h2>
          <p>We reserve the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. We may also revise these Terms from time to time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.</p>
        </section>
      </div>

      <div style={{ marginTop: "64px", paddingTop: "32px", borderTop: "1px solid var(--border-color)" }}>
        <Link href="/" style={{ color: "var(--text-primary)", textDecoration: "none", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px" }}>
          ← Return to Home
        </Link>
      </div>
    </div>
  );
}
