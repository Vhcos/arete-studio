// middleware.ts (raíz)
export { default } from "next-auth/middleware";

// Solo protegemos estas zonas por ahora (deja el wizard libre)
export const config = {
  matcher: [
    "/wizard/:path*",
    "/(protected)/:path*",
  ],
};