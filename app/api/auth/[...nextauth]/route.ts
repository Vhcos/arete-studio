import { headers } from "next/headers";
import NextAuth, { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const resend = new Resend(process.env.RESEND_API_KEY);
const TRACK_CUSTOMERS = process.env.ENABLE_CUSTOMERS === "1";

function getIp(h: Headers) {
  return h.get("x-real-ip") ?? h.get("cf-connecting-ip") ?? h.get("x-forwarded-for") ?? undefined;
}

export const authOptions: NextAuthOptions = {
  pages: { signIn: "/auth/sign-in" },
  session: { strategy: "database" },
  debug: process.env.NODE_ENV !== "production",

  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url, provider }) {
        if (process.env.NODE_ENV !== "production") {
          console.log("Magic link DEV:", identifier, url);
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
      if (!TRACK_CUSTOMERS) return;
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
        update: {
          firstLoginAt: new Date(),
          lastLoginAt: new Date(),
          source: "magic-link",
        },
      });
    },

    async signIn({ user }) {
      if (!TRACK_CUSTOMERS) return;
      const h = await headers();
      const ua = h.get("user-agent") ?? undefined;
      const ip = getIp(h);

      await prisma.customer.upsert({
        where: { userId: user.id },
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
        update: {
          lastLoginAt: new Date(),
          signInCount: { increment: 1 },
          lastIp: ip,
          lastUserAgent: ua,
        },
      });
    },
  },

  callbacks: {
    async redirect({ url, baseUrl }) {
      try {
        const u = new URL(url, baseUrl);
        const cb = u.searchParams.get("callbackUrl");
        if (cb && cb.startsWith("/")) return baseUrl + cb;
        if (cb) return cb;
      } catch {}
      return baseUrl; // → https://app.aret3.cl
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
