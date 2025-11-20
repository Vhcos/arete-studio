// app/api/ai/step6-suggest/route.ts
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
  
    // Inferir país y moneda a partir de la ubicación (muy simple pero suficiente para LATAM)
  const loc = ubicacion.toLowerCase();
  let pais = "Chile";
  let moneda = "CLP";

  if (loc.includes("colombia") || loc.includes("medellín") || loc.includes("medellin") || loc.includes("bogotá") || loc.includes("bogota")) {
    pais = "Colombia";
    moneda = "COP";
  } else if (loc.includes("méxico") || loc.includes("mexico") || loc.includes("cdmx") || loc.includes("ciudad de méxico")) {
    pais = "México";
    moneda = "MXN";
  } else if (loc.includes("argentina") || loc.includes("buenos aires") || loc.includes("cordoba") || loc.includes("córdoba")) {
    pais = "Argentina";
    moneda = "ARS";
  } else if (loc.includes("perú") || loc.includes("peru") || loc.includes("lima")) {
    pais = "Perú";
    moneda = "PEN";
  } else if (loc.includes("chile") || loc.includes("santiago")) {
    pais = "Chile";
    moneda = "CLP";
  } else if (loc.includes("uruguay") || loc.includes("montevideo")) {
    pais = "Uruguay";
    moneda = "UYU";
  } else if (loc.includes("paraguay") || loc.includes("asunción") || loc.includes("asuncion")) {
    pais = "Paraguay";
    moneda = "PYG";
  } else if (loc.includes("bolivia") || loc.includes("la paz") || loc.includes("santa cruz")) {
    pais = "Bolivia";
    moneda = "BOB";
  } else if (loc.includes("ecuador") || loc.includes("quito") || loc.includes("guayaquil")) {
    pais = "Ecuador";
    moneda = "USD";
  }

  // A partir de aquí, usamos SIEMPRE `pais` y `moneda`

  
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
      "Eres un analista de mercado con acceso web y base de datos internacional que responde SOLO en JSON estricto.",
      `País objetivo: ${pais}. Moneda local objetivo: ${moneda}.`,
      "Usa SIEMPRE esa moneda local. No conviertas a otra divisa.",
      "Todos los valores numéricos del JSON deben ir como números puros: sin símbolo de moneda, sin separador de miles y sin texto adicional.",
      "Formato de salida (JSON estricto, sin texto extra):",
      "{",
      '  "ticket_clp": number,',
      '  "ticket_rango_clp": [number, number],',
      '  "clientes_mensuales": number,',
      '  "clientes_rango": [number, number],',
      '  "explicacion": string,',
      '  "fuentes": [{"title": string, "url": string}]',
      "}",
           "Infiérelo desde el rubro, ejemplos de competidores locales, aforos, tickets promedio y reportes recientes. Usa fuentes confiables y        actuales dando prioridad a fuentes del país objetivo.",
      `Ubicación objetivo: ${ubicacion}. Toda la explicación debe estar coherente con ${pais} y su mercado local.`,
      "Evita promedios viejos. Explica brevemente la base del cálculo.",
      `Prioriza fuentes actuales del ${pais}. Si no encuentras suficientes, puedes usar también fuentes de Latam o fuentes globales reconocidas (por ejemplo Euromonitor, OCDE, cámaras de comercio, bancos centrales).`,
      "Nunca  inventes nombres de instituciones ni URLs. Si no sabes la URL exacta, usa la URL raíz oficial (por ejemplo \"https://www.euromonitor.com\") o deja la URL vacía.",
      `Si el país objetivo no es Chile, no menciones a Chile en la explicación ni en las fuentes.`,
      "No incluyas nada fuera del JSON.",
      "Nunca pongas como fuente el propio sistema, localhost, wizard ni rutas internas. Filtra las fuentes para mostrar solo enlaces públicos, oficiales y accesibles de actualidad real."
    ].join("\n");

            const user = [
      `Idea: ${idea || "(sin detalle)"}`,
      `Rubro/sector: ${rubro || "(sin rubro)"}`,
      `Ciudad o ubicación principal: {ubicacion || "(sin ubicación)"}`,
      "Proporciona estas estimaciones claras:",
      `1) Ticket promedio por cliente en ${moneda} (valor numérico redondeado).`,
      `2) Rango plausible del ticket promedio por cliente en ${moneda} (array de 2 números redondeados: mínimo y máximo).`,
      `3) Número de clientes mensuales esperados (valor numérico redondeado).`,
      `4) Rango plausible de clientes mensuales (array de 2 números redondeados: mínimo y máximo).`,
      "5) Explicación breve de la base del cálculo (string).",
      "6) Fuentes usadas (array de objetos con 'title' y 'url').",
      "",
      "Devuelve valores redondeados en la MONEDA LOCAL indicada en el sistema y un rango plausible.",
      "Para clientes mensuales: usa aforo, horas pico y rotación como guía si es pertinente.",
      "Incluye hasta 2–6 fuentes (reportes/medios/competidores/oficiales). Prioriza el país objetivo y, si no hay suficientes, usa también Latinoamérica o fuentes globales reconocidas.",

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
      fuentes: (() => {
        let fuentes = Array.isArray(parsed.fuentes) ? parsed.fuentes : [];

        // Si el país NO es Chile, filtramos fuentes que claramente son de Chile
        if (pais !== "Chile") {
          fuentes = fuentes.filter((f) => {
            const title = (f.title || "").toLowerCase();
            const url = (f.url || "").toLowerCase();
            const mencionaChile = title.includes("chile") || url.includes("chile");
            const dominioCl = url.includes(".cl/");
            return !mencionaChile && !dominioCl;
          });
        }

        return fuentes.slice(0, 6);
      })(),
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
