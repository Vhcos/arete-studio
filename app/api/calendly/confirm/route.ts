import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { consumeSessionEntitlement } from "@/lib/credits";

const CAL_PAT = process.env.CALENDLY_PAT || "";

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any);
    const sessionEmail = (session?.user?.email || "").toLowerCase();
    const userId = session?.user?.id as string | undefined;

    if (!sessionEmail || !userId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    if (!CAL_PAT) {
      return NextResponse.json({ ok: false, error: "no_calendly_pat" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const inviteeUri: string = body?.inviteeUri || "";
    const eventUri: string = body?.eventUri || "";

    if (!inviteeUri) {
      return NextResponse.json({ ok: false, error: "missing_invitee_uri" }, { status: 400 });
    }

    // 1) Leemos el invitee desde Calendly (autenticado con PAT) y verificamos email
    const r = await fetch(inviteeUri, {
      headers: {
        Authorization: `Bearer ${CAL_PAT}`,
        "Content-Type": "application/json",
      },
    });

    if (!r.ok) {
      const msg = await r.text().catch(() => String(r.status));
      return NextResponse.json({ ok: false, error: "calendly_fetch_failed", detail: msg }, { status: 502 });
    }

    const j: any = await r.json().catch(() => ({}));
    // Formato v2: { resource: { email, uri, ... } }
    const inviteeEmail = (j?.resource?.email || j?.email || "").toLowerCase();

    if (!inviteeEmail) {
      return NextResponse.json({ ok: false, error: "invitee_email_missing" }, { status: 400 });
    }

    if (inviteeEmail !== sessionEmail) {
      // seguridad: el invitee debe ser el usuario logueado
      return NextResponse.json({ ok: false, error: "email_mismatch" }, { status: 403 });
    }

    // 2) Consumimos 1 crédito de sesión (idempotente por requestId)
    const base = eventUri || inviteeUri;
    const requestId = `cal:scheduled:${base}`;
    const res = await consumeSessionEntitlement(userId, requestId, 1);

    // 3) (Opcional) devolvemos el saldo de sesiones para actualizar UI
    const [grantsAgg, usesAgg] = await Promise.all([
      prisma.usageEvent.aggregate({
        where: { userId, kind: "session_grant" },
        _sum: { qty: true },
      }),
      prisma.usageEvent.aggregate({
        where: { userId, kind: "session_use" },
        _sum: { qty: true },
      }),
    ]);
    const grants = Number(grantsAgg._sum.qty ?? 0);
    const uses = Number(usesAgg._sum.qty ?? 0);
    const sessionCredits = Math.max(0, grants - uses);

    return NextResponse.json({ ok: true, consumed: !res?.skipped, sessionCredits });
  } catch (e: any) {
    console.error("[/api/calendly/confirm] error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
