// app/api/plan/route.ts
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
 * Espera algo como:
 * { input: { ... }, objetivo: "6m" }
 * Devuelve plan en JSON (100 palabras) + bullets.
 */
export async function POST(req: Request) {
  try {
    const { input, objetivo = "6m" } = await req.json();

    const system = [
      "Eres un asesor que arma un plan de acción conciso.",
      "Devuelves SOLO JSON con este shape:",
      `{
        "plan100": string,
        "bullets": string[]
      }`,
      "Nada fuera del JSON."
    ].join("\n");

    const user = [
      `Arma un plan de acción para ${objetivo}.`,
      "Contexto del negocio:",
      JSON.stringify(input)
    ].join("\n");

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
      // max_tokens: 600,
    });

    const content = completion.choices[0]?.message?.content ?? "";
    const data = toJson<{ plan100: string; bullets: string[] }>(content);

    return NextResponse.json({
      ok: true,
      data,
      usage: completion.usage,
      model: completion.model,
    });
  } catch (err: any) {
    console.error("[/api/plan] error:", err);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
