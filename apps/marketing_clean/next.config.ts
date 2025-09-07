// apps/marketing_clean/next.config.ts
import type { NextConfig } from "next";

const APP_ORIGIN = process.env.APP_ORIGIN || "https://app.aret3.cl";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // 👇 fuerza el tsconfig del sub-app
  typescript: { tsconfigPath: "./tsconfig.json" },

  async rewrites() {
    return {
      beforeFiles: [
        { source: "/_next/:path*", destination: `${APP_ORIGIN}/_next/:path*` },
        { source: "/static/:path*", destination: `${APP_ORIGIN}/static/:path*` },
        { source: "/fonts/:path*", destination: `${APP_ORIGIN}/fonts/:path*` },
        { source: "/favicon.ico", destination: `${APP_ORIGIN}/favicon.ico` },
        { source: "/robots.txt", destination: `${APP_ORIGIN}/robots.txt` },
        { source: "/sitemap.xml", destination: `${APP_ORIGIN}/sitemap.xml` }
      ],
      afterFiles: [
        { source: "/app", destination: `${APP_ORIGIN}/` },
        { source: "/app/:path*", destination: `${APP_ORIGIN}/:path*` },

        { source: "/auth/:path*", destination: `${APP_ORIGIN}/auth/:path*` },
        { source: "/login", destination: `${APP_ORIGIN}/auth/sign-in` },
        { source: "/signup", destination: `${APP_ORIGIN}/auth/sign-up` },

         // 👇 NUEVO: reenvía las rutas NextAuth del app
        { source: "/api/auth/:path*", destination: `${APP_ORIGIN}/api/auth/:path*` },

        // alias temporal
        { source: "/dashboard", destination: `${APP_ORIGIN}/wizard/idea` },
        { source: "/dashboard/:path*", destination: `${APP_ORIGIN}/wizard/:path*` },

        { source: "/wizard/:path*", destination: `${APP_ORIGIN}/wizard/:path*` }
      ]
    };
  },

  async redirects() {
    return [{ source: "/", destination: "/app", permanent: false }];
  }
};

export default nextConfig;
