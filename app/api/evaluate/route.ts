/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/evaluate/route.ts
import OpenAI from "openai";

// Ejecuta en Node.js (más simple con SDK oficial)
export const runtime = "nodejs";
// Evita cache de Vercel en esta ruta
export const dynamic = "force-dynamic";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function ensureShape(data: any) {
  return {
    scores: data?.scores ?? { byKey: {} },
    meta: data?.meta ?? {},
    risks: Array.isArray(data?.risks) ? data.risks : [],
    experiments: Array.isArray(data?.experiments) ? data.experiments : [],
    narrative: data?.narrative ?? "",
    verdict: data?.verdict ?? { title: "Resultado", subtitle: "" },
  };
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "missing_api_key" }), { status: 500 });
    }

    const { input, scores } = await req.json();

    const system = `Eres un analista que evalúa ideas de negocio en Chile.
Devuelve SOLO JSON con la forma:
{
  "scores": { "byKey": { "problema": number, "segmento": number, "valor": number, "modelo": number, "economia": number, "mercado": number, "competencia": number, "riesgos": number, "founderFit": number, "tolerancia": number, "sentimiento": number, "red": number } },
  "meta": { "sam12_est": number, "assumptionsText": string },
  "risks": string[],
  "experiments": string[],
  "narrative": string,
  "verdict": { "title": string, "subtitle": string }
}`;

    const user = `
Idea: ${input?.idea}
Rubro: ${input?.rubro} · Ubicación: ${input?.ubicacion}
Oportunidades/Amenazas: ${input?.supuestos}
Números: ticket=${input?.ticket}, costoUnit=${input?.costoUnit}, CAC=${input?.cac}, frecuencia=${input?.frecuenciaAnual}/año
Gastos fijos=${input?.gastosFijos}, capitalTrabajo=${input?.capitalTrabajo}
Puntaje preliminar usuario: ${scores?.total}
`;

    const resp = await client.responses.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const text = (resp as any).output_text ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(text); }
    catch { parsed = { narrative: text }; }

    const safe = ensureShape(parsed);

    return new Response(JSON.stringify(safe), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("API /evaluate error:", err);
    return new Response(
      JSON.stringify({ error: "evaluate_failed", message: String(err?.message || err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

