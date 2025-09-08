// apps/marketing_clean/next.config.ts
import type { NextConfig } from "next";

const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_ORIGIN || "https://app.aret3.cl";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ✅ Solo proxy para el formulario de newsletter
  async rewrites() {
    return [
      { source: "/api/leads", destination: `${APP_ORIGIN}/api/leads` },
    ];
  },

  // (Opcional) evita indexar la ruta de API en marketing
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/api/:path*", headers: noindex },
    ];
  },
};

export default nextConfig;
