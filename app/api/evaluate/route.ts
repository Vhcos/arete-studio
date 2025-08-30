/* eslint-disable @typescript-eslint/no-explicit-any */
export const runtime = 'edge';
export const preferredRegion = ['gru1'];

import OpenAI from 'openai';
import { z } from 'zod';
import { rankStandardReport } from '../../lib/nonAI-report';
import type { StandardReport } from '../../types/report';

// ---------- OpenAI client
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------- Modelo (solo familia GPT-5)
const RAW = (process.env.OPENAI_MODEL || 'gpt-5-mini').toLowerCase();
const MODEL_ALIASES: Record<string, string> = {
  'chatgpt-5-mini': 'gpt-5-mini', // por si escribes el alias de marketing
  'gpt-5': 'gpt-5',
  'gpt-5-mini-2025-08-07': 'gpt-5-mini', // opcional: versión fechada
};
const BASE_MODEL = MODEL_ALIASES[RAW] || RAW;
// Fallbacks SOLO dentro de la serie 5 (sin 4o/4o-mini)
const FALLBACK_MODELS = Array.from(new Set([BASE_MODEL, 'gpt-5', 'gpt-5-nano']));

// ---------- Esquema esperado
const AiSchema = z.object({
  industryBrief: z.string(),
  competitionLocal: z.string(),
  swotAndMarket: z.string(),
  finalVerdict: z.string(),
  metrics: z.object({ marketEstimateCLP: z.number().optional() }).optional(),
}).strict();

export async function POST(request: Request) {
  // 1) Validaciones básicas
  if (!process.env.OPENAI_API_KEY) {
    return json({ ok: false, error: 'OPENAI_API_KEY missing on server (.env/.vercel)' }, 500);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Bad JSON' }, 400);
  }

  const { input, scores } = body || {};
  if (!input) return json({ ok: false, error: 'Missing input' }, 400);

  // 2) Prompt corto y determinista para JSON
  const sys =
    'Eres analista de startups. RESPONDE SOLO JSON con {industryBrief, competitionLocal, swotAndMarket, finalVerdict, metrics{marketEstimateCLP}}. ' +
    'Reglas: industryBrief ≤30 palabras; competitionLocal ≤50 palabras (con precios $); swotAndMarket ≤50 palabras (FODA + mercado en CLP si posible); ' +
    'finalVerdict honesto (VERDE/ÁMBAR/ROJO + razón). Nada fuera del JSON.';
  const usr = makeUserPrompt(input, scores);

  // 3) Llamada a OpenAI (Responses API) con fallback dentro de GPT-5
  const payloadBase = {
    input: [
      { role: 'system', content: sys },
      { role: 'user', content: usr },
    ] as const,
    response_format: { type: 'json_object' as const },
    temperature: 0.2,
    max_output_tokens: 1200,
  };

  let raw = '';
  let usedModel = '';
  let lastErr: any;

  for (const model of FALLBACK_MODELS) {
    try {
      const r = await client.responses.create({ ...payloadBase, model });
      usedModel = model;
      // output_text (SDKs recientes) + fallback manual
      // @ts-expect-error - propiedad puede no estar tipada
      raw = (r.output_text || '') as string;
      if (!raw) {
        // @ts-expect-error - navegación genérica por si cambia la forma
        const maybe = r.output?.[0]?.content?.[0]?.text;
        raw = typeof maybe === 'string' ? maybe : '';
      }
      if (!raw) raw = JSON.stringify(r);
      break; // éxito
    } catch (e: any) {
      const msg = String(e?.message || '');
      // Si es gating o model_not_found, probamos siguiente fallback
      if (msg.includes('model_not_found') || msg.includes('not available')) {
        lastErr = e;
        continue;
      }
      // Otros errores: devolvemos detalle
      return json({ ok: false, error: 'OpenAI request failed', details: msg, modelTried: model }, 500);
    }
  }

  if (!raw) {
    return json(
      {
        ok: false,
        error: 'No se pudo obtener respuesta de la IA',
        details: String(lastErr?.message || lastErr || 'unknown'),
        modelsTried: FALLBACK_MODELS,
      },
      502,
    );
  }

  // 4) Normalizar a StandardReport (tolerante si el JSON viene mal)
  const standardReport = toStandardReport(raw);

  // 5) Payload compatible con tu applyIA
  const aiPayload = {
    scores: { byKey: scores?.byKey ?? {} },
    reasons: {},
    hints: {},
    verdict: {
      title: standardToTitle(standardReport.sections.finalVerdict),
      subtitle: standardReport.sections.finalVerdict,
      actions: [],
    },
    risks: [],
    experiments: [],
    meta: { model: usedModel },
    narrative: [
      standardReport.sections.industryBrief,
      standardReport.sections.competitionLocal,
      standardReport.sections.swotAndMarket,
      standardReport.sections.finalVerdict,
    ].join('\n\n'),
  };

  const debug =
    process.env.NODE_ENV !== 'production'
      ? { prompt: { sys, usr }, raw, usedModel, tried: FALLBACK_MODELS }
      : undefined;

  return json({ ok: true, aiPayload, standardReport, debug });
}

// ---------- helpers
function json(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
function safe(v: any) {
  return (v ?? '').toString().slice(0, 400);
}
function num(x: any) {
  const n = typeof x === 'string' ? parseFloat(x.replace(/\./g, '').replace(',', '.')) : +x;
  return isFinite(n) ? n : 0;
}
function makeUserPrompt(input: any, scores: any) {
  return [
    `idea:${safe(input?.idea)}`,
    `ventaja:${safe(input?.ventajaTexto)}`,
    `rubro:${safe(input?.rubro)}@${safe(input?.ubicacion)}`,
    `ventas_mensual:${num(input?.ingresosMeta)}|ticket:${num(input?.ticket)}|costo_unit:${num(input?.costoUnit)}|CAC:${num(input?.cac)}|frecuencia_anual:${num(input?.frecuenciaAnual)}`,
    `gastos_fijos:${num(input?.gastosFijos)}|capital_trabajo:${num(input?.capitalTrabajo)}|meses_PE:${num(input?.mesesPE)}`,
    `seniales:${safe(input?.testeoPrevio)}`,
  ].join('\n');
}
function toStandardReport(aiText: string): StandardReport {
  let parsed: any = {};
  try { parsed = JSON.parse(aiText); } catch { parsed = {}; }
  const safeParsed = AiSchema.safeParse(parsed);
  const v = safeParsed.success
    ? safeParsed.data
    : { industryBrief: '', competitionLocal: '', swotAndMarket: '', finalVerdict: '', metrics: {} };

  const sections = {
    industryBrief: v.industryBrief || '',
    competitionLocal: v.competitionLocal || '',
    swotAndMarket: v.swotAndMarket || '',
    finalVerdict: v.finalVerdict || '',
  };

  const ranking = rankStandardReport({
    ...sections,
    marketEstimateCLP: v.metrics?.marketEstimateCLP,
  });

  return {
    source: 'AI',
    createdAt: new Date().toISOString(),
    sections,
    metrics: { marketEstimateCLP: v.metrics?.marketEstimateCLP },
    ranking,
  };
}
function standardToTitle(finalVerdict: string) {
  if (/VERDE/i.test(finalVerdict)) return 'VERDE – Avanzar';
  if (/ÁMBAR|AMBAR/i.test(finalVerdict)) return 'ÁMBAR – Ajustar';
  if (/ROJO/i.test(finalVerdict)) return 'ROJO – Pausar';
  return 'Evaluación';
}
