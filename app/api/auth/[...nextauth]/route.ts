export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { headers as getHeaders } from "next/headers";
import NextAuth, { type NextAuthOptions, type User, type Account } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// helper opcional para IP (si NextAuth incluye request en el evento, lo usamos)
function getIp(req?: any) {
  try {
    const h = typeof req?.headers?.get === "function" ? req.headers : req?.headers;
    const xff = h?.get?.("x-forwarded-for") ?? h?.["x-forwarded-for"];
    return (xff?.split(",")?.[0] ?? "").trim() || undefined;
  } catch {
    return undefined;
  }
}

export const authOptions: NextAuthOptions = {
  // ...providers, adapter, pages, etc.
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url, provider }) {
        if (process.env.NODE_ENV !== "production") {
          console.log("🔑 Magic link DEV:", identifier, url);
          return;
        }
        await resend.emails.send({
          from: provider.from!,
          to: identifier,
          subject: "Tu acceso a Areté",
          html: `<p>Entra con este enlace:</p><p><a href="${url}">${url}</a></p>`,
        });
      },
    }),
  ],

  events: {
    async createUser({ user }) {
      await prisma.customer.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          email: user.email ?? "",
          firstLoginAt: new Date(),
          lastLoginAt: new Date(),
          signInCount: 1,
          source: "magic-link",
        },
        update: {},
      });
    },

    async signIn({ user }) {
      // 👇 AQUÍ el cambio: await a headers()
      const h = await getHeaders();

      const ua =
        h.get("user-agent") ?? undefined;

      const ip =
        h.get("x-real-ip") ??
        h.get("x-forwarded-for") ??
        undefined;

      await prisma.customer.upsert({
        where: { userId: user.id },
        update: {
          lastLoginAt: new Date(),
          signInCount: { increment: 1 },
          lastIp: ip,
          lastUserAgent: ua,
        },
        create: {
          userId: user.id,
          email: user.email ?? "",
          firstLoginAt: new Date(),
          lastLoginAt: new Date(),
          signInCount: 1,
          source: "magic-link",
          lastIp: ip,
          lastUserAgent: ua,
        },
      });
    },
  },



  // ✅ Redirección segura: si viene ?callbackUrl=/algo lo respetamos, si no → raíz del app
  callbacks: {
    async redirect({ url, baseUrl }) {
      try {
        const u = new URL(url, baseUrl);
        const cb = u.searchParams.get("callbackUrl");
        if (cb && cb.startsWith("/")) return baseUrl + cb;
        if (url.startsWith("/")) return baseUrl + url;
      } catch {}
      return baseUrl; // https://app.aret3.cl
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
