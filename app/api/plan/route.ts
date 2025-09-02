export const runtime = 'edge';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function json(obj:any, status=200){
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) return json({ ok:false, error:'OPENAI_API_KEY missing' }, 500);

  const { input } = await req.json().catch(() => ({ input:{} }));
  const model = process.env.OPENAI_MODEL || 'gpt-5-mini';

  const sys = "Devuelve SOLO un JSON con: title, summary, steps (5 items cortos). Nada de texto fuera del JSON.";
  const usr = `Negocio:\n${JSON.stringify(input)}\n\nResponde JSON válido.`;

  let raw = '';
  try {
    const r = await client.responses.create({
      model,
      input: [
        { role: 'system', content: sys },
        { role: 'user',   content: usr },
      ],
      text: { format: { type: 'json_object' } },
      max_output_tokens: 600,
    });

    raw = (r.output_text ?? '').trim();
    if (!raw) return json({ ok:false, error:'empty_output_text' }, 502);

    const plan = JSON.parse(raw);
    return json({ ok:true, plan, meta:{ model } });
  } catch (e:any) {
    return json({ ok:false, error:'OpenAI request failed', details:String(e?.message||e), raw }, 500);
  }
}

