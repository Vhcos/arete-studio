// app/api/funding-session/[sessionId]/drafts/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { tryDebitCredit, refundCredit } from "@/lib/credits";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1";

export type FundingDrafts = {
  resumen_ejecutivo: string;
  descripcion_negocio_y_producto: string;
  problema_y_oportunidad: string;
  propuesta_valor_y_solucion: string;
  mercado_y_clientes_objetivo: string;
  traccion_y_estado_actual: string;
  modelo_de_negocio_y_ingresos: string;
  monto_y_uso_de_fondos: string;
  impacto_y_resultados_esperados: string;
  equipo_y_capacidades: string;
};

/* ===================== Helpers: report/plan ===================== */

function getReportFromPayload(payload: any) {
  // Soporta: legacy y el nuevo (meta.meta)
  return (
    payload?.iaReportRaw ??
    payload?.meta?.iaReportRaw ??
    payload?.meta?.meta?.iaReportRaw ??
    null
  );
}

function unwrapIAReport(raw: any) {
  // Queremos llegar a un objeto con { sections: {...} }
  // Formatos vistos:
  // 1) { ranking, sections }
  // 2) { ok: true, data: { ranking, sections }, model, usage }
  // 3) { data: { ranking, sections } }
  if (!raw || typeof raw !== "object") return null;

  // Caso 2 y 3: raw.data
  const d = (raw as any).data;
  if (d && typeof d === "object") {
    // Si d.sections existe, es el bueno
    if ((d as any).sections && typeof (d as any).sections === "object") return d;
    // Por si viene doblemente anidado (raro, pero safe)
    const d2 = (d as any).data;
    if (d2 && typeof d2 === "object" && (d2 as any).sections) return d2;
    // Si no hay sections, igual devolvemos d para debug
    return d;
  }

  // Caso 1: raw.sections
  if ((raw as any).sections && typeof (raw as any).sections === "object") return raw;

  return raw;
}

function getPlanFromPayload(payload: any) {
  return (
    payload?.aiPlan ??
    payload?.plan ??
    payload?.meta?.aiPlan ??
    payload?.meta?.meta?.aiPlan ??
    payload?.legacyForm?.plan ??
    null
  );
}

function toJson<T>(s: string | null | undefined): T {
  if (!s) throw new Error("Respuesta vacía del modelo");
  try {
    return JSON.parse(s) as T;
  } catch {
    throw new Error("JSON inválido desde OpenAI");
  }
}

/* ===================== Helpers: anti-invención ===================== */

function extractNumericTokens(input: string): string[] {
  const re = /(?:\$?\s*)\d[\d\s.,%]*/g;
  const matches = input.match(re) ?? [];
  const out: string[] = [];
  for (const m of matches) {
    const onlyDigits = (m || "").replace(/[^\d]/g, "");
    if (!onlyDigits) continue;
    if (onlyDigits.length > 18) continue;
    out.push(onlyDigits.replace(/^0+/, "") || "0");
  }
  return out;
}

function fmtCL(n: number): string {
  try {
    return new Intl.NumberFormat("es-CL").format(n);
  } catch {
    return String(n);
  }
}

function detectNoSales(F2: any): boolean {
  if (!F2 || typeof F2 !== "object") return false;
  const raw = JSON.stringify(F2).toLowerCase();
  if (raw.includes("sin_ventas")) return true;
  if (raw.includes("sin ventas")) return true;
  if (raw.includes("no tengo ventas")) return true;
  if (raw.includes("no hay ventas")) return true;

  const v: any = F2 as any;
  if (v.tieneVentas === false) return true;
  if (typeof v.tieneVentas === "string" && v.tieneVentas.toLowerCase().includes("no"))
    return true;

  if (typeof v.estadoNegocio === "string" && v.estadoNegocio.toLowerCase().includes("sin_ventas"))
    return true;

  return false;
}

function looksLikeInstrumentStep(x: any) {
  return (
    x &&
    typeof x === "object" &&
    typeof x.tipoInstrumento === "string" &&
    Array.isArray(x.institucionesPreferidas)
  );
}
function looksLikeLinksStep(x: any) {
  return (
    x &&
    typeof x === "object" &&
    (x.links ||
      x.webUrl ||
      x.deckUrl ||
      x.videoUrl ||
      x.instagramUrl ||
      x.linkedinUrl ||
      x.drafts)
  );
}

/* ===================== Facts pack ===================== */

