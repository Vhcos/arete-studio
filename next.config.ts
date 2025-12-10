// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ⚠️ Ojo: ya no se soporta configuración de eslint aquí, la sacamos.
  // eslint: { ignoreDuringBuilds: true },

  // Mantienes esto si quieres que el build no se caiga por errores de TS
  typescript: { ignoreBuildErrors: true },

  // Paquete UI interno
  transpilePackages: ["@arete-studio/ui"],

  // Nuevo nombre y nueva ubicación para lo que antes era experimental.serverComponentsExternalPackages
  serverExternalPackages: [
    "@sparticuz/chromium",
    "puppeteer-core",
  ],

  experimental: {
    // Esto sí puede seguir aquí
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
