export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import NextAuth, {
  type NextAuthOptions,
  type User,
  type Account,
} from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import type { Adapter } from "next-auth/adapters";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "database" },
  pages: { signIn: "/auth/sign-in" },
  debug: process.env.NODE_ENV !== "production",

  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url, provider }) {
        // 👇 Aquí logueamos la creación del “token/enlace”
        if (process.env.NODE_ENV !== "production") {
          console.log("🔗 Magic link DEV:", identifier, url);
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

  // ✅ Solo eventos soportados por tu versión
  events: {
    async linkAccount(message: { user: User; account: Account }) {
      console.log("🔗 linkAccount:", message.user?.id);
    },
    async createUser(message: { user: User }) {
      console.log("👤 createUser:", message.user?.email);
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
