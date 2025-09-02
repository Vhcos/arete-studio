/* eslint-disable @typescript-eslint/no-explicit-any */
export const runtime = "edge";

import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function json(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Extrae el primer bloque JSON válido (por si el modelo mete algo fuera)
function pickJson(s: string) {
  const i = s.indexOf("{");
  const j = s.lastIndexOf("}");
  if (i >= 0 && j > i) {
    try { return JSON.parse(s.slice(i, j + 1)); } catch {}
  }
  return null;
}

// Limita un texto a N palabras
function limitWords(text: string, maxWords = 120) {
  const words = (text || "").trim().split(/\s+/);
  if (words.length <= maxWords) return (text || "").trim();
  return words.slice(0, maxWords).join(" ") + "…";
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return json({ ok: false, error: "OPENAI_API_KEY missing" }, 500);
  }

  const { input = {} } = (await req.json().catch(() => ({ input: {} }))) as any;

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  // Pedimos explícitamente plan100; si el modelo responde "summary", lo mapeamos abajo.
  const system =
    "Eres un consultor de negocios. Devuelve SOLO un JSON válido y nada de texto extra. " +
    'Claves requeridas: {"title":string, "plan100":string, "steps":string[]}.' +
    " 'plan100' debe ser un párrafo conciso en español (≤120 palabras).";

  const user = [
    `Idea: ${input.idea ?? ""}`,
    `Ubicación: ${input.ubicacion ?? ""}`,
    `Rubro: ${input.rubro ?? ""}`,
    input.ingresosMeta ? `Meta de ingresos (CLP/mes): ${input.ingresosMeta}` : "",
    input.ticket ? `Ticket (CLP): ${input.ticket}` : "",
    input.costoUnit ? `Costo unitario (CLP): ${input.costoUnit}` : "",
    input.gastosFijos ? `Gastos fijos (CLP/mes): ${input.gastosFijos}` : "",
    input.marketingMensual ? `Marketing (CLP/mes): ${input.marketingMensual}` : "",
    "",
    "Genera un plan inicial en ≤120 palabras (plan100) y 4–6 pasos accionables (steps).",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const r = await client.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 700,
    });

    const raw = r.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw) return json({ ok: false, error: "empty_output_text" }, 502);

    const data = pickJson(raw) ?? {};

    // Normalización de shape esperado por el front
    const title: string = (data.title || "Plan").toString();
    const steps: string[] = Array.isArray(data.steps)
      ? data.steps.map((s: any) => (s ?? "").toString()).filter(Boolean)
      : [];

    // Si el modelo no trae "plan100" pero trae "summary", lo usamos como plan100
    let plan100: string = (data.plan100 || data.summary || "").toString();
    plan100 = limitWords(plan100, 120);

    const plan = {
      title,
      summary: (data.summary || "").toString(), // opcional, por compatibilidad
      steps,
      plan100,
      // opcionales: mantenemos arrays para no romper el front si existen secciones
      competencia: Array.isArray(data.competencia) ? data.competencia : [],
      regulacion: Array.isArray(data.regulacion) ? data.regulacion : [],
    };

    return json({ ok: true, plan, meta: { modelUsed: model } });
  } catch (e: any) {
    return json(
      { ok: false, error: "OpenAI request failed", details: String(e?.message ?? e) },
      500
    );
  }
}
