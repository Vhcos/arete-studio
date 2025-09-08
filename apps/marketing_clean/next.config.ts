// apps/marketing_clean/next.config.ts
import type { NextConfig } from "next";

const APP_ORIGIN = process.env.APP_ORIGIN || "https://app.aret3.cl";
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const rules = [
      // App completo bajo /app
      { source: "/app/:path*", destination: `${APP_ORIGIN}/:path*` },

      // Atajos útiles
      { source: "/login", destination: `${APP_ORIGIN}/auth/sign-in` },
      { source: "/signup", destination: `${APP_ORIGIN}/auth/sign-up` },
      { source: "/dashboard/:path*", destination: `${APP_ORIGIN}/dashboard/:path*` },
      { source: "/auth/:path*", destination: `${APP_ORIGIN}/auth/:path*` },

      // Proxy de APIs del app (formulario /api/leads incluido)
      { source: "/api/:path*", destination: `${APP_ORIGIN}/api/:path*` },
    ];

    // Solo en producción proxyear assets del app (en dev dejaba pantalla en blanco)
    if (isProd) {
      rules.push({
        source: "/_next/:path*",
        destination: `${APP_ORIGIN}/_next/:path*`,
      });
    }

    return rules;
  },
};

export default nextConfig;
