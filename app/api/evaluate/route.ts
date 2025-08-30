/* eslint-disable @typescript-eslint/no-explicit-any */
export const runtime = "edge";
export const preferredRegion = ["gru1"];

import OpenAI from "openai";
import { z } from "zod";
import { rankStandardReport } from "../../lib/nonAI-report";
import type { StandardReport } from "../../types/report";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/** ---------- extractor robusto para Responses API ---------- */
function extractText(r: any): string {
  if (typeof r?.output_text === "string" && r.output_text) return r.output_text;
  const out = r?.output ?? r?.response ?? [];
  const parts: string[] = [];
  for (const m of out) {
    const content = m?.content ?? [];
    for (const c of content) {
      if (c?.type === "text" && c?.text?.value) parts.push(String(c.text.value));
      else if (c?.type === "output_text" && c?.text?.value) parts.push(String(c.text.value));
      else if (typeof c?.text === "string") parts.push(c.text);
      else if (c?.content?.length) {
        for (const cc of c.content) {
          if (typeof cc?.text === "string") parts.push(cc.text);
          if (cc?.text?.value) parts.push(String(cc.text.value));
        }
      }
    }
  }
  return parts.join("").trim();
}
function pickJson(s: string){ const m = s.match(/\{[\s\S]*\}$/); return m ? m[0] : ""; }

/** ---------- validación destino ---------- */
const AiSchema = z.object({
  industryBrief: z.string(),
  competitionLocal: z.string(),
  swotAndMarket: z.string(),
  finalVerdict: z.string(),
  metrics: z.object({ marketEstimateCLP: z.number().optional() }).optional(),
}).strict();

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) return json({ ok:false, error:"OPENAI_API_KEY missing" }, 500);

  let body:any;
  try { body = await req.json(); } catch { return json({ ok:false, error:"Bad JSON" }, 400); }
  const { input, scores } = body || {};
  if (!input) return json({ ok:false, error:"Missing input" }, 400);

  const system =
    "Eres analista de startups. Devuelve SOLO JSON con {industryBrief, competitionLocal, swotAndMarket, finalVerdict, metrics{marketEstimateCLP}}. " +
    "Reglas: industryBrief ≤30 palabras; competitionLocal ≤50 palabras (con precios $); swotAndMarket ≤50 palabras (FODA + mercado CLP si posible); " +
    "finalVerdict honesto (VERDE/ÁMBAR/ROJO + razón). Incluye SIEMPRE metrics.marketEstimateCLP (número; si no sabes, usa 0). " +
    "No dejes campos vacíos; si falta info usa 'N/D'. Nada fuera del JSON.";

  const user =
`idea:${safe(input?.idea)}
ventaja:${safe(input?.ventajaTexto)}
rubro:${safe(input?.rubro)}@${safe(input?.ubicacion)}
ventas_mensual:${num(input?.ingresosMeta)}|ticket:${num(input?.ticket)}|costo_unit:${num(input?.costoUnit)}|CAC:${num(input?.cac)}|frecuencia_anual:${num(input?.frecuenciaAnual)}
gastos_fijos:${num(input?.gastosFijos)}|capital_trabajo:${num(input?.capitalTrabajo)}|meses_PE:${num(input?.mesesPE)}
seniales:${safe(input?.testeoPrevio)}`;

  // --- Llamada robusta (A+B con Responses; C con Chat Completions)
const model = (process.env.OPENAI_MODEL || "gpt-5-mini").toLowerCase();

let raw = "", jsonStr = "";

// A) Responses: roles + input_text + json_object
try {
  const r1 = await client.responses.create({
    model,
    instructions: system,
    input: [
      {
        role: "user",
        content: [{ type: "input_text", text: `${user}\n\nDevuelve SOLO JSON válido.` }],
      },
    ],
    text: { format: { type: "json_object" } },
    max_output_tokens: 600,
  });
  raw = extractText(r1);
  jsonStr = pickJson(raw) || raw;

  // B) Responses: string + json_object
  if (!jsonStr) {
    const r2 = await client.responses.create({
      model,
      input: `# Rol\n${system}\n\n# Datos\n${user}\n\n# Formato\nDevuelve SOLO JSON válido con exactamente esas claves.`,
      text: { format: { type: "json_object" } },
      max_output_tokens: 600,
    });
    raw = extractText(r2);
    jsonStr = pickJson(raw) || raw;
  }

  // C) Fallback final: Chat Completions (sin temperature, sin response_format)
  if (!jsonStr) {
    const r3 = await client.chat.completions.create({
      model, // gpt-5-mini
      messages: [
        { role: "system", content: system },
        { role: "user", content: `${user}\n\nDevuelve SOLO JSON válido.` },
      ],
      // OJO: no mandamos temperature ni response_format aquí
    });
    raw = (r3.choices?.[0]?.message?.content || "").trim();
    jsonStr = pickJson(raw) || raw;

    if (!jsonStr) {
      return json({
        ok: false,
        error: "empty_output_text",
        debug: { id: (r3 as any)?.id, rawDump: raw ?? "" }
      });
    }
  }
} catch (e:any) {
  return json({ ok:false, error:"OpenAI request failed", details:String(e?.message||e) }, 500);
}



  // ---- Normalización a tu StandardReport
  const standardReport = toStandardReport(jsonStr);

  const narrative = [
    standardReport.sections.industryBrief,
    standardReport.sections.competitionLocal,
    standardReport.sections.swotAndMarket,
    standardReport.sections.finalVerdict,
  ].filter(Boolean).join("\n\n");

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
    meta: { model },
    narrative,
  };

  return json({ ok:true, aiPayload, standardReport });
}

/** ---------------- helpers ---------------- */
function json(obj:any, status=200){
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
function safe(v:any){ return (v ?? "").toString().trim().slice(0, 400); }
function num(x:any){ const n = typeof x==='string' ? parseFloat(x.replace(/\./g,'').replace(',','.')) : +x; return isFinite(n) ? n : 0; }

function toStandardReport(aiText:string): StandardReport {
  let parsed:any = {};
  try { parsed = JSON.parse(aiText); } catch { parsed = {}; }
  const ok = AiSchema.safeParse(parsed);
  const v = ok.success
    ? ok.data
    : { industryBrief:"N/D", competitionLocal:"N/D", swotAndMarket:"N/D", finalVerdict:"N/D", metrics:{} };

  const sections = {
    industryBrief:   v.industryBrief || "N/D",
    competitionLocal:v.competitionLocal || "N/D",
    swotAndMarket:   v.swotAndMarket || "N/D",
    finalVerdict:    v.finalVerdict || "N/D",
  };

  const ranking = rankStandardReport({
    ...sections,
    marketEstimateCLP: v.metrics?.marketEstimateCLP,
  });

  return {
    source: "AI",
    createdAt: new Date().toISOString(),
    sections,
    metrics: { marketEstimateCLP: v.metrics?.marketEstimateCLP },
    ranking,
  };
}
function standardToTitle(finalVerdict: string){
  if (/VERDE/i.test(finalVerdict)) return "VERDE – Avanzar";
  if (/ÁMBAR|AMBAR/i.test(finalVerdict)) return "ÁMBAR – Ajustar";
  if (/ROJO/i.test(finalVerdict)) return "ROJO – Pausar";
  return "Evaluación";
}


