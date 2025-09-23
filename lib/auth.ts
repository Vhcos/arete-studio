// apps/app/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY!);
const EMAIL_FROM = process.env.EMAIL_FROM || "Arete <no-reply@aret3.cl>";

/** Proveedor de email (enlace mágico) */
const emailProvider = EmailProvider({
  from: EMAIL_FROM,
  sendVerificationRequest: async ({ identifier, url }) => {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: identifier,
      subject: "Tu acceso a ARET3",
      html: `<p>Haz clic para entrar:</p><p><a href="${url}">${url}</a></p>`,
    });
  },
});

export const authOptions: NextAuthOptions = {
  providers: [emailProvider],
  pages: { signIn: "/auth/sign-in" },

  /** Callbacks */
  callbacks: {
    /** 1) Crea wallet FREE (10) en el primer login */
    async signIn({ user }) {
      if (!user?.id) return true;

      const exists = await prisma.creditWallet.findUnique({
        where: { userId: user.id },
      });
      if (!exists) {
        await prisma.$transaction([
          prisma.creditWallet.create({
            data: { userId: user.id, creditsRemaining: 10, plan: "free" },
          }),
          prisma.usageEvent.create({
            data: { userId: user.id, qty: 10, kind: "seed" },
          }),
        ]);
      }
      return true;
    },

    /** 2) Adjunta contador y plan al objeto de sesión */
    async session({ session, user, token }) {
      const userId = user?.id || (token?.sub as string | undefined);
      if (userId) {
        const w = await prisma.creditWallet.findUnique({
          where: { userId },
        });
        (session as any).user = { ...(session as any).user, id: userId };
        (session as any).creditsRemaining = w?.creditsRemaining ?? 0;
        (session as any).plan = w?.plan ?? "free";
      }
      return session;
    },

    /** 3) Redirect seguro: permite rutas relativas y mismo host */
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      try {
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        const u = new URL(url);
        if (u.origin === baseUrl) return url;
      } catch {
        /* ignore */
      }
      return baseUrl;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
