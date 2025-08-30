/* eslint-disable @typescript-eslint/no-explicit-any */
export const runtime = 'edge';
export const preferredRegion = ['gru1'];

import OpenAI from 'openai';
import { z } from 'zod';
import { rankStandardReport } from '../../lib/nonAI-report';
import type { StandardReport } from '../../types/report';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const AiSchema = z.object({
  industryBrief: z.string(),
  competitionLocal: z.string(),
  swotAndMarket: z.string(),
  finalVerdict: z.string(),
  metrics: z.object({ marketEstimateCLP: z.number().optional() }).optional(),
}).strict();

export async function POST(request: Request) {
  // 1) Validaciones básicas para evitar 500 silenciosos
  if (!process.env.OPENAI_API_KEY) {
    return json({ error: 'OPENAI_API_KEY missing on server (.env.local)' }, 500);
  }

  let body:any;
  try { body = await request.json(); }
  catch { return json({ error: 'Bad JSON' }, 400); }

  const { input, scores } = body || {};
  if (!input) return json({ error: 'Missing input' }, 400);

  // 2) Prompt corto (determinista para JSON)
  const sys =
    'Eres analista de startups. RESPONDE SOLO JSON con {industryBrief, competitionLocal, swotAndMarket, finalVerdict, metrics{marketEstimateCLP}}. ' +
    'Reglas: industryBrief ≤30 palabras; competitionLocal ≤50 palabras (con precios $); swotAndMarket ≤50 palabras (FODA + mercado CLP si posible); ' +
    'finalVerdict honesto (VERDE/ÁMBAR/ROJO + razón). Nada fuera del JSON.';

  const usr = makeUserPrompt(input, scores);

  let raw = '';
  try {
    const r = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: usr },
      ],
    });
    raw = (r.choices[0]?.message?.content || '').trim();
  } catch (e:any) {
    // Devuelve por qué falló exactamente (clave para ti)
    return json({
      error: 'OpenAI request failed',
      details: e?.message ?? e,
      status: e?.status,
      type: e?.error?.type,
    }, 500);
  }

  // 3) Normalizar a StandardReport (tolerante si el JSON viene mal)
  const standardReport = toStandardReport(raw);

  // 4) Payload compatible con tu applyIA (narrativa + título)
  const aiPayload = {
    scores: { byKey: scores?.byKey ?? {} },
    reasons: {},
    hints: {},
    verdict: {
      title: standardToTitle(standardReport.sections.finalVerdict),
      subtitle: standardReport.sections.finalVerdict,
      actions: []
    },
    risks: [],
    experiments: [],
    meta: {},
    narrative: [
      standardReport.sections.industryBrief,
      standardReport.sections.competitionLocal,
      standardReport.sections.swotAndMarket,
      standardReport.sections.finalVerdict,
    ].join('\n\n'),
  };

  // 5) En dev, te mando contexto útil para depurar si algo sale raro
  const debug = process.env.NODE_ENV !== 'production' ? { prompt: { sys, usr }, raw } : undefined;

  return json({ aiPayload, standardReport, debug });
}

// -------- helpers
function json(obj:any, status=200){
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
function safe(v:any){ return (v ?? '').toString().slice(0, 400); }
function makeUserPrompt(input:any, scores:any){
  return [
    `idea:${safe(input?.idea)}`,
    `ventaja:${safe(input?.ventajaTexto)}`,
    `rubro:${safe(input?.rubro)}@${safe(input?.ubicacion)}`,
    `ventas_mensual:${num(input?.ingresosMeta)}|ticket:${num(input?.ticket)}|costo_unit:${num(input?.costoUnit)}|CAC:${num(input?.cac)}|frecuencia_anual:${num(input?.frecuenciaAnual)}`,
    `gastos_fijos:${num(input?.gastosFijos)}|capital_trabajo:${num(input?.capitalTrabajo)}|meses_PE:${num(input?.mesesPE)}`,
    `seniales:${safe(input?.testeoPrevio)}`,
  ].join('\n');
}
function num(x:any){ const n = typeof x==='string' ? parseFloat(x.replace(/\./g,'').replace(',','.')) : +x; return isFinite(n) ? n : 0; }

function toStandardReport(aiText:string): StandardReport {
  let parsed:any = {};
  try { parsed = JSON.parse(aiText); } catch { parsed = {}; }
  const safe = AiSchema.safeParse(parsed);
  const v = safe.success
    ? safe.data
    : { industryBrief:'', competitionLocal:'', swotAndMarket:'', finalVerdict:'', metrics:{} };

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

function standardToTitle(finalVerdict: string){
  if (/VERDE/i.test(finalVerdict)) return 'VERDE – Avanzar';
  if (/ÁMBAR|AMBAR/i.test(finalVerdict)) return 'ÁMBAR – Ajustar';
  if (/ROJO/i.test(finalVerdict)) return 'ROJO – Pausar';
  return 'Evaluación';
}

