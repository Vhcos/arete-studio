// app/api/evaluate/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Helper
function toJson<T>(s: string | null | undefined): T {
  if (!s) throw new Error("Respuesta vacía del modelo");
  try { return JSON.parse(s) as T; } catch (e) { throw new Error("JSON inválido desde OpenAI"); }
}

/**
 * Esperamos que el frontend mande algo como:
 * {
 *   input: { ticket, costoPct, ingresosMeta, gastosFijos, marketingMensual, ... },
 *   sectorId?: string
 * }
 * No toco tu shape; el prompt concentra la conversión.
 */
export async function POST(req: Request) {
  try {
    const { input, sectorId } = await req.json();

    // --- PROMPT: conviértelo a tu estilo/plantilla actual ---
    const system = [
      "Eres un analista de negocio senior.",
      "Devuelves SIEMPRE JSON estricto con este shape:",
      `{
        "source": "AI",
        "createdAt": "<ISO>",
        "sections": {
          "industryBrief": string,
          "competitionLocal": string,
          "swotAndMarket": string,
          "finalVerdict": string
        },
        "metrics": { "marketEstimateCLP": number },
        "ranking": { "score": number, "reasons": string[], "constraintsOK": boolean }
      }`,
      "Sin texto adicional fuera del JSON."
    ].join("\n");

    const user = [
      "INPUT DEL USUARIO (para evaluar idea):",
      JSON.stringify({ input, sectorId })
    ].join("\n");

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      // El v4 soporta esto:
      response_format: { type: "json_object" },
      // Controla tamaño si quieres:
      // max_tokens: 1200,
    });

    const content = completion.choices[0]?.message?.content ?? "";
    const data = toJson<any>(content); // si quieres, tipa con tu StandardReport

    return NextResponse.json({
      ok: true,
      data,
      usage: completion.usage, // útil para ver tokens en dev
      model: completion.model,
    });
  } catch (err: any) {
    console.error("[/api/evaluate] error:", err);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
