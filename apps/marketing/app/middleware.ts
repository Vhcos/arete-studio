// apps/app/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname, search } = req.nextUrl;

  // Rutas que requieren sesión (ajusta a tus rutas protegidas)
  const needsAuth =
    pathname.startsWith("/wizard") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/app");

  if (needsAuth && !token) {
    // ➜ redirige SIEMPRE al MISMO ORIGEN de la request
    const signInUrl = new URL("/auth/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/wizard/:path*", "/dashboard/:path*"], // ajusta tus matchers
};
