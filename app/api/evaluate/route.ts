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

// Extrae el primer bloque JSON válido por seguridad
function pickJson(s: string) {
  const i = s.indexOf("{");
  const j = s.lastIndexOf("}");
  if (i >= 0 && j > i) {
    try { return JSON.parse(s.slice(i, j + 1)); } catch {}
  }
  return null;
}

// ---------- helpers ----------
function str(x: any) { return (x ?? "").toString(); }
function clamp01(n: any) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}
function uniqBy<T>(arr: T[], key: (t: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of arr) {
    const k = key(it);
    if (!seen.has(k)) { seen.add(k); out.push(it); }
  }
  return out;
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

  // PROMPT (multilínea con backticks para evitar errores de sintaxis)
  const system = `
Eres analista de nuevos negocios. Devuelve SOLO un JSON válido con las claves pedidas. No incluyas texto extra ni comentarios.
JSON requerido:
{
  "industryBrief": string,        // resumen de industria local
  "competitionLocal": string,     // panorama competitivo local (texto)
  "swotAndMarket": string,        // FODA + tamaño/mercado (breve)
  "finalVerdict": string,         // VERDE/ÁMBAR/ROJO + frase
  "competencia": [                // lista estructurada (si no hay certeza, usar '—' y confianza:0)
    { "empresa": "string", "ciudad": "string", "segmento": "string",
      "propuesta": "string", "confianza": 0.0 }
  ]
}
Reglas:
- "confianza" ∈ [0,1]. Si no estás seguro de nombres reales, usa empresa:"—" y confianza:0.
- No inventes URLs. Responde en español neutro y con concisión.
`;

  const user = [
    `Idea: ${str(input.idea)}`,
    `Ubicación: ${str(input.ubicacion)}`,
    `Rubro: ${str(input.rubro)}`,
    input.ingresosMeta ? `Meta de ingresos CLP/mes: ${input.ingresosMeta}` : "",
    scores?.byKey ? `Puntajes: ${JSON.stringify(scores.byKey)}` : "",
    "",
    "Genera el JSON EXACTO con las claves indicadas arriba.",
  ].filter(Boolean).join("\n");

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

  // --- NORMALIZAR COMPETENCIA IA (NUEVO) ---
  const competenciaIA = (() => {
    const arr = Array.isArray(ai.competencia) ? ai.competencia : [];
    const norm = arr.map((c: any) => ({
      empresa: str(c?.empresa || "—"),
      ciudad: str(c?.ciudad || input?.ubicacion || "—"),
      segmento: str(c?.segmento || input?.rubro || "—"),
      propuesta: str(c?.propuesta || "—"),
      confianza: clamp01(c?.confianza ?? 0),
    }));
    // quitar duplicados por empresa + ciudad
    return uniqBy(norm, (x: any) => `${x.empresa}|${x.ciudad}`).slice(0, 6);
  })();

  // --- Normaliza a tu StandardReport (igual que antes) ---
  const standardReport: any = {
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
    // ⬇️ NUEVO: guardamos lista estructurada para la UI/PDF
    meta: { model, competenciaIA },
    input,
  };

  // Si hay nombres con alta confianza, los anteponemos al párrafo
  const firmes = competenciaIA.filter((c: any) => c.confianza >= 0.6).map((c: any) => c.empresa);
  if (firmes.length) {
    const lista = firmes.join(", ");
    standardReport.sections.competitionLocal =
      `Competidores detectados (por verificar): ${lista}. ` +
      (standardReport.sections.competitionLocal || "");
  }

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
    meta: { model },
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
