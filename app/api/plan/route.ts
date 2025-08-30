/* eslint-disable @typescript-eslint/no-explicit-any */
export const runtime = "edge";
export const preferredRegion = ["gru1"];

import OpenAI from "openai";
import { extractText, pickJson } from "@/lib/llm";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ ok: false, error: "OPENAI_API_KEY missing" }, { status: 500 });
  }

  let body: any = {};
  try { body = await req.json(); } catch {}
  const input = body?.input || {};
  const hint  = body?.hint  || "";

  // 1) Prompt en UN SOLO string (mejor compat con Responses API)
  const system =
    "Eres consultor de negocios. Devuelve SOLO JSON {title, summary, steps[]} siguiendo el schema. Tono directo y accionable.";

  const user =
`Contexto:
idea:${(input?.idea ?? "").toString()}
ubicacion:${(input?.ubicacion ?? "").toString()}
rubro:${(input?.rubro ?? "").toString()}
${hint ? `pistas:${hint}\n` : ""}Requisitos: summary 90–110 palabras. steps exactamente 5 bullets, concisos. Español neutro.`;

  const prompt =
`# Rol
${system}

# Datos
${user}

# Formato
Devuelve SOLO JSON válido, ajustado al schema. Nada de comentarios.`;

  // 2) JSON Schema: AHORA va directo en text.format (no en json_schema)
  const format: any = {
    type: "json_schema",
    name: "OnePagePlan",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "summary", "steps"],
      properties: {
        title:   { type: "string" },
        summary: { type: "string" },                                     // ~100 palabras
        steps:   { type: "array", items: { type: "string" }, minItems: 5, maxItems: 5 } // 5 pasos exactos
      }
    },
    strict: true
  };

  try {
    const r = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      input: prompt,                            // string único
      text: { format },                         // <-- cambio clave
      max_output_tokens: 1200
    });

    const raw = extractText(r).trim();
    const jsonStr = pickJson(raw) || raw;      // si vino solo JSON, sirve igual
    const plan = JSON.parse(jsonStr);          // ahora debe ser válido

    return Response.json({ ok: true, plan, meta: { modelUsed: process.env.OPENAI_MODEL || "gpt-5-mini" } });
  } catch (e: any) {
    return Response.json({ ok: false, error: "plan_failed", details: String(e?.message || e) });
  }
}

