/*** apps/app/lib/credits.ts ***/
import { prisma } from "@/lib/prisma";

export async function tryDebitCredit(userId: string, requestId: string) {
  // idempotencia
  if (requestId) {
    const already = await prisma.usageEvent.findUnique({ where: { requestId } });
    if (already) return true;
  }
  return await prisma.$transaction(async (tx) => {
    const w = await tx.creditWallet.findUnique({ where: { userId } });
    if (!w || w.creditsRemaining <= 0) return false;

    await tx.creditWallet.update({
      where: { userId },
      data: { creditsRemaining: { decrement: 1 } },
    });

    await tx.usageEvent.create({
      data: { userId, qty: 1, kind: "ai", requestId },
    });

    return true;
  });
}

export async function refundCredit(userId: string, requestId: string) {
  if (!requestId) return;
  const used = await prisma.usageEvent.findUnique({ where: { requestId } });
  if (!used) return;

  await prisma.$transaction(async (tx) => {
    await tx.creditWallet.update({
      where: { userId },
      data: { creditsRemaining: { increment: 1 } },
    });
    await tx.usageEvent.create({
      data: { userId, qty: 1, kind: "refund", requestId: `${requestId}:refund` },
    });
  });
}
