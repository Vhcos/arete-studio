export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { tryDebitCredit, refundCredit, mapCreditErrorToHttp } from "@/lib/credits";

const PPLX_KEY = process.env.PERPLEXITY_API_KEY!;
const PPLX_MODEL = process.env.PERPLEXITY_MODEL || "sonar"; // sonar, sonar-pro, etc.

type S6Suggest = {
  ticket_clp?: number;
  ticket_rango_clp?: [number, number];
  clientes_mensuales?: number;
  clientes_rango?: [number, number];
  explicacion?: string;
  fuentes?: { title?: string; url: string }[];
};

function coerceJson<T = any>(s: string): T {
  const i = s.indexOf("{"), j = s.lastIndexOf("}");
  if (i >= 0 && j > i) {
    const raw = s.slice(i, j + 1);
    try { return JSON.parse(raw); } catch {}
  }
  return {} as any;
}

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions as any);
  const userId = session?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json(
      { ok: false, code: "unauthorized", message: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!PPLX_KEY) {
    return NextResponse.json(
      { ok: false, code: "missing_env", message: "PERPLEXITY_API_KEY no configurada" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({} as any));
  const idea = (body?.idea || "").toString();
  const rubro = (body?.rubro || "").toString();
  const ubicacion = (body?.ubicacion || "Chile").toString();
  const country = (body?.country || "CL").toString();

  const requestId = crypto.randomUUID();
  const DEBIT = 1;
  const SKIP_DEBIT = process.env.SKIP_DEBIT_INTEL === "1";

  // ↓↓↓ Débito con manejo de 402 (insuficientes) en JSON
  if (!SKIP_DEBIT) {
    try {
      await tryDebitCredit(userId, requestId, DEBIT);
    } catch (err) {
      const mapped = mapCreditErrorToHttp(err);
      if (mapped) {
        return NextResponse.json(mapped.body, { status: mapped.status }); // 402 JSON
      }
      // Error inesperado en el débito
      return NextResponse.json(
        { ok: false, code: "debit_error", message: String((err as any)?.message || err) },
        { status: 500 }
      );
    }
  }

  try {
    const system = [
      "Eres un analista con acceso web que devuelve SOLO JSON.",
      "Moneda: CLP (peso chileno). Si hay otras monedas, conviértelas a CLP con una tasa razonable y actual.",
      "Formato de salida (JSON estricto, sin texto extra):",
      "{",
      '  "ticket_clp": number,',
      '  "ticket_rango_clp": [number, number],',
      '  "clientes_mensuales": number,',
      '  "clientes_rango": [number, number],',
      '  "explicacion": string,',
      '  "fuentes": [{"title": string, "url": string}]',
      "}",
      "Infiérelo desde el rubro, ejemplos de competidores locales, aforos, tiques promedio y reportes recientes. Usa fuentes confiables/actuales.",
      `Ubicación objetivo: ${ubicacion} (country=${country}).`,
      "Evita promedios viejos. Explica brevemente la base del cálculo.",
      "No incluyas nada fuera del JSON.",
    ].join("\n");

    const user = [
      `Idea: ${idea || "(sin detalle)"}`,
      `Rubro/sector: ${rubro || "(sin rubro)"}`,
      "Devuelve valores redondeados para CLP y un rango plausible.",
      "Para clientes mensuales: usa aforo, horas pico y rotación como guía si es pertinente.",
      "Incluye 3–6 fuentes (reportes/medios/competidores/oficiales).",
    ].join("\n");

    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PPLX_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: PPLX_MODEL,
        temperature: 0.2,
        max_tokens: 1000,
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
    const content: string = j?.choices?.[0]?.message?.content ?? "{}";
    const parsed = coerceJson<S6Suggest>(content);

    const out: S6Suggest = {
      ticket_clp: typeof parsed.ticket_clp === "number" ? Math.round(parsed.ticket_clp) : undefined,
      ticket_rango_clp:
        Array.isArray(parsed.ticket_rango_clp) && parsed.ticket_rango_clp.length === 2
          ? [Math.round(Number(parsed.ticket_rango_clp[0]) || 0), Math.round(Number(parsed.ticket_rango_clp[1]) || 0)]
          : undefined,
      clientes_mensuales: typeof parsed.clientes_mensuales === "number" ? Math.round(parsed.clientes_mensuales) : undefined,
      clientes_rango:
        Array.isArray(parsed.clientes_rango) && parsed.clientes_rango.length === 2
          ? [Math.round(Number(parsed.clientes_rango[0]) || 0), Math.round(Number(parsed.clientes_rango[1]) || 0)]
          : undefined,
      explicacion: parsed.explicacion || "",
      fuentes: Array.isArray(parsed.fuentes) ? parsed.fuentes.slice(0, 6) : [],
    };

    return NextResponse.json({ ok: true, ...out, requestId, model: j?.model });
  } catch (e: any) {
    // Si falló Perplexity u otra cosa, reembolsa el crédito si se debitó
    if (!SKIP_DEBIT) {
      try { await refundCredit(userId, requestId, DEBIT); } catch {}
    }
    return NextResponse.json(
      { ok: false, code: "step6_error", message: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
