"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { connected, publicKey } = useWallet();
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (connected && publicKey) {
      // Mulai proses verifikasi dummy
      setVerifying(true);
      setError(null);

      const verifyToken = async () => {
        // Simulasi network request delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        // MOCK LOGIC: Kita pura-pura memverifikasi apakah wallet ini hold >= 10.000.000 (1%) Vexius.
        // Untuk sekarang, kita asumsikan SEMUA wallet sukses (dummy success).
        // Jika ingin menguji gagal, bisa ubah isSuccess menjadi false.
        const isSuccess = true; 

        if (isSuccess) {
          router.push("/dashboard");
        } else {
          setVerifying(false);
          setError("Access Denied: You must hold at least 1% (10,000,000) of Vexius supply.");
        }
      };

      verifyToken();
    }
  }, [connected, publicKey, router]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-primary)",
      position: "relative"
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "48px 32px",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "16px",
          textAlign: "center",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <div style={{ width: "32px", height: "32px", background: "#fff", borderRadius: "4px" }} />
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "8px", letterSpacing: "-0.02em" }}>
          Terminal Access
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "32px", lineHeight: 1.5 }}>
          Vexius Engine is strictly token-gated. Connect your Solana wallet to verify your holdings.
        </p>

        {error && (
          <div style={{ 
            marginBottom: "24px", 
            padding: "12px", 
            background: "rgba(239, 68, 68, 0.1)", 
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "8px",
            color: "#ef4444",
            fontSize: "0.85rem"
          }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center" }}>
          {verifying ? (
            <div style={{ 
              padding: "12px 24px", 
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span className="spinner"></span>
              Verifying holdings...
            </div>
          ) : (
            <WalletMultiButton style={{ 
              background: "#ffffff", 
              color: "#000000", 
              fontWeight: 600,
              fontFamily: "inherit",
              borderRadius: "8px" 
            }} />
          )}
        </div>
      </motion.div>
      
      {/* Basic spinner CSS */}
      <style>{`
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.1);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
