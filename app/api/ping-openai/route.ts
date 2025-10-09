// app/api/ping-openai/route.ts
export const runtime = 'edge';
import OpenAI from 'openai';

// Extrae texto robustamente de la Responses API
function extractText(r: any): string {
  if (r?.output_text && typeof r.output_text === 'string') return r.output_text;
  const blocks = r?.output ?? [];
  const parts: string[] = [];
  for (const b of blocks) {
    const content = b?.content ?? [];
    for (const c of content) {
      // v nuevos: c.type === 'output_text' y c.text.value
      if (c?.type === 'output_text' && c?.text?.value) parts.push(c.text.value);
      // fallback viejo: c.text es string
      else if (typeof c?.text === 'string') parts.push(c.text);
    }
  }
  return parts.join('');
}

export async function GET() {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const r = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1',
      input: [{ role: 'user', content: 'Devuelve exactamente {"ping": true} en json.' }],
      text: { format: { type: 'json_object' } },
      max_output_tokens: 50
    });

    const text = extractText(r);
    return Response.json({ ok: true, modelo: process.env.OPENAI_MODEL || 'gpt-4.1', texto: text });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: String(e?.message || e), status: e?.status, type: e?.error?.type },
      { status: 500 }
    );
  }
}