function buildFacts(payload: any, steps: any, clientId: any) {
  const F1 = steps.F1 ?? null;
  const F2 = steps.F2 ?? null;
  const F3 = steps.F3 ?? null;
  const F4 = steps.F4 ?? null;
  const F5 = steps.F5 ?? null;
  const F6 = steps.F6 ?? (looksLikeInstrumentStep(steps.F4) ? steps.F4 : null);
  const F7 = steps.F7 ?? (looksLikeLinksStep(steps.F5) ? steps.F5 : null);

  // ✅ CLAVE: soportar iaReportRaw.sections y iaReportRaw.data.sections
  const iaReportRaw = getReportFromPayload(payload);
  const iaReport = unwrapIAReport(iaReportRaw);
  const reportSections = (iaReport as any)?.sections ?? null;

  // (opcional) plan si existe
  const aiPlan = getPlanFromPayload(payload);

  // idea/rubro/ubicación desde payload.meta
  const metaTop = payload?.meta ?? {};
  const proyectoIdea = metaTop?.idea ?? payload?.idea ?? null;
  const proyectoRubro = metaTop?.rubro ?? payload?.rubro ?? null;
  const proyectoUbicacion = metaTop?.ubicacion ?? payload?.ubicacion ?? null;
  const proyectoCountryCode = metaTop?.countryCode ?? payload?.countryCode ?? null;

  const facts = {
    proyecto: {
      idea: proyectoIdea,
      rubro: proyectoRubro,
      ubicacion: proyectoUbicacion,
      countryCode: proyectoCountryCode,
    },
    postulante: F1
      ? {
          tipoPostulante: (F1 as any).tipoPostulante ?? null,
          nombreCompleto: (F1 as any).nombreCompleto ?? null,
          comuna: (F1 as any).comuna ?? null,
          region: (F1 as any).region ?? null,
          rut: (F1 as any).rut ?? null,
          telefono: (F1 as any).telefono ?? null,
        }
      : null,
    estado: F2
      ? {
          estadoNegocio: (F2 as any).estadoNegocio ?? null,
          anioInicio: (F2 as any).anioInicio ?? null,
          numEmpleados: (F2 as any).numEmpleados ?? null,
          ventasMensuales_actual: (F2 as any).ventasMensuales ?? null,
          clientesMensuales_actual: (F2 as any).clientesMensuales ?? null,
          tipoFormalizacion: (F2 as any).tipoFormalizacion ?? null,
        }
      : null,
    financiamiento: F3
      ? {
          montoSolicitado: (F3 as any).montoSolicitado ?? null,
          aportePropio: (F3 as any).aportePropio ?? null,
          porcentajeAporte: (F3 as any).porcentajeAporte ?? null,
          usosPrincipales: (F3 as any).usosPrincipales ?? null, // tal cual
        }
      : null,
    impacto: F4
      ? {
          impactoNarrativa: (F4 as any).impactoNarrativa ?? null,
          kpi: {
            ventasMensuales_meta: (F4 as any).metaVentasMensuales ?? null,
            clientesMensuales_meta: (F4 as any).metaClientesMensuales ?? null,
            margenBrutoPct_meta: (F4 as any).metaMargenBrutoPct ?? null,
            resultadoMensual_meta: (F4 as any).metaResultadoMensual ?? null,
          },
        }
      : null,
    equipo: F5 ?? null,
    instrumento: F6
      ? {
          tipoInstrumento: (F6 as any).tipoInstrumento ?? null,
          plazoUsoFondos: (F6 as any).plazoUsoFondos ?? null,
          institucionesPreferidas: (F6 as any).institucionesPreferidas ?? [],
          dispuestoEndeudarse: (F6 as any).dispuestoEndeudarse ?? null,
        }
      : null,

    // ✅ CLAVE: acá es donde “se trae el informe”
    informe_extracto: reportSections
      ? {
          finalVerdict: (reportSections as any).finalVerdict ?? null,
          industryBrief: (reportSections as any).industryBrief ?? null,
          swotAndMarket: (reportSections as any).swotAndMarket ?? null,
          competitionLocal: (reportSections as any).competitionLocal ?? null,
        }
      : null,

    plan: aiPlan ?? null,

    flags: {
      noSales: detectNoSales(F2),
    },
    clientId,
    reportId: payload?.reportId ?? null,

    // Debug interno (solo para logs; no se usa en el prompt)
    __debug: {
      hasReportRaw: !!iaReportRaw,
      rawTopKeys: iaReportRaw && typeof iaReportRaw === "object" ? Object.keys(iaReportRaw) : null,
      unwrappedTopKeys: iaReport && typeof iaReport === "object" ? Object.keys(iaReport) : null,
      sectionKeys: reportSections && typeof reportSections === "object" ? Object.keys(reportSections) : null,
    },
  };

  return facts;
}

