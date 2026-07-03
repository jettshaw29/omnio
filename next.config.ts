import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silences Turbopack's workspace-root inference — an unrelated lockfile
  // elsewhere on this machine was otherwise being picked up as the root.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
