// middleware.ts (raíz)
export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/wizard/:path*", "/tablero", "/informe/:path*"],
};
