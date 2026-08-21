"use client";

import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, Folder, FileText, ChevronRight } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { connected } = useWallet();
  const router = useRouter();

  // Route Guard: If not connected, redirect to login
  React.useEffect(() => {
    if (!connected) {
      router.push("/login");
    }
  }, [connected, router]);

  if (!connected) {
    return null; // Return empty until redirected
  }

  return (
    <div className="dashboard-container" style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Main Content Area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <header className="dashboard-header" style={{ 
          height: "64px", 
          borderBottom: "1px solid var(--border-color)",
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          padding: "0 24px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "inherit" }}>
              <div style={{ width: "24px", height: "24px", background: "#fff", borderRadius: "4px" }} />
              <span style={{ fontWeight: 600, fontSize: "1.1rem", letterSpacing: "-0.01em" }}>Vexius</span>
            </Link>
            <div style={{ width: "1px", height: "24px", background: "var(--border-color)", margin: "0 8px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              <span>Dashboard</span>
              <ChevronRight size={14} />
              <span style={{ color: "#fff" }}>Workspaces</span>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ 
              padding: "4px 12px", 
              borderRadius: "100px", 
              background: "rgba(168, 85, 247, 0.1)", 
              color: "#a855f7",
              fontSize: "0.75rem",
              fontWeight: 600,
              border: "1px solid rgba(168, 85, 247, 0.2)"
            }}>
              Holder Verified
            </div>
            {/* Override wallet adapter button styling slightly for dashboard */}
            <div className="dashboard-wallet">
              <WalletMultiButton style={{ 
                height: "36px", 
                background: "transparent", 
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                fontFamily: "inherit",
                fontSize: "0.85rem",
                padding: "0 16px"
              }} />
            </div>
          </div>
        </header>
        
        <div style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
          {children}
        </div>
      </main>
      <style>{`
        .dashboard-wallet .wallet-adapter-button:not([disabled]):hover {
          background-color: rgba(255,255,255,0.05) !important;
        }
      `}</style>
    </div>
  );
}
