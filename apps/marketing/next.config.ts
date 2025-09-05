// apps/marketing/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@arete-studio/ui"],
  experimental: {
    optimizePackageImports: ["@arete-studio/ui"]
  }
};

export default nextConfig;


