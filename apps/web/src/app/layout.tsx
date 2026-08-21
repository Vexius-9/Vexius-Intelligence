import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SolanaProvider } from "@/components/providers/SolanaProvider";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vexius",
  description: "AI Document Workspace",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <SolanaProvider>
          {children}
        </SolanaProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
