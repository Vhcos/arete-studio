// lib/llm.ts
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// --- extractores robustos
export function extractText(r: any): string {
  // 1) camino fácil
  if (typeof r?.output_text === "string" && r.output_text) return r.output_text;

  const parts: string[] = [];

  // 2) recorrer output -> content
  const out = r?.output ?? r?.response ?? [];
  for (const msg of out) {
    const content = msg?.content ?? [];
    for (const c of content) {
      // a) content tipo "text" con { text: { value } }
      if (c?.type === "text" && c?.text?.value) parts.push(String(c.text.value));
      // b) content tipo "output_text" con { text: { value } }
      else if (c?.type === "output_text" && c?.text?.value) parts.push(String(c.text.value));
      // c) text plano
      else if (typeof c?.text === "string") parts.push(c.text);
      // d) texto en otra envoltura común
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
export function pickJson(text: string): string {
  try { JSON.parse(text); return text; } catch {}
  const s = text.indexOf("{"); const e = text.lastIndexOf("}");
  if (s >= 0 && e > s) {
    const slice = text.slice(s, e + 1);
    try { JSON.parse(slice); return slice; } catch {}
  }
  return "";
}

/**
 * Versión mínima y rápida para JSON.
 * - En GPT-5: Responses API con `input` como string + `text.format=json_object`
 * - En GPT-4: Chat Completions con `response_format=json_object`
 */
export async function callLLMJSONMin(opts: {
  model?: string;
  system: string;
  user: string;
  maxOutputTokens?: number;
}) {
  const {
    model = process.env.OPENAI_MODEL || "gpt-4o-mini",
    system,
    user,
    maxOutputTokens = 600,
  } = opts;

  const m = model.toLowerCase();
  const isG5 = m.startsWith("gpt-5");

  // Unificamos en un SOLO string (mejor compatibilidad en Responses API)
  const prompt =
    `# Rol\n${system}\n\n` +
    `# Datos\n${user}\n\n` +
    `# Formato\nDevuelve SOLO JSON válido.`;

  if (isG5) {
    const r = await client.responses.create({
      model: m,
      input: prompt,                               // 👈 string en vez de arreglo {role,content}
      text: { format: { type: "json_object" } },   // fuerza JSON
      max_output_tokens: maxOutputTokens,
    });
    const raw = extractText(r).trim();
    const json = pickJson(raw);
    return { raw, json, modelUsed: m, responseDump: r };
  }

  // Fallback GPT-4*
  const rr = await client.chat.completions.create({
    model: m,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user",   content: user },
    ],
  });
  const raw = (rr.choices?.[0]?.message?.content || "").trim();
  const json = pickJson(raw);
  return { raw, json, modelUsed: m, responseDump: rr };
}

// alias opcional para no tocar imports antiguos
export const callLLMJSON = callLLMJSONMin;
