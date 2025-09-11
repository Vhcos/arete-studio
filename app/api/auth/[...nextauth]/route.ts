import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";

const handler = NextAuth({
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER as any,
      from: process.env.EMAIL_FROM,
      // Sin sendVerificationRequest: usa plantilla por defecto y respeta callbackUrl
    }),
  ],
  pages: { signIn: "/auth/sign-in" },
  callbacks: {
    async redirect({ url, baseUrl }) {
      try {
        if (url.startsWith("/")) return `${baseUrl}${url}`; // relativo ⇒ OK
        const u = new URL(url);
        if (u.origin === baseUrl) return url;               // mismo host ⇒ OK
      } catch {}
      return baseUrl;                                       // otros hosts ⇒ bloquea
    },
  },
});

export { handler as GET, handler as POST };
