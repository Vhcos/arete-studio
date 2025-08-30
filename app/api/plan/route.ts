/* eslint-disable @typescript-eslint/no-explicit-any */

export const runtime = 'edge';
export const preferredRegion = ['gru1']; // São Paulo (cerca de Chile)

import OpenAI from 'openai';
import { z } from 'zod';

const AiPlanSchema = z.object({
  plan100: z.string(),
  acciones: z.array(z.object({
    dia: z.number(),
    tarea: z.string(),
    indicador: z.string().optional(),
  })),
  competencia: z.array(z.object({
    empresa: z.string(),
    ciudad: z.string(),
    segmento: z.string(),
    propuesta: z.string(),
    precio: z.string(),
    canal: z.string(),
    switching_cost: z.enum(['Bajo', 'Medio', 'Alto']),
    moat: z.string(),
    evidencia: z.string(),
  })),
  regulacion: z.array(z.object({
    area: z.enum(['Datos','Marca','Tributario','Sectorial']),
    que_aplica: z.string(),
    requisito: z.string(),
    plazo: z.string(),
    riesgo: z.enum(['Bajo','Medio','Alto']),
    accion: z.string(),
  })),
});
/* ------------------------------------------------------------------ */
/* Tipos (coinciden con ./types/plan.ts; si ya los tienes, puedes      */
/* importar desde '@/types/plan', pero aquí los incluyo para que sea    */
/* 100% pegable sin dependencias adicionales).                         */
/* ------------------------------------------------------------------ */

const SwitchingCost = z.enum(['Bajo', 'Medio', 'Alto']);

const CompetitiveRow = z.object({
  empresa: z.string().min(1),
  ciudad: z.string().min(1),
  segmento: z.string().min(1),
  propuesta: z.string().min(1),
  precio: z.string().min(1),
  canal: z.string().min(1),
  switching_cost: SwitchingCost,
  moat: z.string().min(1),
  evidencia: z.string().min(1),
});

const RegulationRow = z.object({
  area: z.enum(['Datos', 'Marca', 'Tributario', 'Sectorial']),
  que_aplica: z.string().min(1),
  requisito: z.string().min(1),
  plazo: z.string().min(1),
  riesgo: z.enum(['Bajo', 'Medio', 'Alto']),
  accion: z.string().min(1),
});

const AccionRow = z.object({
  dia: z.number().int().nonnegative(),
  tarea: z.string().min(1),
  indicador: z.string().min(1).optional(), // <— igual que en AiPlanSchema
});



type AiPlan = z.infer<typeof AiPlanSchema>;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function ok<T extends Record<string, any>>(
  body: T,
  init: number | ResponseInit = 200,
) {
  const status = typeof init === 'number' ? init : init.status ?? 200;
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Extrae el primer bloque JSON “con sentido” por si el modelo adorna
function extractJSON(text: string): string {
  if (!text) return '';
  // si vino en ```json ... ```
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  // toma desde el primer { hasta el último }
  const s = text.indexOf('{');
  const e = text.lastIndexOf('}');
  if (s >= 0 && e > s) return text.slice(s, e + 1).trim();

  return text.trim();
}


/* ------------------------------------------------------------------ */
/* Prompt                                                              */
/* ------------------------------------------------------------------ */

const SYSTEM = `
Eres analista de startups. Con los inputs del cliente (JSON), devuelve SOLO JSON válido:
{
  "plan100": "100 palabras enfocadas en próximos pasos y métricas (no resumen del input)",
  "acciones": [{"dia": 1, "tarea": "Definir ICP", "indicador": "ICP escrito"}],
  "competencia": [{"empresa":"TBD","ciudad":"TBD","segmento":"TBD","propuesta":"TBD","precio":"N/D","canal":"N/D","switching_cost":"Bajo|Medio|Alto","moat":"TBD","evidencia":"TBD"}],
  "regulacion": [{"area":"Datos|Marca|Tributario|Sectorial","que_aplica":"...","requisito":"...","plazo":"...","riesgo":"Bajo|Medio|Alto","accion":"..."}]
}

Reglas:
- NUNCA inventes empresas ni cifras. Si no tienes base, usa "TBD" o "N/D".
- Personaliza por país/ciudad y rubro con supuestos explícitos.
- Prioriza CAC, LTV, payback, riesgos y mitigaciones.
- Nada de texto fuera del JSON.
`.trim();

/* ------------------------------------------------------------------ */
/* Handler                                                             */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  // 1) Config
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return ok({ ok: false, skipped: true, error: 'Falta OPENAI_API_KEY', plan: null });
  }

  // 2) Lee body sin lanzar 500
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return ok({ ok: false, error: 'Body inválido (JSON requerido)', plan: null });
  }

  const input = payload?.input ?? {};
  const meta = payload?.meta ?? {}; // { idea, rubro, ubicacion, ... }

  // 3) Llama a OpenAI con salida compacta
  const client = new OpenAI({ apiKey });

  try {
    const userPrompt = {
      ...input,         // todo lo que te llega desde el front (idea, rubro, ticket, etc.)
      meta: { ...meta } // opcional: país/ciudad, flags, etc.
    };


    // temperatura baja para menos alucinación
    const completion = await client.chat.completions.create({
      model: 'gpt-5-mini', // o el que uses, pero con temperatura baja
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: JSON.stringify(userPrompt) }
      ],
      temperature: 0.2,
    });

    const raw = completion.choices?.[0]?.message?.content ?? '';
    const jsonText = extractJSON(raw);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      // Si no se pudo parsear, devuelve info para depurar, pero sin 500
      return ok({
        ok: false,
        error: 'La IA no devolvió JSON parseable',
        raw,
        snippet: jsonText?.slice(0, 300),
        plan: null,
      });
    }
    
    // ✅ Valida y normaliza la salida
    const checked = AiPlanSchema.safeParse(parsed);
    if (!checked.success) {
     return ok({
         ok: false,
         error: 'schema_mismatch',
         issues: checked.error.format(),
         raw: parsed,
         plan: null,
       });
     }

     // Éxito
     return ok({
         ok: true,
          source: 'openai',
         plan: checked.data,
      });


  } catch (err: any) {
    // 5) Nunca lances 500 a Next (evita overlay HTML en el cliente)
    return ok({
      ok: false,
      error: String(err?.message ?? err),
      plan: null,
    });
  }
}
