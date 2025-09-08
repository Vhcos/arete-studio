// apps/marketing_clean/next.config.ts
import type { NextConfig } from "next";

const APP_ORIGIN = process.env.APP_ORIGIN ?? "https://app.aret3.cl";
const isProd = process.env.NODE_ENV === "production";

type Rule = { source: string; destination: string };

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async rewrites() {
    // 👇 Array normal, sin "as const"
    const rules: Rule[] = [
      // App completo bajo /app
      { source: "/app/:path*", destination: `${APP_ORIGIN}/:path*` },

      // Atajos útiles
      { source: "/login", destination: `${APP_ORIGIN}/auth/sign-in` },
      { source: "/signup", destination: `${APP_ORIGIN}/auth/sign-up` },
      { source: "/dashboard/:path*", destination: `${APP_ORIGIN}/dashboard/:path*` },
      { source: "/auth/:path*", destination: `${APP_ORIGIN}/auth/:path*` },

      // APIs del app (formulario /api/leads incluido)
      { source: "/api/:path*", destination: `${APP_ORIGIN}/api/:path*` },
    ];

    // En producción proxyeamos también assets del app
    return isProd
      ? [...rules, { source: "/_next/:path*", destination: `${APP_ORIGIN}/_next/:path*` }]
      : rules;
  },

  // (Opcional) Evitar indexar auth y api
  async headers() {
    if (!isProd) return [];
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/auth/:path*", headers: noindex },
      { source: "/api/:path*", headers: noindex },
    ];
  },
};

export default nextConfig;

