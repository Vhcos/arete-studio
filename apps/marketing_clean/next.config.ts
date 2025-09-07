// apps/marketing_clean/next.config.ts
import type { NextConfig } from "next";

const APP_ORIGIN = process.env.APP_ORIGIN || "https://app.aret3.cl";
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: { tsconfigPath: "./tsconfig.json" },

  async rewrites() {
    const beforeFiles = isProd
      ? [
          // ⚠️ SOLO en producción (para no romper localhost:3002)
          { source: "/_next/:path*", destination: `${APP_ORIGIN}/_next/:path*` },
          { source: "/static/:path*", destination: `${APP_ORIGIN}/static/:path*` },
          { source: "/fonts/:path*", destination: `${APP_ORIGIN}/fonts/:path*` },
          { source: "/favicon.ico", destination: `${APP_ORIGIN}/favicon.ico` },
          { source: "/robots.txt", destination: `${APP_ORIGIN}/robots.txt` },
          { source: "/sitemap.xml", destination: `${APP_ORIGIN}/sitemap.xml` },
        ]
      : [];

    const afterFiles = [
      // App bajo /app
      { source: "/app", destination: `${APP_ORIGIN}/` },
      { source: "/app/:path*", destination: `${APP_ORIGIN}/:path*` },

      // Auth del app
      { source: "/auth/:path*", destination: `${APP_ORIGIN}/auth/:path*` },
      { source: "/login", destination: `${APP_ORIGIN}/auth/sign-in` },
      { source: "/signup", destination: `${APP_ORIGIN}/auth/sign-up` },

      // Leads (formulario de la landing)
      { source: "/api/leads", destination: `${APP_ORIGIN}/api/leads` },

      // Alias útiles
      { source: "/dashboard", destination: `${APP_ORIGIN}/wizard/idea` },
      { source: "/dashboard/:path*", destination: `${APP_ORIGIN}/wizard/:path*` },
    ];

    return { beforeFiles, afterFiles };
  },
  // NO pongas redirect "/" -> "/app" si quieres ver la landing en /
};

export default nextConfig;
