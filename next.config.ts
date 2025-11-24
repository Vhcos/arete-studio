// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  transpilePackages: ["@arete-studio/ui"],

  // importante para puppeteer + chromium en Vercel
  serverExternalPackages: ["@sparticuz/chromium-min", "puppeteer-core"],

  experimental: {
    optimizePackageImports: ["@arete-studio/ui"],
  },

  async redirects() {
    return [
      { source: "/wizard/Idea", destination: "/wizard/step-2", permanent: true },
      { source: "/wizard/idea", destination: "/wizard/step-2", permanent: true },
      { source: "/wizard/Idea/:path*", destination: "/wizard/step-2", permanent: true },
      { source: "/wizard/idea/:path*", destination: "/wizard/step-2", permanent: true },
    ];
  },
};

export default nextConfig;
