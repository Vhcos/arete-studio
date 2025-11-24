// next.config.ts
import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  transpilePackages: ["@arete-studio/ui"],

  experimental: {
    optimizePackageImports: ["@arete-studio/ui"],

    // 👇 MUY IMPORTANTE PARA EL PDF EN VERCEL
    // Le decimos a Next que estos paquetes de servidor se mantengan externos
    // y no intente “bundlearlos” de forma rara en la lambda.
    serverComponentsExternalPackages: [
      "@sparticuz/chromium-min",
      "puppeteer-core",
    ],
  },

  // Redirecciones legacy para rutas antiguas
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
