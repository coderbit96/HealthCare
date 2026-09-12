import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AWS Docker explicitly sets NEXT_OUTPUT=standalone. Vercel must retain its
  // default adapter output, which supplies its own function tracing artifacts.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
};

export default nextConfig;
