// app/api/plan/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { tryDebitCredit, refundCredit } from "@/lib/credits";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Mantén mini a menos que definas AI_MODEL_PLAN en .env.local
const MODEL = process.env.AI_MODEL_PLAN || process.env.OPENAI_MODEL || "gpt-4o-mini";
const TEMPERATURE = 0.2;

// ---------- Utils ----------
function safeJSON<T = any>(s: string | null | undefined, fallback: T): T {
  try {
    if (!s) return fallback;
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function buildUserPrompt(p: any) {
  const ctx = {
    proyecto: {
      nombre: p?.projectName || p?.proyecto?.nombre || "",
      idea: p?.ideaTexto || p?.proyecto?.idea || "",
      ventaja: p?.ventajaTexto || p?.proyecto?.ventaja || "",
      rubro: p?.rubro || p?.proyecto?.rubro || "",
      ubicacion: p?.ubicacion || p?.proyecto?.ubicacion || "",
    },
    metricas: {
      ticket: p?.ticket ?? p?.metricas?.ticket ?? null,
      margenUnitario: p?.mcUnit ?? p?.metricas?.margenUnitario ?? null,
      margenPct: p?.marginPct ?? p?.metricas?.margenPct ?? null,
      ventaObjetivoMensual: p?.ingresosMeta ?? p?.metricas?.ventaObjetivoMensual ?? null,
      ventasPE: p?.ventasPE ?? p?.metricas?.ventasPE ?? null,
      clientesPE: p?.clientsPE ?? p?.metricas?.clientesPE ?? null,
      capitalTrabajo6m: p?.capitalTrabajo ?? p?.metricas?.capitalTrabajo6m ?? null,
      N_clientesMes_objetivo: p?.N ?? p?.metricas?.N_clientesMes_objetivo ?? null,
      Q_traficoRequerido: p?.Q ?? p?.metricas?.Q_traficoRequerido ?? null,
      CAC: p?.CAC ?? p?.metricas?.CAC ?? null,
      CPL: p?.CPL ?? p?.metricas?.CPL ?? null,
    },
    contexto: {
      segmento: p?.segmento || p?.contexto?.segmento || "",
      intensidadCompetencia: p?.intensidadCompetencia || p?.contexto?.intensidadCompetencia || "",
      canales: p?.canales || p?.contexto?.canales || [],
      riesgosClave: p?.riesgosClave || p?.contexto?.riesgosClave || [],
    },
  };
  return JSON.stringify(ctx, null, 2);
}

const SYSTEM_PROMPT = `Eres un analista de negocio senior. Escribes en español claro, cercano y profesional.
Responde SIEMPRE en JSON válido UTF-8, sin texto adicional, cumpliendo el esquema.
Mantén foco en el proyecto específico; evita generalidades.`;

const SCHEMA_INSTRUCTION = `DEVUELVE EXCLUSIVAMENTE un JSON con esta forma:
{
  "summary": "string",
  "industryBrief": "string",
  "competencia": ["string", "string", "..."],
  "regulacion": ["string", "string", "..."],
  "plan100": "string",
  "plan6m": ["string", "string", "..."]
}
Reglas:
- "competencia": 5–7 bullets accionables (posicionamiento, precio, diferenciación, canales, prueba social).
- "regulacion": 5–7 bullets (Chile) según rubro, tamaño y tipo de venta.
- "plan100": 1 párrafo con foco práctico (100 palabras).
- "plan6m": 6–8 bullets con hitos M1..M6, medibles.
- Usa los números tal cual; no ajustes nada.
- Integra "idea" y "ventaja" en "summary".
- "industryBrief": 5–6 líneas con insight del rubro.
- Responde SOLO el JSON.`;

// ---------- Handler ----------
type SessionUserWithId = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions) as (null | { user?: SessionUserWithId });
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  const userId = session.user.id;

  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  // requestId para el control de créditos (si ya viene, respétalo)
  const requestId: string =
    payload?.requestId || `plan_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // Debitar crédito (1 por defecto)
  const debitUnits = Number(process.env.DEBIT_PER_PLAN ?? "1") || 1;
  const okDebit = await tryDebitCredit(userId, requestId, debitUnits);
  if (!okDebit) {
    return NextResponse.json(
      { ok: false, error: "Créditos insuficientes para generar el plan." },
      { status: 402 }
    );
  }

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: TEMPERATURE,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: SCHEMA_INSTRUCTION },
        { role: "user", content: buildUserPrompt(payload) },
      ],
    });

    const content = completion.choices?.[0]?.message?.content ?? "{}";
    let aiPlan: any = safeJSON(content, {});

    // Normalización defensiva (si el modelo devolviera llaves en EN)
    aiPlan.competencia = aiPlan.competencia || aiPlan.competition || [];
    aiPlan.regulacion = aiPlan.regulacion || aiPlan.regulation || [];
    aiPlan.summary = aiPlan.summary || "";
    aiPlan.industryBrief = aiPlan.industryBrief || "";
    aiPlan.plan100 = aiPlan.plan100 || "";
    aiPlan.plan6m = aiPlan.plan6m || [];

    return NextResponse.json({
      ok: true,
      aiPlan,
      usage: completion.usage,
      model: completion.model,
      requestId,
    });
  } catch (err: unknown) {
    // Reembolso si la IA falla
    await refundCredit(userId, requestId, debitUnits);
    const e = err as Error;
    console.error("[/api/plan] error:", e);
    return NextResponse.json({ ok: false, error: String(e.message ?? e) }, { status: 500 });
  }
}
