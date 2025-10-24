// next.config.ts
import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ["@arete-studio/ui"],
  experimental: {
    optimizePackageImports: ["@arete-studio/ui"],
  },

  // Redirecciones legacy para rutas antiguas
  async redirects() {
    return [
      // capitalizado y minúsculas
      { source: "/wizard/Idea", destination: "/wizard/step-2", permanent: true },
      { source: "/wizard/idea", destination: "/wizard/step-2", permanent: true },

      // por si existieran subrutas antiguas (no debería, pero mejor cubrir)
      { source: "/wizard/Idea/:path*", destination: "/wizard/step-2", permanent: true },
      { source: "/wizard/idea/:path*", destination: "/wizard/step-2", permanent: true },
    ];
  },
};

export default nextConfig;
