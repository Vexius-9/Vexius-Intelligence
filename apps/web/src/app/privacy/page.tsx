import React from "react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      padding: "120px 24px 80px",
      maxWidth: "800px",
      margin: "0 auto",
      color: "var(--text-primary)"
    }}>
      <h1 style={{ fontSize: "3rem", fontWeight: 700, letterSpacing: "-0.04em", marginBottom: "16px" }}>Privacy Policy</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "48px", fontSize: "1.1rem" }}>Last updated: August 19, 2026</p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "32px", lineHeight: 1.7, color: "var(--text-secondary)" }}>
        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>1. Introduction</h2>
          <p>Your privacy is critically important to us. Vexius Engine ("we", "our", or "us") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we use it, and what rights you have concerning it.</p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>2. Information We Collect</h2>
          <p>We collect personal information that you voluntarily provide to us when you register on the Service, express an interest in obtaining information about us or our products, or when you use the Service. This includes:</p>
          <ul style={{ paddingLeft: "24px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <li><strong>Account Data:</strong> Name, email address, and authentication credentials.</li>
            <li><strong>Document Content:</strong> The text and metadata of documents you create or upload, stored within securely isolated workspace boundaries.</li>
            <li><strong>AI Prompts:</strong> Queries and context sent to our Dual-LLM engine for reasoning tasks.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>3. Data Storage & Security (RLS)</h2>
          <p>We employ state-of-the-art security measures. All document data is stored in strictly isolated PostgreSQL environments. We implement database-level Row-Level Security (RLS) meaning that it is cryptographically and logically impossible for unauthorized users or cross-workspace accounts to access your documents. Communication with ONLYOFFICE uses securely signed JWT tokens and standard WOPI protocols.</p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>4. Third-Party AI Integrations</h2>
          <p>To provide advanced AI reasoning capabilities, we route specific prompts to our advanced Vexius AI models. When you trigger an AI action, only the necessary document context required to complete the task is securely transmitted. We do not use your private documents to train our proprietary models without your explicit consent.</p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>5. Sharing Your Information</h2>
          <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We never sell your personal data or document content to data brokers.</p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>6. Your Privacy Rights</h2>
          <p>Depending on your location, you may have rights regarding your personal information, such as the right to request access to, correct, or delete the data we hold about you. You can manage your workspace data directly from the Vexius Dashboard or contact our support for data export or deletion requests.</p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>7. Contact Us</h2>
          <p>If you have questions or comments about this policy, or if you believe your privacy rights have been violated, you may email us at privacy@vexiusengine.com.</p>
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
