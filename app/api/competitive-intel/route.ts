// app/api/competitive-intel/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { tryDebitCredit, refundCredit } from "@/lib/credits";

const PPLX_KEY = process.env.PERPLEXITY_API_KEY!;
const PPLX_MODEL = process.env.PERPLEXITY_MODEL || "sonar"; // ajusta al que uses (ej. sonar-pro)

type IntelOut = {
  competencia: string[];
  regulacion: string[];
  sources?: { title?: string; url: string }[];
};

function coerceJson<T=any>(s: string): T {
  // intenta extraer el primer bloque JSON “válido”
  const i = s.indexOf("{"), j = s.lastIndexOf("}");
  if (i >= 0 && j > i) {
    const raw = s.slice(i, j + 1);
    try { return JSON.parse(raw); } catch {}
  }
  // fallback: bullets por líneas
  const lines = s.split(/\r?\n/).map(x => x.replace(/^[\-\*\•]\s*/, "").trim()).filter(Boolean);
  return { competencia: lines.slice(0, 5), regulacion: lines.slice(5, 10), sources: [] } as any;
}

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions as any);
  const userId = session?.user?.id as string | undefined;
  const email  = session?.user?.email as string | undefined;
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  if (!PPLX_KEY) {
    return NextResponse.json({ ok: false, error: "PERPLEXITY_API_KEY no configurada" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const requestId = crypto.randomUUID();
  const DEBIT = 1;

  // Datos mínimos para contextualizar búsqueda
  const idea = body?.idea || body?.input?.idea || "";
  const rubro = body?.rubro || body?.input?.rubro || "";
  const ubicacion = body?.ubicacion || body?.input?.ubicacion || "Chile";
  const pais = body?.pais || body?.country || "CL";

  // Idempotencia básica / control de créditos
   const SKIP_DEBIT = process.env.SKIP_DEBIT_INTEL === "1";
   if (!SKIP_DEBIT) {
   const { ok } = await tryDebitCredit(userId, requestId, DEBIT);
   if (!ok) {
     return NextResponse.json({ ok: false, error: "Créditos insuficientes" }, { status: 402 });
   }
  }

  try {
   const system = [
  "Eres un analista con acceso web.",
  "Responde SOLO con la siguiente estructura JSON:",
  "{",
  '  "competencia": string[],',
  '  "regulacion": string[],',
  '  "sources": [{"title": string, "url": string}]',
  "}",
  "bulletea nombres reales de competidores locales y uno internacional relevante con resumen y link.",
  "Incluye regulaciones/trámites válidos para " + ubicacion + " con link oficial.",
  "No incluyas texto fuera del JSON."
].join("\n");

    const user = [
  `Idea / Rubro: ${idea || "(sin detalle)"} / ${rubro || "(sin rubro)"}`,
  `Ubicación objetivo: ${ubicacion} (pais=${pais})`,
  "Dame 5–6 bullets claros de competencia y 5–6 de regulación con fuentes.",
  "Incluye sites oficiales si aplica.",
  "Evita info obsoleta: solo datos del año actual."
].join("\n");

    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PPLX_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        temperature: 0.2,
        max_tokens: 1200,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      throw new Error(`Perplexity ${resp.status}: ${txt.slice(0, 300)}`);
    }

    const j = await resp.json();
    const content: string = j?.choices?.[0]?.message?.content ?? "";
    const parsed = coerceJson<IntelOut>(content);

    // Normaliza tipos
    const out: IntelOut = {
      competencia: Array.isArray(parsed.competencia) ? parsed.competencia : [],
      regulacion: Array.isArray(parsed.regulacion) ? parsed.regulacion : [],
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    };

    return NextResponse.json({ ok: true, ...out, requestId, model: j?.model });
   } catch (e: any) {
    // Reembolsa si sí debitaste (no en modo SKIP_DEBIT)
   if (!process.env.SKIP_DEBIT_INTEL) {
      await refundCredit(session.user.id, requestId, DEBIT);
         }
     return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
   }
}
