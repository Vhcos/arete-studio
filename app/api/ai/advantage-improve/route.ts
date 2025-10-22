//  app/api/advantage-improve/route.ts
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

// Mismos flags que idea-improve
const SKIP_DEBIT = (process.env.SKIP_DEBIT_INTEL ?? "0") === "1";
const DEBIT =
  Number(process.env.DEBIT_PER_INTEL ?? process.env.DEBIT_PER_EVALUATE ?? "1") || 1;

export async function POST(req: Request) {
  // 1) Sesión
  const session: any = await getServerSession(authOptions as any);
  const email = session?.user?.email as string | undefined;
  if (!email) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // 2) Inputs
  const body = await req.json().catch(() => ({}));
  const requestId = body?.requestId || crypto.randomUUID();
  const idea = (body?.idea ?? "").toString().trim();
  const sectorId = (body?.sectorId ?? "").toString().trim();
  const ubicacion = (body?.ubicacion ?? "").toString().trim();
  const current = (body?.current ?? "").toString().trim();

  const u = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!u) return NextResponse.json({ ok: false, error: "no_user" }, { status: 401 });
  const userId = u.id;

  // 3) Cobro
  if (!SKIP_DEBIT) {
    const debit = await tryDebitCredit(userId, requestId, DEBIT);
    if (!(debit as any)?.ok) {
      return NextResponse.json({ ok: false, error: "no_credits" }, { status: 402 });
    }
  }

  // 4) IA enfocada en ventaja diferenciadora (usa idea + rubro + ubicación + borrador)
  try {
    const system = [
      "Eres un estratega de posicionamiento. Ayudas a definir una 'ventaja diferenciadora' concreta.",
      "Devuelve 1–2 frases (máximo 45 palabras), español neutro, sin métricas inventadas ni claims vacíos.",
      "Enfatiza el valor único: nicho, experiencia/recursos, rapidez, costos, calidad/servicio, marca, canal, o combinación.",
      "No uses listas, devuelve SOLO texto plano.",
    ].join("\n");

    const userMsg = [
      idea ? `Idea: ${idea}` : "Idea: (sin idea)",
      sectorId ? `Sector (rubro): ${sectorId}` : "Sector (rubro): (sin sector)",
      ubicacion ? `Ubicación: ${ubicacion}` : "Ubicación: (sin ubicación)",
      current ? `Borrador del usuario: ${current}` : "",
      "Genera una propuesta breve y clara de ventaja diferenciadora alineada al contexto.",
    ].filter(Boolean).join("\n");

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
      temperature: 0.4,
      max_tokens: 200,
    });

    const text = completion.choices?.[0]?.message?.content?.toString().trim() ?? "";
    if (!text) {
      if (!SKIP_DEBIT) await refundCredit(userId, requestId, DEBIT);
      return NextResponse.json({ ok: false, error: "sin_contenido" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      ventaja: text,
      debited: !SKIP_DEBIT ? DEBIT : 0,
      model: completion.model,
      usage: completion.usage ?? null,
    });
  } catch (err: any) {
    if (!SKIP_DEBIT) await refundCredit(userId, requestId, DEBIT);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
