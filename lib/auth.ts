import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";

/**
 * Provider resiliente:
 * - Si RESEND_API_KEY -> envía con Resend (sin nodemailer).
 * - Si EMAIL_SERVER   -> usa SMTP (plantilla por defecto de NextAuth).
 * - Si nada (dev/preview) -> no envía y LOGUEA el magic link.
 */
const useResend = !!process.env.RESEND_API_KEY;
const hasSMTP = !!process.env.EMAIL_SERVER;

const emailProvider: any = {
  from: process.env.EMAIL_FROM || "Arete <login@aret3.cl>",
  // Dummy si no hay SMTP; no se usará cuando sobreescribimos el envío.
  server: (hasSMTP ? process.env.EMAIL_SERVER : "smtp://user:pass@localhost:2525") as any,
};

if (useResend) {
  emailProvider.sendVerificationRequest = async ({ identifier, url }: any) => {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: emailProvider.from,
        to: identifier,
        subject: "Tu acceso — ARET3",
        html: `
          <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
            <p>Accede con este enlace:</p>
            <p><a href="${url}">${url}</a></p>
            <p style="color:#6b7280;font-size:12px">Este enlace expira pronto.</p>
          </div>
        `,
      }),
    });
  };
} else if (!hasSMTP) {
  // Dev/preview sin proveedor: no envía, pero loguea para pruebas
  emailProvider.sendVerificationRequest = async ({ identifier, url }: any) => {
    console.warn("[ARET3][DEV] Magic link (sin email provider):", { to: identifier, url });
  };
}

export const authOptions: NextAuthOptions = {
  providers: [EmailProvider(emailProvider)],
  pages: { signIn: "/auth/sign-in" },
  callbacks: {
    // Respeta callbackUrl relativo y mismo host (p. ej. /bienvenido?next=/wizard/step-1)
    async redirect({ url, baseUrl }) {
      try {
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        const u = new URL(url);
        if (u.origin === baseUrl) return url;
      } catch {}
      return baseUrl;
    },
  },
};