function collectAllowedNumbersFromFacts(facts: any): Set<string> {
  const allowed = new Set<string>();

  const addNum = (n: any) => {
    if (typeof n !== "number" || !Number.isFinite(n)) return;
    const tok = String(Math.abs(Math.round(n))).replace(/^0+/, "") || "0";
    allowed.add(tok);
  };

  const addFromText = (s: any) => {
    if (typeof s !== "string") return;
    for (const t of extractNumericTokens(s)) allowed.add(t);
  };

  const addMaybeYear = (y: any) => {
    // tu anioInicio viene como string "2025"
    if (typeof y === "string" && /^\d{4}$/.test(y.trim())) allowed.add(y.trim());
  };

  addNum(facts?.estado?.ventasMensuales_actual);
  addNum(facts?.estado?.clientesMensuales_actual);
  addMaybeYear(facts?.estado?.anioInicio);

  addNum(facts?.financiamiento?.montoSolicitado);
  addNum(facts?.financiamiento?.aportePropio);
  addNum(facts?.financiamiento?.porcentajeAporte);

  addNum(facts?.impacto?.kpi?.ventasMensuales_meta);
  addNum(facts?.impacto?.kpi?.clientesMensuales_meta);
  addNum(facts?.impacto?.kpi?.margenBrutoPct_meta);
  addNum(facts?.impacto?.kpi?.resultadoMensual_meta);

  addFromText(facts?.financiamiento?.usosPrincipales);
  addFromText(facts?.impacto?.impactoNarrativa);
  addFromText(facts?.informe_extracto?.competitionLocal);
  addFromText(facts?.informe_extracto?.swotAndMarket);
  addFromText(facts?.informe_extracto?.industryBrief);
  addFromText(facts?.informe_extracto?.finalVerdict);

  addFromText(facts?.instrumento?.plazoUsoFondos);

  const keepSingles = new Set<string>();
  if (typeof facts?.instrumento?.plazoUsoFondos === "string") {
    for (const t of extractNumericTokens(facts.instrumento.plazoUsoFondos)) {
      if (t.length === 1) keepSingles.add(t);
    }
  }

  for (const t of Array.from(allowed)) {
    if (t.length === 1 && t !== "0" && !keepSingles.has(t)) {
      allowed.delete(t);
    }
  }

  return allowed;
}

function sanitizeTextNumbers(text: string, allowed: Set<string>): string {
  const re = /(?:\$?\s*)\d[\d\s.,%]*/g;
  return (text || "").replace(re, (m) => {
    const tok = (m || "").replace(/[^\d]/g, "").replace(/^0+/, "") || "0";
    return allowed.has(tok) ? m : "[completar]";
  });
}

function sanitizeDraftsNumbers(d: FundingDrafts, allowed: Set<string>): FundingDrafts {
  const out: any = { ...d };
  for (const k of Object.keys(out)) {
    out[k] = sanitizeTextNumbers(String(out[k] ?? ""), allowed);
  }
  return out as FundingDrafts;
}

/* ===================== Secciones “críticas” (hard-anchored) ===================== */

function buildTraccionSection(facts: any): string {
  const estado = facts?.estado ?? {};
  const noSales = !!facts?.flags?.noSales;

  const anio = estado.anioInicio ? String(estado.anioInicio) : "[completar]";
  const est = estado.estadoNegocio ?? "[completar]";

  if (noSales) {
    return [
      `Actualmente el negocio está en marcha pero aún sin ventas (según F2).`,
      `Año de inicio: ${anio}. Estado declarado: ${est}.`,
      `Validación y avance actual: [completar con hitos reales: prototipo, primeras publicaciones, catálogo, proveedores, etc.].`,
      `Próximos hitos (30–60 días): [completar].`,
    ].join("\n");
  }

  const ventas =
    typeof estado.ventasMensuales_actual === "number"
      ? `$${fmtCL(estado.ventasMensuales_actual)}`
      : "[completar]";
  const clientes =
    typeof estado.clientesMensuales_actual === "number"
      ? fmtCL(estado.clientesMensuales_actual)
      : "[completar]";

  return [
    `El negocio se encuentra en marcha (según F2).`,
    `Ventas mensuales actuales: ${ventas}. Clientes mensuales actuales: ${clientes}.`,
    `Hitos recientes: [completar].`,
    `Próximos hitos (30–60 días): [completar].`,
  ].join("\n");
}

