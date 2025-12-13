// app/api/ai/funding-impact-improve/route.ts
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

// Mismos flags que idea-improve / advantage-improve
const SKIP_DEBIT = (process.env.SKIP_DEBIT_INTEL ?? "0") === "1";
const DEBIT =
  Number(process.env.DEBIT_PER_INTEL ?? process.env.DEBIT_PER_EVALUATE ?? "1") || 1;

function safeStr(x: any) {
  return (x ?? "").toString().trim();
}

export async function POST(req: Request) {
  // 1) Auth
  const session: any = await getServerSession(authOptions as any);
  const email = session?.user?.email as string | undefined;
  if (!email) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  // 2) Body
  const body = await req.json().catch(() => ({} as any));
  const requestId = body?.requestId || crypto.randomUUID();

  const current = safeStr(body?.current);
  const projectName = safeStr(body?.projectName);
  const idea = safeStr(body?.idea);
  const ventajaTexto = safeStr(body?.ventajaTexto);
  const ubicacion = safeStr(body?.ubicacion);
  const sectorId = safeStr(body?.sectorId);

  const indicadores = Array.isArray(body?.indicadores) ? body.indicadores : [];
  if (!Array.isArray(indicadores) || indicadores.length === 0) {
    return NextResponse.json({ ok: false, error: "sin_indicadores" }, { status: 400 });
  }

  // 3) UserId
  const u = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!u) return NextResponse.json({ ok: false, error: "no_user" }, { status: 401 });
  const userId = u.id;

  // 4) Cobro (idéntico)
  if (!SKIP_DEBIT) {
    const debit = await tryDebitCredit(userId, requestId, DEBIT);
    if (!(debit as any)?.ok) {
      return NextResponse.json({ ok: false, error: "no_credits" }, { status: 402 });
    }
  }

  try {
    const system =
      "Eres un redactor experto en postulaciones a fondos. " +
      "Escribe en español (Chile neutro), 6 a 10 líneas, claro y sobrio. " +
      "No inventes datos: usa SOLO los números entregados (base/meta) y el contexto provisto. " +
      "Si falta un dato, omítelo. No agregues porcentajes o cifras nuevas.";

    const payload = {
      current: current || null,
      projectName: projectName || null,
      idea: idea || null,
      ventajaTexto: ventajaTexto || null,
      ubicacion: ubicacion || null,
      sectorId: sectorId || null,
      mesesPE: body?.mesesPE ?? null,
      capitalTrabajo: body?.capitalTrabajo ?? null,
      indicadores,
    };

    const userPrompt = [
      "Necesito una narrativa de impacto para pegar en formularios (6–10 líneas).",
      "Debe basarse estrictamente en estos 4 indicadores (base y meta 6 meses) y en el contexto.",
      "",
      "Narrativa actual (puede estar vacía):",
      payload.current ?? "(vacía)",
      "",
      "Contexto:",
      `- projectName: ${payload.projectName ?? ""}`,
      `- ubicacion: ${payload.ubicacion ?? ""}`,
      `- sectorId: ${payload.sectorId ?? ""}`,
      `- idea: ${payload.idea ?? ""}`,
      `- ventajaTexto: ${payload.ventajaTexto ?? ""}`,
      `- mesesPE: ${payload.mesesPE ?? ""}`,
      `- capitalTrabajo: ${payload.capitalTrabajo ?? ""}`,
      "",
      "Indicadores (base y meta 6 meses):",
      JSON.stringify(payload.indicadores, null, 2),
      "",
      "Entrega SOLO el texto final (sin títulos, sin viñetas obligatorias, sin anexos).",
    ].join("\n");

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.35,
      max_tokens: 350,
    });

    const narrativa = completion.choices?.[0]?.message?.content?.toString().trim() ?? "";
    if (!narrativa) {
      if (!SKIP_DEBIT) await refundCredit(userId, requestId, DEBIT);
      return NextResponse.json({ ok: false, error: "sin_contenido" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      narrativa,
      debited: !SKIP_DEBIT ? DEBIT : 0,
      model: completion.model,
      usage: completion.usage ?? null,
    });
  } catch (err: any) {
    if (!SKIP_DEBIT) await refundCredit(userId, requestId, DEBIT);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
