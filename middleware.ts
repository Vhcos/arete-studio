// middleware.ts (raíz)

export { default as middleware } from "next-auth/middleware";

// Solo protegemos estas zonas por ahora
export const config = {
  matcher: [
    "/wizard/:path*",
    "/(protected)/:path*",
  ],
};