function buildMontoUsoSection(facts: any): string {
  const f = facts?.financiamiento ?? {};
  const monto =
    typeof f.montoSolicitado === "number" ? `$${fmtCL(f.montoSolicitado)}` : "[completar]";
  const aporte =
    typeof f.aportePropio === "number" ? `$${fmtCL(f.aportePropio)}` : "[completar]";
  const porc =
    typeof f.porcentajeAporte === "number" ? `${fmtCL(f.porcentajeAporte)}%` : "[completar]";

  const usos =
    typeof f.usosPrincipales === "string" && f.usosPrincipales.trim()
      ? f.usosPrincipales.trim()
      : "[completar usos principales]";

  return [
    `Se solicita un financiamiento de ${monto}, con un aporte propio de ${aporte} (${porc}).`,
    ``,
    `Uso de fondos (según F3):`,
    `${usos}`,
  ].join("\n");
}

function buildImpactoSection(facts: any): string {
  const imp = facts?.impacto ?? {};
  const k = imp?.kpi ?? {};

  const v = (n: any) => (typeof n === "number" ? fmtCL(n) : "[completar]");
  const vMoney = (n: any) => (typeof n === "number" ? `$${fmtCL(n)}` : "[completar]");
  const vPct = (n: any) => (typeof n === "number" ? `${fmtCL(n)}%` : "[completar]");

  const narrativa =
    typeof imp.impactoNarrativa === "string" && imp.impactoNarrativa.trim()
      ? imp.impactoNarrativa.trim()
      : "[completar narrativa de impacto]";

  return [
    narrativa,
    ``,
    `Indicadores (F4, meta a 6 meses):`,
    `- Ventas mensuales: ${vMoney(k.ventasMensuales_meta)}`,
    `- Clientes mensuales: ${v(k.clientesMensuales_meta)}`,
    `- Margen bruto: ${vPct(k.margenBrutoPct_meta)}`,
    `- Resultado mensual operativo: ${vMoney(k.resultadoMensual_meta)}`,
  ].join("\n");
}

/* ===================== Prompt ===================== */

function buildPrompt(facts: any) {
  // OJO: acá es donde forzamos “usar SOLO el informe existente”
  return `
Eres un redactor experto en postulación a fondos, subsidios y créditos (LatAm).
Debes preparar borradores listos para copiar/pegar en formularios de Sercotec, Corfo, fondos municipales y bancos.

RESPONDE SOLO JSON válido con esta estructura EXACTA:

{
  "resumen_ejecutivo": "texto...",
  "descripcion_negocio_y_producto": "texto...",
  "problema_y_oportunidad": "texto...",
  "propuesta_valor_y_solucion": "texto...",
  "mercado_y_clientes_objetivo": "texto...",
  "traccion_y_estado_actual": "texto...",
  "modelo_de_negocio_y_ingresos": "texto...",
  "monto_y_uso_de_fondos": "texto...",
  "impacto_y_resultados_esperados": "texto...",
  "equipo_y_capacidades": "texto..."
}

REGLAS CRÍTICAS (NO NEGOCIABLES):
- No inventes datos. Si falta un dato, usa "[completar]".
- TRACCIÓN: respeta facts.estado + facts.flags.noSales. Si noSales=true, debe decir explícitamente "aún sin ventas (según F2)".
- MONTO Y USO: usa SOLO facts.financiamiento. Incluye el texto de "usosPrincipales" (según F3) sin crear ítems nuevos.
- IMPACTO: usa SOLO facts.impacto. No inventes indicadores; usa la narrativa (F4) y los KPI si existen.
- MERCADO/BENCHMARKING: usa SOLO facts.informe_extracto (finalVerdict/industryBrief/swotAndMarket/competitionLocal). No inventes crecimientos %, tamaños de mercado ni competidores nuevos.
- NÚMEROS: no inventes números. Si no está en facts, usa "[completar]".
- Español neutro. 160–220 palabras aprox por bloque.

Facts (source-of-truth):
${JSON.stringify(facts, null, 2)}
`;
}

/* ===================== Cache ===================== */

