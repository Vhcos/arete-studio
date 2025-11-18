// lib/credits.ts
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type UsageKind = "ai" | "grant" | "refund" | "session_grant" | "session_use";

export class InsufficientCreditsError extends Error {
  code = "no_credits" as const;
  status = 402;
  remaining: number;
  required: number;
  userId: string;
  constructor(p: { userId: string; remaining: number; required: number; message?: string }) {
    super(p.message || "Créditos insuficientes");
    this.name = "InsufficientCreditsError";
    this.userId = p.userId;
    this.remaining = p.remaining;
    this.required = p.required;
  }
}

export function mapCreditErrorToHttp(err: unknown): { status: number; body: any } | null {
  if (err instanceof InsufficientCreditsError) {
    return {
      status: err.status,
      body: {
        ok: false,
        code: err.code,
        message: "Créditos insuficientes: revisa nuestros planes y adquiere más créditos",
        remaining: err.remaining,
        required: err.required,
        userId: err.userId,
      },
    };
  }
  return null;
}

function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || "";
  return new Set(
    raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
  );
}

async function getUserEmail(userId: string): Promise<string | null> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  return u?.email ?? null;
}
async function isAdmin(userId: string): Promise<boolean> {
  const email = await getUserEmail(userId);
  return !!(email && getAdminEmails().has(email.toLowerCase()));
}

type Tx = Prisma.TransactionClient;

async function findUsageByRequest(tx: Tx, requestId: string) {
  return tx.usageEvent.findFirst({ where: { requestId }, select: { id: true } });
}
async function recordEvent(tx: Tx, data: { userId: string; qty: number; kind: UsageKind; requestId: string }) {
  await tx.usageEvent.create({ data });
}
async function getOrCreateWallet(tx: Tx, userId: string) {
  return tx.creditWallet.upsert({
    where: { userId },
    create: { userId, creditsRemaining: 0 },
    update: {},
    select: { userId: true, creditsRemaining: true },
  });
}

export async function tryDebitCredit(
  userId: string,
  requestId: string,
  qty = 1
): Promise<{ ok: true; newBalance: number; idempotent?: true; skipped?: true }> {
  if (qty <= 0) {
    const bal = (await prisma.creditWallet.findUnique({ where: { userId }, select: { creditsRemaining: true } }))?.creditsRemaining ?? 0;
    return { ok: true, newBalance: bal, skipped: true as const };
  }

  if (await isAdmin(userId)) {
    await prisma.$transaction(async (tx) => {
      const exists = await findUsageByRequest(tx, requestId);
      if (!exists) await recordEvent(tx, { userId, qty: 0, kind: "ai", requestId });
    });
    const bal = (await prisma.creditWallet.findUnique({ where: { userId }, select: { creditsRemaining: true } }))?.creditsRemaining ?? 0;
    return { ok: true, newBalance: bal, skipped: true as const };
  }

  return prisma.$transaction(async (tx) => {
    const exists = await findUsageByRequest(tx, requestId);
    if (exists) {
      const w = await getOrCreateWallet(tx, userId);
      return { ok: true, newBalance: w.creditsRemaining, idempotent: true as const };
    }

    const w = await getOrCreateWallet(tx, userId);
    if (w.creditsRemaining < qty) {
      throw new InsufficientCreditsError({ userId, remaining: w.creditsRemaining, required: qty });
    }

    const updated = await tx.creditWallet.update({
      where: { userId },
      data: { creditsRemaining: { decrement: qty } },
      select: { creditsRemaining: true },
    });
    await recordEvent(tx, { userId, qty, kind: "ai", requestId });
    return { ok: true, newBalance: updated.creditsRemaining };
  });
}

export async function refundCredit(userId: string, requestId: string, qty = 1) {
  if (qty <= 0) {
    const bal = (await prisma.creditWallet.findUnique({ where: { userId }, select: { creditsRemaining: true } }))?.creditsRemaining ?? 0;
    return { ok: true, newBalance: bal, idempotent: true as const };
  }
  return prisma.$transaction(async (tx) => {
    const exists = await findUsageByRequest(tx, requestId);
    if (exists) {
      const w = await getOrCreateWallet(tx, userId);
      return { ok: true, newBalance: w.creditsRemaining, idempotent: true as const };
    }
    const updated = await tx.creditWallet.upsert({
      where: { userId },
      create: { userId, creditsRemaining: qty },
      update: { creditsRemaining: { increment: qty } },
      select: { creditsRemaining: true },
    });
    await recordEvent(tx, { userId, qty, kind: "refund", requestId });
    return { ok: true, newBalance: updated.creditsRemaining };
  });
}

export async function grantCredits(userId: string, requestId: string, qty: number) {
  if (qty <= 0) {
    const bal = (await prisma.creditWallet.findUnique({ where: { userId }, select: { creditsRemaining: true } }))?.creditsRemaining ?? 0;
    return { ok: true, newBalance: bal, skipped: true as const };
  }
  return prisma.$transaction(async (tx) => {
    const exists = await findUsageByRequest(tx, requestId);
    if (exists) {
      const w = await getOrCreateWallet(tx, userId);
      return { ok: true, newBalance: w.creditsRemaining, idempotent: true as const };
    }
    const updated = await tx.creditWallet.upsert({
      where: { userId },
      create: { userId, creditsRemaining: qty },
      update: { creditsRemaining: { increment: qty } },
      select: { creditsRemaining: true },
    });
    await recordEvent(tx, { userId, qty, kind: "grant", requestId });
    return { ok: true, newBalance: updated.creditsRemaining };
  });
}

export async function incrementSessionEntitlement(userId: string, requestId: string, qty = 1) {
  if (qty <= 0) return { ok: true, idempotent: true as const };
  return prisma.$transaction(async (tx) => {
    const exists = await findUsageByRequest(tx, requestId);
    if (exists) return { ok: true, idempotent: true as const };
    await recordEvent(tx, { userId, qty, kind: "session_grant", requestId });
    return { ok: true };
  });
}

export async function consumeSessionEntitlement(userId: string, requestId: string, qty = 1) {
  if (qty === 0) return { ok: true, idempotent: true as const };
  return prisma.$transaction(async (tx) => {
    const exists = await findUsageByRequest(tx, requestId);
    if (exists) return { ok: true, idempotent: true as const };
    await recordEvent(tx, { userId, qty, kind: "session_use", requestId });
    return { ok: true };
  });
}
