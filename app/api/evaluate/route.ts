/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/evaluate/route.ts
export const runtime = 'edge';
export const preferredRegion = ['gru1']; // São Paulo (más cerca de Chile)

import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/evaluate[?stream=1]
export async function POST(request: Request) {
  const url = new URL(request.url);
  const wantStream = url.searchParams.get('stream') === '1';

  let body: any = null;
  try { body = await request.json(); }
  catch { return json({ error: 'Bad JSON' }, 400); }

  const { input, scores } = body || {};
  const sys =
    'Eres analista de startups. Devuelve SOLO JSON con: ' +
    'scores.byKey (1-10), reasons{}, hints{}, verdict{title,subtitle,actions[]}, ' +
    'risks[], experiments[], meta{sam12_est,assumptionsText}, narrative (<=1000 chars). ' +
    'Nada de texto extra.';

  const usr = makeUserPrompt(input, scores);

  // === Modo NO streaming (compatibilidad) ===
  if (!wantStream) {
    const r = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: usr },
      ],
    });
    const text = r.choices[0]?.message?.content?.trim() ?? '{}';
    return safeJson(text);
  }

  // === Modo streaming (SSE) ===
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let narrative = '';
      const send = (event: string, data: string) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));

      try {
        send('status', 'starting');

        // 1) Stream de la narrativa (tokens en vivo)
        const s = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.2,
          stream: true,
          messages: [
            { role: 'system', content: 'Escribe solo la narrativa del informe (<=700 palabras). SIN JSON.' },
            { role: 'user', content: usr },
          ],
        });

        for await (const part of s) {
          const token = part.choices[0]?.delta?.content || '';
          if (token) {
            narrative += token;
            // Enviamos en vivo para la UI
            send('narrative', escapeSSE(token));
          }
        }

        // 2) JSON final (una sola respuesta, sin stream)
        const final = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0,
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: usr },
          ],
        });

        const text = final.choices[0]?.message?.content?.trim() ?? '{}';
        let obj: any;
        try { obj = JSON.parse(text); }
        catch { obj = { error: 'LLM JSON parse failed', raw: text }; }

        if (!obj.narrative) obj.narrative = narrative;

        send('final', JSON.stringify(obj));
        send('done', 'ok');
        controller.close();
      } catch (err: any) {
        send('error', escapeSSE(err?.message || 'stream error'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

// ---------- helpers ----------
function escapeSSE(s: string) { return String(s).replace(/\r?\n/g, '\\n'); }
function json(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
function safeJson(textFromLLM: string) {
  try { return json(JSON.parse(textFromLLM)); }
  catch { return json({ error: 'LLM JSON parse failed', raw: textFromLLM }, 200); }
}
function makeUserPrompt(input: any, scores: any) {
  const safe = (v: any) => (v ?? '').toString().slice(0, 400);
  // Prompt corto (cada carácter cuenta)
  return [
    `idea:${safe(input?.idea)}`,
    `ventaja:${safe(input?.ventajaTexto)}`,
    `rubro:${safe(input?.rubro)}@${safe(input?.ubicacion)}`,
    `ventas:${input?.ingresosMeta}|ticket:${input?.ticket}|costo:${input?.costoUnit}|CAC:${input?.cac}|freq:${input?.frecuenciaAnual}`,
    `GF:${input?.gastosFijos}|capital:${input?.capitalTrabajo}|mesesPE:${input?.mesesPE}`,
    `scoresLocal:${JSON.stringify(scores?.byKey || {})}`,
    `supuestos:${safe(input?.supuestos)}`
  ].join('\n');
}

