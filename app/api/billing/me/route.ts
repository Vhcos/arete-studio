// app/api/billing/me/route.ts
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth"; 
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    // Resolvemos el user.id
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "no_user" }, { status: 401 });
    }

    // 1) ¿Hay wallet?
    let wallet = await prisma.creditWallet.findUnique({ where: { userId: user.id } });

    if (!wallet) {
      // No hay wallet ⇒ creamos con seed 10 (una sola vez)
      await prisma.$transaction([
        prisma.creditWallet.create({
          data: { userId: user.id, creditsRemaining: 10, plan: "free" },
        }),
        prisma.usageEvent.create({
          data: { userId: user.id, qty: 10, kind: "seed" },
        }),
      ]);
      wallet = await prisma.creditWallet.findUnique({ where: { userId: user.id } });
    } else {
      // 2) Hay wallet: ¿alguna vez recibió “seed”?
      const hadSeed = await prisma.usageEvent.findFirst({
        where: { userId: user.id, kind: "seed" },
        select: { id: true },
      });

      if (!hadSeed) {
        // Wallet existente pero sin seed histórico ⇒ seed única
        await prisma.$transaction([
          prisma.creditWallet.update({
            where: { userId: user.id },
            data: { creditsRemaining: { increment: 10 } },
          }),
          prisma.usageEvent.create({
            data: { userId: user.id, qty: 10, kind: "seed" },
          }),
        ]);
        wallet = await prisma.creditWallet.findUnique({ where: { userId: user.id } });
      }
    }

    return NextResponse.json({
      ok: true,
      creditsRemaining: wallet?.creditsRemaining ?? 0,
      plan: wallet?.plan ?? "free",
    });
  } catch (err) {
    console.error("[/api/billing/me] error:", err);
    return NextResponse.json({ ok: false, error: String((err as Error)?.message ?? err) }, { status: 500 });
  }
}