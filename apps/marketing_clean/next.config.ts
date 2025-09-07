// apps/marketing_clean/next.config.ts
import type { NextConfig } from "next";

const APP_ORIGIN = process.env.APP_ORIGIN || "https://app.aret3.cl";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/_next/:path*", destination: `${APP_ORIGIN}/_next/:path*` },
        { source: "/static/:path*", destination: `${APP_ORIGIN}/static/:path*` },
        { source: "/fonts/:path*", destination: `${APP_ORIGIN}/fonts/:path*` },
        { source: "/favicon.ico", destination: `${APP_ORIGIN}/favicon.ico` },
        { source: "/robots.txt", destination: `${APP_ORIGIN}/robots.txt` },
        { source: "/sitemap.xml", destination: `${APP_ORIGIN}/sitemap.xml` },
      ],
      afterFiles: [
        { source: "/app", destination: `${APP_ORIGIN}/` },
        { source: "/app/:path*", destination: `${APP_ORIGIN}/:path*` },

        { source: "/auth/:path*", destination: `${APP_ORIGIN}/auth/:path*` },
        { source: "/login", destination: `${APP_ORIGIN}/auth/sign-in` },
        { source: "/signup", destination: `${APP_ORIGIN}/auth/sign-up` },

        // Alias temporal dashboard -> wizard (porque /dashboard no existe en el app)
        { source: "/dashboard", destination: `${APP_ORIGIN}/wizard/idea` },
        { source: "/dashboard/:path*", destination: `${APP_ORIGIN}/wizard/:path*` },

        { source: "/wizard/:path*", destination: `${APP_ORIGIN}/wizard/:path*` },
      ],
    };
  },
  async redirects() {
    // 👇 Evita la pantalla en blanco en "/"
    return [{ source: "/", destination: "/app", permanent: false }];
  },
};

export default nextConfig;
