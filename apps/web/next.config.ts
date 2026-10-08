import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  distDir: process.env.SAHELIA_BROWSER_TEST === "1" ? ".next-e2e" : ".next",
};

export default nextConfig;
