// app/api/evaluate/route.ts (single-call premium report)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tryDebitCredit, refundCredit } from "@/lib/credits";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// ---------- helpers ----------
function toJson<T>(s: string | null | undefined): T {
  if (!s) throw new Error("Respuesta vacía del modelo");
  try { return JSON.parse(s) as T; } catch { throw new Error("JSON inválido desde OpenAI"); }
}

// Toma valores numéricos si vienen con esos nombres (no inventa, solo usa si existen)
function num(x: any): number | undefined {
  const n = typeof x === "string" ? Number(x.replace(/[^0-9.-]/g, "")) : Number(x);
  return Number.isFinite(n) ? n : undefined;
}

function derive(input: any) {
  const price = num(input?.price ?? input?.precio);
  const variableCost = num(input?.variableCost ?? input?.costoVariable);
  const fixedMonthlyCosts = num(input?.fixedMonthlyCosts ?? input?.gastosFijos);
  const clientsPerMonth = num(input?.clientsPerMonth ?? input?.clientesMensuales);
  const retentionMonths = num(input?.retentionMonths ?? input?.mesesRetencion);
  const cacAssumed = num(input?.cacAssumed ?? input?.cac);

  const unitMargin = (price != null && variableCost != null) ? price - variableCost : undefined;
  const grossMarginPct = (unitMargin != null && price) ? unitMargin / price : undefined;
  const breakEvenClients = (fixedMonthlyCosts != null && unitMargin) ? Math.ceil(fixedMonthlyCosts / Math.max(unitMargin, 1e-6)) : undefined;
  const annualRevenue = (price && clientsPerMonth) ? price * clientsPerMonth * 12 : undefined;
  const ltv = (price && grossMarginPct != null && retentionMonths) ? price * grossMarginPct * retentionMonths : undefined;
  const cacTarget = (ltv != null) ? ltv / 3 : undefined;
  const ltvOverCac = (ltv != null && cacAssumed) ? ltv / cacAssumed : undefined;

  return {
    price, variableCost, fixedMonthlyCosts, clientsPerMonth, retentionMonths, cacAssumed,
    unitMargin, grossMarginPct, breakEvenClients, annualRevenue, ltv, cacTarget, ltvOverCac,
  };
}

// ---------- handler ----------
export async function POST(req: Request) {
  // sesión
  const session: any = await getServerSession(authOptions as any);
  const email = session?.user?.email as string | undefined;
  if (!email) return new NextResponse("Unauthorized", { status: 401 });

  // userId
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ ok: false, error: "no_user" }, { status: 401 });
  const userId = user.id;

  // body + requestId
  const body = await req.json().catch(() => ({}));
  const requestId = body?.requestId || crypto.randomUUID();

  // Debitar 2 créditos (o DEBIT_PER_EVALUATE)
  const DEBIT = Number(process.env.DEBIT_PER_EVALUATE ?? "1") || 1;
  const debit = await tryDebitCredit(userId, requestId, DEBIT);
  if (!(debit as any)?.ok) {
    return NextResponse.json({ ok: false, error: "no_credits" }, { status: 402 });
  }

  try {
    // inputs que YA tienes (no invento nombres; paso lo que llegue)
    const input = body?.input ?? body;

    // país/sector si vienen (no invento ids)
    const country = body?.country ?? body?.pais ?? "CL";
    const sectorId = body?.sectorId ?? body?.sector;

    // derivados a partir de los nombres reales si existen
    const derived = derive(input);

    // Prompt: exigimos JSON con tus claves mínimas para que la UI no reviente
    const system = [
      "Eres un analista senior. Escribe un informe profesional, claro e inspirador que termine en acción.",
      "Debes DEVOLVER SOLO JSON (sin texto fuera del JSON).",
      "El JSON DEBE contener, como mínimo, estas claves y estructura EXACTA:",
      "{",
      '  "sections": {',
      '    "industryBrief": string,',
      '    "competitionLocal": string,',
      '    "swotAndMarket": string,',
      '    "finalVerdict": string',
      "  },",
      '  "ranking": { "score": number, "constraintsOK": boolean, "reasons": string[] }',
      "}",
      "",
      "Reglas:",
      "- Usa y CITA explícitamente los datos de entrada y los derivados si existen.",
      "- Si faltan datos, declara supuestos en el texto (p. ej. “asumimos CAC de X…”).",
      "- Tono ejecutivo y motivador; cada bloque debe cerrar con una acción concreta.",
      "- No entregues nada fuera del JSON; no uses markdown.",
    ].join("\n");

    const userMsg = [
      "DATOS DE ENTRADA DEL USUARIO (no inventes nombres; usa tal cual existan):",
      JSON.stringify({ country, sectorId, input }, null, 2),
      "",
      "DERIVADOS CALCULADOS (usar solo si existen):",
      JSON.stringify(derived, null, 2),
      "",
      "Objetivo: devolver el JSON mínimo exigido con contenido específico (no genérico).",
      "En 'finalVerdict' cierra con 3 próximos pasos concretos.",
      "El 'score' es 0..100. 'constraintsOK' refleja si los datos permiten ejecutar.",
    ].join("\n");

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
      // max_tokens: 1400,
    });

    const content = completion.choices?.[0]?.message?.content ?? "";
    const data = toJson<any>(content);

    // NORMALIZACIÓN mínima por seguridad de UI (si faltó algo, rellenamos defaults)
    if (!data.sections) data.sections = {};
    data.sections.industryBrief ??= "Resumen del rubro e hipótesis clave (faltaron datos: completa en el formulario).";
    data.sections.competitionLocal ??= "Competencia local: segmentación, rangos de precio, diferenciación propuesta.";
    data.sections.swotAndMarket ??= "FODA + tamaño de mercado: TAM/SAM/SOM estimados con supuestos explícitos.";
    data.sections.finalVerdict ??= "Veredicto + 3 próximos pasos con responsables y plazos (completa datos faltantes).";

    data.ranking ??= { score: 0, constraintsOK: false, reasons: ["Faltan datos para una evaluación completa."] };
    if (typeof data.ranking.score !== "number") data.ranking.score = 0;
    if (typeof data.ranking.constraintsOK !== "boolean") data.ranking.constraintsOK = false;
    if (!Array.isArray(data.ranking.reasons)) data.ranking.reasons = ["Normalizado por faltantes."];

    return NextResponse.json({
      ok: true,
      data,
      usage: completion.usage,
      model: completion.model,
    });
  } catch (err: unknown) {
    // Reembolso si falla
    await refundCredit(userId, requestId, DEBIT);
    const e = err as Error;
    console.error("[/api/evaluate] error:", e);
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
