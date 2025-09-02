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

  const {
    input = {},
    scores = { byKey: {} },
  } = (await req.json().catch(() => ({ input: {}, scores: { byKey: {} } }))) as any;

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const system =
    "Eres analista de nuevos negocios. Devuelve SOLO un JSON válido con las claves pedidas. No incluyas texto extra.";
  const user = [
    `Idea: ${input.idea ?? ""}`,
    `Ubicación: ${input.ubicacion ?? ""}`,
    `Rubro: ${input.rubro ?? ""}`,
    input.ingresosMeta ? `Meta de ingresos CLP/mes: ${input.ingresosMeta}` : "",
    scores?.byKey ? `Puntajes: ${JSON.stringify(scores.byKey)}` : "",
    "",
    "Construye el siguiente objeto JSON:",
    `{
      "industryBrief": string,          // resumen de industria local
      "competitionLocal": string,       // panorama competitivo local
      "swotAndMarket": string,          // FODA + tamaño/mercado (si puedes)
      "finalVerdict": string            // VERDE/ÁMBAR/ROJO + frase
    }`,
  ]
    .filter(Boolean)
    .join("\n");

  let raw = "";
  try {
    const r = await client.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 900,
    });

    raw = r.choices?.[0]?.message?.content?.trim() ?? "";
  } catch (e: any) {
    return json(
      { ok: false, error: "OpenAI request failed", details: String(e?.message ?? e) },
      500
    );
  }

  if (!raw) return json({ ok: false, error: "empty_output_text" }, 502);

  const ai = pickJson(raw);
  if (!ai) return json({ ok: false, error: "bad_json", raw }, 502);

  // Normaliza a tu StandardReport
  const standardReport = {
    source: "AI",
    createdAt: new Date().toISOString(),
    sections: {
      industryBrief: ai.industryBrief ?? "",
      competitionLocal: ai.competitionLocal ?? "",
      swotAndMarket: ai.swotAndMarket ?? "",
      finalVerdict: ai.finalVerdict ?? "",
    },
    metrics: { marketEstimateCLP: 0 },
    ranking: {
      score: 70,
      reasons: ai.finalVerdict ? [] : ["Veredicto poco claro."],
      constraintsOK: !!ai.finalVerdict,
    },
  };

  const verdictTitle =
    /VERDE/i.test(standardReport.sections.finalVerdict)
      ? "VERDE – Avanzar"
      : /ROJO/i.test(standardReport.sections.finalVerdict)
      ? "ROJO – Pausar"
      : "ÁMBAR – Ajustar";

  const aiPayload = {
    scores: { byKey: scores?.byKey ?? {} },
    reasons: {},
    hints: {},
    verdict: {
      title: verdictTitle,
      subtitle: standardReport.sections.finalVerdict ?? "",
      actions: [],
    },
    risks: [],
    experiments: [],
    meta: { model: model },
    narrative:
      [
        standardReport.sections.industryBrief,
        standardReport.sections.competitionLocal,
        standardReport.sections.swotAndMarket,
        standardReport.sections.finalVerdict,
      ]
        .filter(Boolean)
        .join("\n\n"),
  };

  return json({ ok: true, aiPayload, standardReport });
}
