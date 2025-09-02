import OpenAI from "openai";

export const runtime = "edge";

export async function POST(req: Request) {
  // 1) lee payload
  const { input = {}, scores = { byKey: {} } } = await req.json().catch(() => ({ input: {}, scores: { byKey: {} } }));

  // 2) arma prompts
  const sys = "Devuélveme SOLO un JSON válido para el informe de evaluación. Sé conciso y exacto.";
  const usr = `Entrada del usuario:\n${JSON.stringify({ input, scores }, null, 2)}`;

  // 3) llama a OpenAI (Responses API)
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  let raw = ""; let id = "";

  try {
    const r = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      input: [
        { role: "system", content: sys },
        { role: "user", content: usr },
      ],
      text: { format: { type: "json_object" } },
      max_output_tokens: 800,   // <- ✅ nombre correcto
    });

    id = (r as any).id ?? "";
    raw = (r.output_text ?? "").trim();
  } catch (e: any) {
    return json({ ok: false, error: "OpenAI request failed", details: String(e?.message ?? e) }, 500);
  }

  if (!raw) return json({ ok: false, error: "empty_output_text" }, 502);

  // 4) parsea y normaliza a tu forma
  let ai: any = {};
  try { ai = JSON.parse(raw); } catch { ai = {}; }

  return json({ ok: true, aiPayload: ai, meta: { model: process.env.OPENAI_MODEL || "gpt-5-mini", id } });
}

// util
function json(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