function getCachedDraftsPack(payload: any): { drafts: FundingDrafts; draftsGeneratedAt: string | null } | null {
  const drafts = payload?.drafts ?? payload?.steps?.F7?.drafts ?? null;
  if (!drafts) return null;

  const genAt = payload?.steps?.F7?.draftsGeneratedAt ?? payload?.draftsGeneratedAt ?? null;
  return { drafts: drafts as FundingDrafts, draftsGeneratedAt: genAt };
}

/* ===================== Handler ===================== */

type RouteCtx = { params: { sessionId: string } | Promise<{ sessionId: string }> };

export async function POST(req: Request, ctx: RouteCtx) {
  const { sessionId } = await Promise.resolve(ctx.params);

  const session = await getServerSession(authOptions).catch(() => null);
  const userId = (session as any)?.user?.id as string | undefined;
  const clientId = (session as any)?.user?.clientId ?? null;

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "UNAUTH" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const fundingSession = await prisma.fundingSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!fundingSession) {
    return NextResponse.json(
      { ok: false, error: "FUNDING_SESSION_NOT_FOUND" },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";

  const currentPayload: any = fundingSession.payload ?? {};

  // 0) Cache
  const cached = getCachedDraftsPack(currentPayload);
  if (!force && cached) {
    return NextResponse.json(
      { ok: true, drafts: cached.drafts, draftsGeneratedAt: cached.draftsGeneratedAt, cached: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  let creditTxId: string | null = null;
  let didDebit = false;

  try {
    // 1) Crédito (idempotente por sesión)
    const creditKey = `funding_drafts:${fundingSession.id}`;
    await tryDebitCredit(userId, creditKey, 1);

    creditTxId = creditKey;
    didDebit = true;

    // 2) Facts pack
    const payload: any = currentPayload ?? {};
    const steps: any = payload.steps ?? {};
    const facts = buildFacts(payload, steps, clientId);

    // ✅ LOGS PARA “CORROBORAR QUE LO LEE”
    console.log("[drafts] sessionId:", fundingSession.id);
    console.log("[drafts] has iaReportRaw:", facts?.__debug?.hasReportRaw);
    console.log("[drafts] iaReportRaw keys:", facts?.__debug?.rawTopKeys);
    console.log("[drafts] unwrapped report keys:", facts?.__debug?.unwrappedTopKeys);
    console.log("[drafts] reportSections keys:", facts?.__debug?.sectionKeys);
    console.log(
      "[drafts] sample competitionLocal:",
      String(facts?.informe_extracto?.competitionLocal ?? "").slice(0, 160)
    );

    // 3) Allowed numbers
    const allowed = collectAllowedNumbersFromFacts(facts);

    // 4) OpenAI (JSON)
    const prompt = buildPrompt(facts);
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "Respondes SOLO JSON válido. No inventas datos." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content;
    let drafts = toJson<FundingDrafts>(raw);

    // 5) Sanitizar números
    drafts = sanitizeDraftsNumbers(drafts, allowed);

    // 6) Override “críticos”
    drafts.traccion_y_estado_actual = buildTraccionSection(facts);
    drafts.monto_y_uso_de_fondos = buildMontoUsoSection(facts);
    drafts.impacto_y_resultados_esperados = buildImpactoSection(facts);

    // 7) Guardar payload (cache + steps.F7)
    const nowIso = new Date().toISOString();

    const prevSteps: any = currentPayload.steps ?? {};
    const prevF7 =
      prevSteps.F7 ??
      (looksLikeLinksStep(prevSteps.F5) ? prevSteps.F5 : null) ??
      null;

    const mergedSteps: any = {
      ...prevSteps,
      F7: {
        ...(prevF7 || {}),
        step: "F7",
        drafts,
        draftsGeneratedAt: nowIso,
      },
    };

    const newPayload: any = {
      ...currentPayload,
      drafts,
      steps: mergedSteps,
    };

    await prisma.fundingSession.update({
      where: { id: fundingSession.id },
      data: { payload: newPayload as any },
    });

    return NextResponse.json(
      { ok: true, drafts, draftsGeneratedAt: nowIso, cached: false },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    console.error("[/api/funding-session/:id/drafts] error:", err);

    if (err?.name === "InsufficientCreditsError" || err?.code === "no_credits") {
      return NextResponse.json(
        { ok: false, error: "no_credits" },
        { status: 402, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (didDebit && creditTxId) {
      try {
        await refundCredit(userId, creditTxId, 1);
      } catch (e) {
        console.error("Error al revertir crédito funding_drafts:", e);
      }
    }

    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
