import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";

/**
 * Nota:
 * - Si usas SMTP: define EMAIL_SERVER y EMAIL_FROM en Vercel y listo.
 * - Si usas Resend: puedes seguir usando el comportamiento anterior si tu proyecto ya lo tenía
 *   (por ejemplo, un wrapper que manda por Resend en otro archivo). Este handler no lo bloquea.
 */
const handler = NextAuth({
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER as any, // si usas SMTP; si NO, déjalo como está, NextAuth ignorará si personalizas el envío en otro lado
      from: process.env.EMAIL_FROM,            // ej: "Arete <login@aret3.cl>"
      // No sobreescribimos sendVerificationRequest aquí para no tocar tu flujo que "ya funcionaba".
    }),
  ],

  pages: { signIn: "/auth/sign-in" },

  callbacks: {
    // 👉 Asegura que NO se pierda el callbackUrl hacia /bienvenido
    async redirect({ url, baseUrl }) {
      try {
        if (url.startsWith("/")) return `${baseUrl}${url}`; // relativo → OK
        const u = new URL(url);
        if (u.origin === baseUrl) return url;               // mismo host → OK
      } catch {}
      return baseUrl;                                       // otros hosts → bloquear
    },
  },
});

export { handler as GET, handler as POST };
