import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disabled to fix Tiptap v3 incompatibility with React Strict Mode.
  // React Strict Mode double-mounts components in dev, causing Tiptap's
  // ProseMirror plugin instances to conflict (keyed plugin RangeError).
  reactStrictMode: false,
};

export default nextConfig;
