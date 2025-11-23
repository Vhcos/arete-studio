// next.config.ts
import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ["@arete-studio/ui"],

  experimental: {
    // lo que ya tenías
    optimizePackageImports: ["@arete-studio/ui"],
    // 👇 nuevo: decirle a Next/Vercel que no intente empaquetar estos módulos,
    // y los deje como dependencias externas (necesario para chromium en serverless)
    serverComponentsExternalPackages: [
      "@sparticuz/chromium-min",
      "puppeteer-core",
    ],
  },

  // Opcional pero recomendable para lambdas en Vercel
  output: "standalone",

  // Redirecciones legacy para rutas antiguas
  async redirects() {
    return [
      // capitalizado y minúsculas
      { source: "/wizard/Idea", destination: "/wizard/step-2", permanent: true },
      { source: "/wizard/idea", destination: "/wizard/step-2", permanent: true },

      // por si existieran subrutas antiguas (no debería, pero mejor cubrir)
      {
        source: "/wizard/Idea/:path*",
        destination: "/wizard/step-2",
        permanent: true,
      },
      {
        source: "/wizard/idea/:path*",
        destination: "/wizard/step-2",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
