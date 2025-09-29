/**
 * lib/credits.ts
 * Manejo de créditos con cantidad variable y whitelist de admins.
 * Mantiene tu esquema: CreditWallet + UsageEvent.
 */
import { prisma } from "@/lib/prisma";

/** Admins con crédito ilimitado (no se debita) */
function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

async function getUserEmail(userId: string): Promise<string | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return u?.email ?? null;
}

/**
 * Debita 'qty' créditos (default 1).
 * Idempotencia: si usas requestId único en UsageEvent, puedes chequear antes.
 */
export async function tryDebitCredit(userId: string, requestId: string, qty: number = 1) {
  // Admin: no debita
  const email = await getUserEmail(userId);
  if (email && getAdminEmails().has(email.toLowerCase())) return { ok: true, skipped: true };

  return await prisma.$transaction(async (tx) => {
    const w = await tx.creditWallet.findUnique({ where: { userId } });
    if (!w || w.creditsRemaining < qty) return { ok: false, error: "no_credits" as const };

    await tx.creditWallet.update({
      where: { userId },
      data: { creditsRemaining: { decrement: qty } },
    });

    await tx.usageEvent.create({
      data: { userId, qty, kind: "ai", requestId },
    });

    return { ok: true };
  });
}

/**
 * Reembolsa 'qty' créditos (default 1).
 * Si no quieres duplicar reembolsos, puedes guardar y revisar un requestId:refund.
 */
export async function refundCredit(userId: string, requestId: string, qty: number = 1) {
  return await prisma.$transaction(async (tx) => {
    await tx.creditWallet.upsert({
      where: { userId },
      create: { userId, creditsRemaining: qty },
      update: { creditsRemaining: { increment: qty } },
    });
    await tx.usageEvent.create({
      data: { userId, qty, kind: "refund", requestId: `${requestId}:refund` },
    });
    return { ok: true };
  });
}

/**
 * Otorga 'qty' créditos positivos al usuario (e.g., compra pack).
 * Idempotente por requestId.
 */
export async function grantCredits(userId: string, requestId: string, qty: number) {
  if (qty <= 0) return { ok: true, skipped: true as const };
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.usageEvent.findUnique({ where: { requestId } }).catch(() => null);
    if (existing) return { ok: true, skipped: true as const };

    await tx.creditWallet.upsert({
      where: { userId },
      create: { userId, creditsRemaining: qty },
      update: { creditsRemaining: { increment: qty } },
    });
    await tx.usageEvent.create({
      data: { userId, qty, kind: "grant", requestId },
    });
    return { ok: true };
  });
}

/**
 * Registra add-on de sesión (idempotente).
 */
export async function incrementSessionEntitlement(userId: string, requestId: string, qty: number = 1) {
  if (qty <= 0) return { ok: true, skipped: true as const };
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.usageEvent.findUnique({ where: { requestId } }).catch(() => null);
    if (existing) return { ok: true, skipped: true as const };
    await tx.usageEvent.create({
      data: { userId, qty, kind: "session_grant", requestId },
    });
    return { ok: true };
  });
}
