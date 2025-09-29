//app/api/billing/me/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };

  try {
    const session: any = await getServerSession(authOptions as any);
    const email = session?.user?.email as string | undefined;
    const sessionUserId = session?.user?.id as string | undefined;

    if (!email && !sessionUserId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers });
    }

    // resolve userId por id directo o por email
    let userId = sessionUserId || null;
    if (!userId && email) {
      const u = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      userId = u?.id || null;
    }
    if (!userId) {
      return NextResponse.json({ ok: false, error: "no_user" }, { status: 401, headers });
    }

    // Auto-curación: crear wallet si falta, con seed=20 (una sola vez)
    let wallet = await prisma.creditWallet.findUnique({ where: { userId } });

    if (!wallet) {
      wallet = await prisma.creditWallet.create({
        data: { userId, creditsRemaining: 20 },
      });
      await prisma.usageEvent.create({
        data: { userId, kind: "seed", qty: 20 },
      });
    }
    // ---- saldo de asesorías (grants - uses) ----
     const [grants, uses] = await Promise.all([
       prisma.usageEvent.aggregate({
         where: { userId, kind: "session_grant" },
         _sum: { qty: true },
       }),
     prisma.usageEvent.aggregate({
       where: { userId, kind: "session_use" },
         _sum: { qty: true },
      }),
    ]);

    const sessionCredits = Math.max(
     0,
     (grants._sum.qty ?? 0) - (uses._sum.qty ?? 0)
    );
    return NextResponse.json(
      {
        ok: true,
        creditsRemaining: wallet.creditsRemaining,
        plan: (wallet as any).plan ?? undefined,
        sessionCredits, // <- nuevo campo
      },
      { headers }
    );
  } catch (e: any) {
    console.error("[/api/billing/me] error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500, headers });
  }
}
