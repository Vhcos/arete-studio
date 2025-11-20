// app/api/evaluate/route.ts (single-call premium report)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tryDebitCredit, refundCredit } from "@/lib/credits";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1";

// ---------- helpers ----------
function toJson<T>(s: string | null | undefined): T {
  if (!s) throw new Error("Respuesta vacía del modelo");
  try { return JSON.parse(s) as T; } catch { throw new Error("JSON inválido desde OpenAI"); }
}

// Toma valores numéricos si vienen con esos nombres (no inventa, solo usa si existen)
function num(x: any): number | undefined {
  const n = typeof x === "string" ? Number(x.replace(/[^0-9.-]/g, "")) : Number(x);
  return Number.isFinite(n) ? n : undefined;
}

function derive(input: any) {
  const price = num(input?.price ?? input?.precio);
  const variableCost = num(input?.variableCost ?? input?.costoVariable);
  const fixedMonthlyCosts = num(input?.fixedMonthlyCosts ?? input?.gastosFijos);
  const clientsPerMonth = num(input?.clientsPerMonth ?? input?.clientesMensuales);
  const retentionMonths = num(input?.retentionMonths ?? input?.mesesRetencion);
  const cacAssumed = num(input?.cacAssumed ?? input?.cac);

  const unitMargin = (price != null && variableCost != null) ? price - variableCost : undefined;
  const grossMarginPct = (unitMargin != null && price) ? unitMargin / price : undefined;
  const breakEvenClients = (fixedMonthlyCosts != null && unitMargin) ? Math.ceil(fixedMonthlyCosts / Math.max(unitMargin, 1e-6)) : undefined;
  const annualRevenue = (price && clientsPerMonth) ? price * clientsPerMonth * 12 : undefined;
  const ltv = (price && grossMarginPct != null && retentionMonths) ? price * grossMarginPct * retentionMonths : undefined;
  const cacTarget = (ltv != null) ? ltv / 3 : undefined;
  const ltvOverCac = (ltv != null && cacAssumed) ? ltv / cacAssumed : undefined;

  return {
    price, variableCost, fixedMonthlyCosts, clientsPerMonth, retentionMonths, cacAssumed,
    unitMargin, grossMarginPct, breakEvenClients, annualRevenue, ltv, cacTarget, ltvOverCac,
  };
}

