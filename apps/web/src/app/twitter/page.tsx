import React from "react";
import Link from "next/link";

export default function TwitterRedirectPage() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      justifyContent: "center", 
      alignItems: "center",
      padding: "24px",
      textAlign: "center"
    }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "16px" }}>Vexius Twitter</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "32px" }}>
        Follow us on Twitter for the latest updates on Vexius Engine.
      </p>
      <Link href="/" style={{ color: "#fff", textDecoration: "underline" }}>
        Return to Home
      </Link>
    </div>
  );
}
