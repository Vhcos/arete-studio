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

// Fallback por si el modelo envía texto extra (no debería con json_object)
function pickJson(s: string) {
  const i = s.indexOf("{");
  const j = s.lastIndexOf("}");
  if (i >= 0 && j > i) {
    try { return JSON.parse(s.slice(i, j + 1)); } catch {}
  }
  return null;
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return json({ ok: false, error: "OPENAI_API_KEY missing" }, 500);
  }

  const { input = {} } = (await req.json().catch(() => ({ input: {} }))) as any;

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const system =
    "Eres un consultor de negocios. Devuelve SOLO un JSON válido con { title, summary, steps[] }. Nada de texto adicional.";
  const user = [
    `Idea: ${input.idea ?? ""}`,
    `Ubicación: ${input.ubicacion ?? ""}`,
    `Rubro: ${input.rubro ?? ""}`,
    input.ingresosMeta ? `Meta de ingresos (CLP/mes): ${input.ingresosMeta}` : "",
    "",
    "Genera un plan inicial (≤100 palabras en summary) y 4–6 pasos accionables.",
    'Formato JSON: {"title":string,"summary":string,"steps":string[]}',
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
      max_tokens: 600,
    });

    const raw = r.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw) return json({ ok: false, error: "empty_output_text" }, 502);

    const data = pickJson(raw) ?? {};
    const plan = {
      title: data.title ?? "Plan",
      summary: data.summary ?? "",
      steps: Array.isArray(data.steps) ? data.steps : [],
    };

    return json({ ok: true, plan, meta: { modelUsed: model } });
  } catch (e: any) {
    return json(
      { ok: false, error: "OpenAI request failed", details: String(e?.message ?? e) },
      500
    );
  }
}

