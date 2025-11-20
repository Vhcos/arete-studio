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

  const rawCountry =
    body?.countryCode ??
    body?.country ??
    body?.pais ??
    body?.input?.countryCode ??
    body?.input?.country ??
    body?.input?.pais ??
    "CL";

  const pais = String(rawCountry).toUpperCase();

  const COUNTRY_NAMES: Record<string, string> = {
    CL: "Chile",
    CO: "Colombia",
    MX: "México",
    AR: "Argentina",
    PE: "Perú",
    UY: "Uruguay",
    PY: "Paraguay",
    BO: "Bolivia",
    EC: "Ecuador",
  };

  const countryName =
    COUNTRY_NAMES[pais] || `país o región objetivo (${pais})`;

  const ubicacion =
    body?.ubicacion ||
    body?.input?.ubicacion ||
    countryName;

  // Idempotencia básica / control de créditos
   const SKIP_DEBIT = process.env.SKIP_DEBIT_INTEL === "1";
   if (!SKIP_DEBIT) {
   const { ok } = await tryDebitCredit(userId, requestId, DEBIT);
   if (!ok) {
     return NextResponse.json({ ok: false, error: "Créditos insuficientes revisa nuestros planes y adquiere más créditos " }, { status: 402 });
   }
  }

  try {
       const extraGeoRules =
      pais === "CL"
        ? [
            "Puedes usar ejemplos específicos de Chile, instituciones chilenas y datos públicos del país cuando aporten valor directo.",
          ]
        : [
            "No presentes a Chile como caso principal. Solo puedes mencionarlo como una comparación muy breve (máximo 1 frase) si realmente aporta valor.",
            "Prioriza SIEMPRE datos, instituciones y ejemplos del país objetivo (no de Chile).",
          ];

    const system = [
      "Eres un analista competitivo y regulatorio con acceso web y a bases de datos públicas de América Latina y el mundo.",
      "Responde SOLO con la siguiente estructura JSON estricta (sin texto fuera del JSON):",
      "",
      "{",
      '  "competencia": [string],    // nombres reales de competidores locales y 1 internacional relevante, cada uno con mini-resumen y link público o red social oficial',
      '  "regulacion": [string],     // regulaciones, trámites y requisitos oficiales para el rubro y país/ciudad; incluye link público o entidad oficial si existe',
      '  "sources": [{"title": string, "url": string}] // solo URLs públicas reales de instituciones, empresas, reguladores, cámaras de comercio, portales, entes normativos, etc.; nunca cites fuentes internas, demo, wizard, localhost o inventadas',
      "}",
      "",
      `País objetivo: ${countryName} (código=${pais}).`,
      `Ciudad o ubicación principal: ${ubicacion}.`,
      "",
      "Reglas para COMPETENCIA:",
      "- Incluye NOMBRES REALES y actualizados de la competencia más relevante del país y ciudad objetivo.",
      "- Da entre 5 y 6 bullets en 'competencia'.",
      "- Cada bullet debe contener: nombre del competidor, producto/servicio principal, público objetivo, nivel de presencia/reputación y un link público (sitio web, red social activa o ficha en Google Maps).",
      "- Si la información local es escasa, agrega ejemplos regionales o globales reconocidos del sector (por ejemplo Starbucks, McDonald's, etc. si aplica) como benchmark, pero mantén el foco en el país objetivo.",
      "",
      "Reglas para REGULACIÓN:",
      "- Da entre 5 y 6 bullets en 'regulacion'.",
      "- Cada bullet debe describir trámites obligatorios, licencias específicas del rubro/sector, requisitos de formalización y normativas locales (municipalidad, entidad sanitaria/autorizante, servicio de impuestos, regulador sectorial, etc.).",
      "- Siempre que sea posible, menciona la entidad oficial responsable y enlázala en 'sources'.",
      "",
      "Reglas para FUENTES (sources):",
      "- 'sources' debe contener entre 3 y 10 objetos con {title, url}.",
      "- Prioriza links oficiales y actualizados: ministerios, servicios públicos, reguladores, cámaras de comercio, asociaciones sectoriales, organismos multilaterales, sitios oficiales de empresas y portales reconocidos.",
      "- Nunca inventes entidades ni URLs.",
      "- Nunca cites fuentes internas, dominios de prueba, rutas del sistema, ni localhost (por ejemplo: demo, wizard, localhost, panel interno, entornos de desarrollo).",
      "- Si no hay un link específico para un trámite, puedes usar la raíz oficial de la institución o, en último caso, dejar la URL vacía ('').",
      "",
      "Reglas geográficas:",
      "Centra absolutamente todo el análisis en el país y ciudad objetivo indicados.",
      "Solo compara con otros países si aporta valor directo, en máximo 1–2 menciones breves.",
      ...extraGeoRules,
      "",
      "Reglas generales:",
      "- Usa el año actual como referencia; evita información claramente obsoleta.",
      "- Filtra para mostrar solo enlaces públicos, accesibles y relevantes.",
      "- No incluyas texto fuera del JSON. No uses markdown, ni comentarios adicionales.",
    ].join("\n");


        const user = [
      `Idea de negocio y sector: ${idea || "(sin detalle)"} / ${rubro || "(sin rubro)"}`,
      `Ciudad o ubicación principal: ${ubicacion || "(sin ubicación)"}, país=${pais}, nombrePais=${countryName}`,
      "",
      "Objetivo:",
      "- Dame entre 5 y 6 bullets claros en \"competencia\" y entre 5 y 6 bullets claros en \"regulacion\", relevantes y actuales para el sector/rubro, país y ciudad indicados.",
      "- En \"competencia\", prioriza empresas y actores locales reales; si no hay suficiente información local, completa con ejemplos regionales o globales reconocidos del sector como benchmark.",
      "- En \"regulacion\", incluye trámites obligatorios, licencias específicas, requisitos de formalización y normativas locales clave para poder operar el negocio.",
      "- En \"sources\", incluye únicamente links públicos a empresas, portales, redes sociales oficiales y fuentes normativas vigentes en el año actual.",
      "",
      "Importante:",
      "- Centra todo en el país y la ciudad objetivo.",
      "- No inventes URLs ni nombres de entidades.",
      "- No incluyas texto fuera del JSON ni menciones al propio sistema o entornos internos.",
    ].join("\n");


    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PPLX_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: PPLX_MODEL,
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