// ---------- handler ----------
export async function POST(req: Request) {
  // sesión
  const session: any = await getServerSession(authOptions as any);
  const email = session?.user?.email as string | undefined;
  if (!email) return new NextResponse("Unauthorized", { status: 401 });

  // userId
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ ok: false, error: "no_user" }, { status: 401 });
  const userId = user.id;

  // body + requestId
  const body = await req.json().catch(() => ({}));
  const requestId = body?.requestId || crypto.randomUUID();

  // Debitar 1 créditos (o DEBIT_PER_EVALUATE)
  const DEBIT = Number(process.env.DEBIT_PER_EVALUATE ?? "1") || 1;
  const debit = await tryDebitCredit(userId, requestId, DEBIT);
  if (!(debit as any)?.ok) {
    return NextResponse.json({ ok: false, error: "no_credits" }, { status: 402 });
  }

  try {
        // inputs que YA tienes (no invento nombres; paso lo que llegue)
    const input = body?.input ?? body;

    // país/sector si vienen (no invento ids)
const rawCountry =
  body?.country ??
  body?.countryCode ??
  body?.pais ??
  (input as any)?.countryCode ??
  (input as any)?.country ??
  (input as any)?.pais ??
  "CL";

const countryCode = String(rawCountry).toUpperCase();
const sectorId = body?.sectorId ?? body?.sector;

    // Mapeo simple de código de país -> nombre "humano"
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
      COUNTRY_NAMES[countryCode] || `tu país o región objetivo (${countryCode})`;

    // derivados a partir de los nombres reales si existen
    const derived = derive(input);

    // Prompt: exigimos JSON con tus claves mínimas para que la UI no reviente
        // Prompt: exigimos JSON con tus claves mínimas para que la UI no reviente
        const extraGeoRules =
      countryCode === "CL"
        ? [
            "Puedes usar ejemplos específicos de Chile, instituciones chilenas y datos públicos del país cuando aporte valor directo.",
          ]
        : [
            "No presentes a Chile como caso principal. Solo puedes mencionarlo como una comparación muy breve (máximo 1 frase) si realmente aporta valor.",
            "Prioriza SIEMPRE datos, instituciones y ejemplos del país objetivo (no de Chile).",
          ];

    const system = [
      "Eres un analista senior especialista en rubros, industrias y emprendimientos de América Latina.",
      "Escribe un informe profesional, claro y motivador, contextualizado para el país y ciudad recibidos, usando SOLO JSON estricto.",
      "",
      "Estructura JSON obligatoria:",
      "{",
      '  "sections": {',
      '    "industryBrief": string,          // resumen del sector/rubro, contexto actual y oportunidad/reto principal',
      '    "competitionLocal": string,       // competencia relevante local (nombres, diferenciadores, rango de precios, presencia digital) y comparación internacional solo si aporta valor; incluye ejemplos cuando sea posible',
      '    "swotAndMarket": string,          // análisis FODA (fortalezas, oportunidades, debilidades, amenazas), tamaño/tendencias del mercado local y supuestos explícitos',
      '    "finalVerdict": string            // evaluación clara, consejos motivadores y 3 próximos pasos concretos para avanzar, con responsables y plazos cuando sea posible',
      "  },",
      '  "ranking": {',
      '    "score": number,                  // puntaje global sobre 100 (objetividad, viabilidad, datos, proyección)',
      '    "constraintsOK": boolean,         // si los datos permiten avanzar y ejecutar, true/false',
      '    "reasons": [string]               // motivos que validan la puntuación y resumen de restricciones',
      "  }",
      "}",
      "",
      `Contexto geográfico: todo el análisis debe estar situado en ${countryName}.`,
      "Centra todo el análisis y los ejemplos en el país y ciudad objetivo, usando el contexto real actual.",
      "Compara con otros países solo si aporta valor directo y en máximo 1–2 menciones breves (Latam o globales).",
      ...extraGeoRules,
      "",
      "Reglas:",
      "- Usa los DATOS DE ENTRADA y las variables derivadas siempre que existan.",
      '- Si faltan datos, declara supuestos explícitos (por ejemplo: "asumimos ticket promedio de X..." o "asumimos CAC de Y...").',
      "- El tono debe ser ejecutivo, claro y motivador.",
      "- Cada bloque debe cerrar con una idea accionable o próximos pasos concretos.",
      "- El informe debe permitir rápidamente tomar decisiones de negocio o inversión.",
      "- No entregues nada fuera del JSON y no uses markdown.",
      "- No inventes URLs ni dominios web. Si mencionas fuentes, hazlo solo por nombre de institución o informe (por ejemplo, “un estudio de la Cámara de Comercio de Bogotá” o “datos del Banco Mundial”), sin links.",
      "- Si los datos de entrada son escasos, explica siempre los supuestos y menciona qué tipo de fuentes sería recomendable consultar.",
      "",
      "Ejemplo de campos, referencias y comentarios deben estar incluidos en la explicación, no en la estructura del JSON.",
    ].join("\n");



            const userMsg = [
      "Datos de entrada del usuario:",
      JSON.stringify(
        {
          countryCode,
          countryName,
          sectorId,
          input,
        },
        null,
        2
      ),
      "",
      "Variables derivadas calculadas (si existen):",
      JSON.stringify(derived, null, 2),
      "",
      "Objetivo:",
      "Devuelve el JSON mínimo exigido con contenido específico y relevante para ese país, sector y ciudad.",
      "En 'finalVerdict', cierra con consejos claros y 3 próximos pasos concretos accionables.",
      "En 'score', califica objetivamente la viabilidad del negocio con rango 0–100 y justifica tu evaluación en 'reasons'.",
    ].join("\n");



    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
      // max_tokens: 1400,
    });

    const content = completion.choices?.[0]?.message?.content ?? "";
    const data = toJson<any>(content);

    // NORMALIZACIÓN mínima por seguridad de UI (si faltó algo, rellenamos defaults)
    if (!data.sections) data.sections = {};
    data.sections.industryBrief ??= "Resumen del rubro e hipótesis clave (faltaron datos: completa en el formulario).";
    data.sections.competitionLocal ??= "Competencia local: segmentación, rangos de precio, diferenciación propuesta.";
    data.sections.swotAndMarket ??= "FODA + tamaño de mercado: TAM/SAM/SOM estimados con supuestos explícitos.";
    data.sections.finalVerdict ??= "Veredicto + 3 próximos pasos con responsables y plazos (completa datos faltantes).";

    data.ranking ??= { score: 0, constraintsOK: false, reasons: ["Faltan datos para una evaluación completa."] };
    if (typeof data.ranking.score !== "number") data.ranking.score = 0;
    if (typeof data.ranking.constraintsOK !== "boolean") data.ranking.constraintsOK = false;
    if (!Array.isArray(data.ranking.reasons)) data.ranking.reasons = ["Normalizado por faltantes."];

    return NextResponse.json({
      ok: true,
      data,
      usage: completion.usage,
      model: completion.model,
    });
  } catch (err: unknown) {
    // Reembolso si falla
    await refundCredit(userId, requestId, DEBIT);
    const e = err as Error;
    console.error("[/api/evaluate] error:", e);
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
