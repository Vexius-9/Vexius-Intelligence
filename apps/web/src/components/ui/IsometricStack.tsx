"use client";

import React from "react";
import { motion } from "framer-motion";

export function IsometricStack() {
  const layers = [
    { id: 0, leftText: 'CORE', rightText: 'VEXIUS ENGINE', isTop: false },
    { id: 1, leftText: 'WORKSPACE', rightText: 'ISOLATED ENVIRONMENTS', isTop: false },
    { id: 2, leftText: 'EDITORS', rightText: 'DOCS, SHEETS, SLIDES, PDF', isTop: false },
    { id: 3, leftText: 'INTELLIGENCE', rightText: 'DEEP REASONING AGENTS', isTop: false },
    { id: 4, leftText: 'VEXIUS', rightText: 'INTELLIGENCE SUITE', isTop: true },
  ];

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "400px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      perspective: "2000px",
    }}>
      <motion.div style={{
        position: "relative",
        width: "280px",
        height: "280px",
        transformStyle: "preserve-3d",
        transform: "rotateX(60deg) rotateZ(45deg)",
      }}>
        {layers.map((layer, idx) => (
          <motion.div
            key={layer.id}
            initial={{ z: idx * 40, x: 0, y: 0 }}
            whileHover={{ x: -30, y: 30 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              cursor: "pointer",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Top Face */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: layer.isTop ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(255, 255, 255, 0.1)",
              background: layer.isTop ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.1)",
              transition: "background-color 0.3s",
            }}>
              {layer.isTop && (
                <div style={{
                  transform: "rotate(-45deg)",
                  fontSize: "48px",
                  fontWeight: 800,
                  letterSpacing: "-0.05em",
                  color: "#ffffff",
                  opacity: 0.9,
                  pointerEvents: "none",
                }}>
                  vexius.
                </div>
              )}
            </div>

            {/* Left Visible Face (Bottom edge of X-Y plane) */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "280px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              paddingLeft: "16px",
              boxSizing: "border-box",
              overflow: "hidden",
              border: layer.isTop ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(255, 255, 255, 0.1)",
              background: layer.isTop ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
              transformOrigin: "top",
              transform: "translateY(280px) rotateX(-90deg)",
              transition: "background-color 0.3s",
            }}>
              <span style={{
                fontFamily: "monospace",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: layer.isTop ? "#ffffff" : "#a1a1aa",
              }}>
                {layer.leftText}
              </span>
            </div>

            {/* Right Visible Face (Right edge of X-Y plane) */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "40px",
              height: "280px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              border: layer.isTop ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(255, 255, 255, 0.1)",
              background: layer.isTop ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
              transformOrigin: "left",
              transform: "translateX(280px) rotateY(90deg)",
              transition: "background-color 0.3s",
            }}>
              <span style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                whiteSpace: "nowrap",
                transform: "rotate(-90deg)",
                color: layer.isTop ? "#ffffff" : "#a1a1aa",
              }}>
                {layer.rightText}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
