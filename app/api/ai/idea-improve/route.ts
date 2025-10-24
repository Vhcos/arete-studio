// app/api/ai/idea-improve/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tryDebitCredit, refundCredit } from "@/lib/credits";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1";

// Flag para saltar cobro en dev
const SKIP_DEBIT = (process.env.SKIP_DEBIT_INTEL ?? "0") === "1";
// Monto a debitar (usa tu env o cae a DEBIT_PER_EVALUATE o 1)
const DEBIT =
  Number(process.env.DEBIT_PER_INTEL ?? process.env.DEBIT_PER_EVALUATE ?? "1") || 1;

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions as any);
  const email = session?.user?.email as string | undefined;
  if (!email) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const requestId = body?.requestId || crypto.randomUUID();
  const idea = (body?.idea ?? "").toString().trim();
  if (idea.length < 5) return NextResponse.json({ ok: false, error: "idea_muy_corta" }, { status: 400 });

  const u = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!u) return NextResponse.json({ ok: false, error: "no_user" }, { status: 401 });
  const userId = u.id;

  // Cobro (idéntico a /api/plan)
  if (!SKIP_DEBIT) {
    const debit = await tryDebitCredit(userId, requestId, DEBIT);
    if (!(debit as any)?.ok) {
      return NextResponse.json({ ok: false, error: "no_credits" }, { status: 402 });
    }
  }

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "Reescribe la idea en UNA oración clara (≤45 palabras), español neutro, sin inventar métricas." },
        { role: "user", content: idea },
      ],
      temperature: 0.3,
      max_tokens: 180,
    });

    const improved = completion.choices?.[0]?.message?.content?.toString().trim() ?? "";
    if (!improved) {
      if (!SKIP_DEBIT) await refundCredit(userId, requestId, DEBIT);
      return NextResponse.json({ ok: false, error: "sin_contenido" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      idea: improved,
      debited: !SKIP_DEBIT ? DEBIT : 0,
      model: completion.model,
      usage: completion.usage ?? null,
    });
  } catch (err: any) {
    if (!SKIP_DEBIT) await refundCredit(userId, requestId, DEBIT);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
