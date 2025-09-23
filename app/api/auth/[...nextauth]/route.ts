import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

import type { NextAuthOptions, Session, User } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";


/**
 * EmailProvider: soporta dos modos
 *  - SMTP: define EMAIL_SERVER y EMAIL_FROM
 *  - Resend API: define RESEND_API_KEY y EMAIL_FROM
 */
const hasSMTP = !!process.env.EMAIL_SERVER;
const hasResend = !!process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM;

if (!from) {
  console.error("[auth] Falta EMAIL_FROM");
}

function buildEmailProvider() {
  if (hasSMTP) {
    return EmailProvider({
      server: process.env.EMAIL_SERVER!,
      from: from!,
    });
  }

  if (hasResend) {
    return EmailProvider({
      from: from!,
      // Enviamos el correo con Resend (sin SMTP)
      async sendVerificationRequest({ identifier, url }) {
        try {
          const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: from!,
              to: identifier,
              subject: "Tu acceso a Areté",
              html: `
                <p>Entra con este enlace:</p>
                <p><a href="${url}">${url}</a></p>
                <p style="color:#777;font-size:12px">Si no solicitaste este acceso, ignora este correo.</p>
              `,
              text: `Entra con este enlace: ${url}`,
            }),
          });

          if (!r.ok) {
            const text = await r.text();
            console.error("[auth][email][resend] Error HTTP", r.status, text);
            throw new Error(`Resend HTTP ${r.status}`);
          }

          console.log("[auth][email] Enviado con Resend a", identifier);
        } catch (e) {
          console.error("[auth][email] Error al enviar verificación:", e);
          throw e;
        }
      },
    });
  }

  // Ningún modo disponible
  throw new Error(
    "[auth] Debes configurar EMAIL_SERVER (SMTP) o RESEND_API_KEY (Resend) junto a EMAIL_FROM."
  );
}

  const authOptions: NextAuthOptions = {
  // ⚠️ Fuerza JWT para que el middleware pueda autorizar leyendo el token
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,

  adapter: PrismaAdapter(prisma),

  providers: [buildEmailProvider()],

  pages: {
    signIn: "/auth/sign-in",
  },

  callbacks: {
    /**
     * Respeta siempre callbackUrl relativo del mismo origen
     * (p.ej. /bienvenido?next=/wizard/step-1)
     */
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      try {
        const target = new URL(url, baseUrl);
        const sameOrigin = target.origin === baseUrl;
        console.log("[auth][redirect]", {
          url,
          baseUrl,
          target: target.toString(),
          sameOrigin,
        });
        if (sameOrigin) return target.toString();
      } catch (e) {
        console.log("[auth][redirect][error]", e);
      }
      return baseUrl;
    },

    // Propaga id de usuario en el token/session (opcional pero útil)
    async jwt({ token, user }: { token: JWT; user?: User | AdapterUser }) {
      if (user?.id) (token as any).uid = (user as any).id;
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && (token as any)?.uid) {
        (session.user as any).id = (token as any).uid;
      }
      return session;
    },
  },

  // debug: process.env.NODE_ENV !== "production",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
