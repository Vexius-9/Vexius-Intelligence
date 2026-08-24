"use client";

import React, { useEffect, useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import bs58 from "bs58";

export default function LoginPage() {
  const { connected, publicKey, signMessage, disconnect } = useWallet();
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const hasRequestedRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (connected && publicKey && signMessage && !hasRequestedRef.current) {
      hasRequestedRef.current = true;
      setVerifying(true);
      setError(null);

      const verifyToken = async () => {
        try {
          const walletAddress = publicKey.toBase58();
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          
          // 1. Get Nonce from Backend
          const nonceRes = await fetch(`${apiUrl}/auth/nonce`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress }),
          });
          
          if (!nonceRes.ok) throw new Error("Failed to fetch nonce from backend");
          const { message } = await nonceRes.json();
          
          // 2. Sign Message
          const messageBytes = new TextEncoder().encode(message);
          const signature = await signMessage(messageBytes);
          const signatureBase58 = bs58.encode(signature);
          
          // 3. Verify Signature & Balance on Backend
          const verifyRes = await fetch(`${apiUrl}/auth/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress, signature: signatureBase58 }),
          });
          
          if (!verifyRes.ok) {
            const errData = await verifyRes.json();
            throw new Error(errData.message || "Failed to verify signature on backend");
          }
          
          const { access_token } = await verifyRes.json();
          
          // In a real app, you would store this access_token in a cookie or localStorage
          localStorage.setItem("vexius_token", access_token);
          
          router.push("/dashboard");
        } catch (err: any) {
          console.error(err);
          setError(err.message || "Authentication failed.");
          hasRequestedRef.current = false; // allow retry
          disconnect(); // Disconnect if failed so they can try again
        } finally {
          setVerifying(false);
        }
      };

      verifyToken();
    }
  }, [connected, publicKey, signMessage, router, disconnect]);

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
      <Link href="/" style={{
        position: "absolute",
        top: "24px",
        left: "24px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        color: "var(--text-secondary)",
        textDecoration: "none",
        fontSize: "0.9rem",
        fontWeight: 500,
        transition: "color 0.2s"
      }}
      className="back-btn"
      onMouseOver={(e) => e.currentTarget.style.color = "var(--text-primary)"}
      onMouseOut={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
      >
        <ArrowLeft size={16} /> Back to Home
      </Link>
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
          <Image src="/logo.png" alt="Vexius Logo" width={32} height={32} />
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "8px", letterSpacing: "-0.02em" }}>
          Terminal Access
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "32px", lineHeight: 1.5 }}>
          Vexius Engine is strictly token-gated. Connect your Solana wallet to verify your holdings (min. 0.1% supply required).
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
            mounted ? (
              <WalletMultiButton style={{ 
                background: "#ffffff", 
                color: "#000000", 
                fontWeight: 600,
                fontFamily: "inherit",
                borderRadius: "8px" 
              }} />
            ) : (
              <div style={{ width: "160px", height: "48px", background: "rgba(255,255,255,0.1)", borderRadius: "8px" }} />
            )
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
