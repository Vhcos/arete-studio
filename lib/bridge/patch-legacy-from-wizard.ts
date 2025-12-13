// lib/bridge/patch-legacy-from-wizard.ts
type AnyObj = Record<string, any>;

function safeNum(n: any): number | null {
  if (n === null || n === undefined) return null;
  if (typeof n === "number") return Number.isFinite(n) ? n : null;
  if (typeof n === "string") {
    const cleaned = n.replace(/[^\d.-]/g, "");
    const v = Number(cleaned);
    return Number.isFinite(v) ? v : null;
  }
  return null;
}

function readJSON<T = any>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: any) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function roundInt(n: any, fallback = 0) {
  const v = safeNum(n);
  return typeof v === "number" ? Math.round(v) : fallback;
}

/**
 * Parcha arete:legacyForm con los datos del wizard SIN borrar benchmark/fuentes.
 * Clave: solo actualiza lo mínimo (plan + identidad), dejando intacto lo demás.
 */
export function patchLegacyFromWizard(opts: {
  wizardData: AnyObj; // data del store (data.step1/2/3/6...)
}) {
  if (typeof window === "undefined") return;

  const { wizardData } = opts;

  const legacy: AnyObj =
    readJSON("arete:legacyForm") ??
    readJSON("arete:form") ??
    {};

  const step1 = (wizardData?.step1 ?? {}) as AnyObj;
  const step2 = (wizardData?.step2 ?? {}) as AnyObj;
  const step3 = (wizardData?.step3 ?? {}) as AnyObj;
  const step6 = (wizardData?.step6 ?? {}) as AnyObj;

  const projectName = (step1.projectName ?? legacy.projectName ?? "").toString();
  const idea = (step1.idea ?? legacy.idea ?? "").toString();
  const ventajaTexto = (step3.ventajaTexto ?? legacy.ventajaTexto ?? "").toString();
  const sectorId = (step2.sectorId ?? legacy.sectorId ?? "").toString();
  const ubicacion = (step2.ubicacion ?? legacy.ubicacion ?? "").toString();

  // Números
  const inversionInicial = roundInt(step6.inversionInicial, roundInt(legacy?.plan?.inversionInicial));
  const capitalTrabajo = roundInt(step6.capitalTrabajo, roundInt(legacy?.plan?.capitalTrabajo));
  const ventaAnual =
    roundInt(step6.ventaAnual, 0) ||
    roundInt(step6.ventaAnio1, 0) ||
    roundInt(legacy?.plan?.ventaAnual);

  const ticket = roundInt(step6.ticket, roundInt(legacy?.plan?.ticket));
  const convPct = roundInt(step6.conversionPct, roundInt(legacy?.plan?.convPct));
  const costoPct = roundInt(step6.costoVarPct, roundInt(legacy?.plan?.costoPct));
  const costoUnit = roundInt(step6.costoVarUnit, roundInt(legacy?.plan?.costoUnit));
  const traficoMensual = roundInt(step6.traficoMensual, roundInt(legacy?.plan?.traficoMensual));
  const mesesPE = roundInt(step6.mesesPE, roundInt(legacy?.plan?.mesesPE) || 6);

  const gastosFijosMensuales = roundInt(step6.gastosFijosMensuales, 0);
  const gastosFijos = gastosFijosMensuales > 0
    ? gastosFijosMensuales * 12
    : roundInt(legacy?.plan?.gastosFijos);

  const marketingMensual =
    roundInt(step6.presupuestoMarketing, 0) ||
    roundInt(step6.marketingMensual, 0) ||
    roundInt(legacy?.plan?.marketingMensual);

  const frecuenciaCompraMeses = roundInt(step6.frecuenciaCompraMeses, 0);
  const frecuenciaAnual =
    frecuenciaCompraMeses > 0
      ? Math.max(1, Math.round(12 / frecuenciaCompraMeses))
      : roundInt(legacy?.plan?.frecuenciaAnual);

  const ingresosMeta = ventaAnual > 0 ? ventaAnual : roundInt(legacy?.plan?.ingresosMeta);

  // ✅ plan parchado, preservando lo anterior
  const nextPlan: AnyObj = {
    ...(legacy.plan ?? {}),
    inversionInicial: inversionInicial || undefined,
    capitalTrabajo: capitalTrabajo || undefined,
    ventaAnual: ventaAnual || undefined,
    ticket: ticket || undefined,
    convPct: convPct || undefined,
    costoPct: costoPct || undefined,
    costoUnit: costoUnit || undefined,
    traficoMensual: traficoMensual || undefined,
    gastosFijos: gastosFijos || undefined,
    marketingMensual: marketingMensual || undefined,
    ingresosMeta: ingresosMeta || undefined,
    frecuenciaAnual: frecuenciaAnual || undefined,
    mesesPE: mesesPE || undefined,
  };

  const nextLegacy: AnyObj = {
    ...legacy,
    projectName: projectName || legacy.projectName,
    idea: idea || legacy.idea,
    ventajaTexto: ventajaTexto || legacy.ventajaTexto,
    sectorId: sectorId || legacy.sectorId,
    ubicacion: ubicacion || legacy.ubicacion,
    plan: nextPlan,
    meta: {
      ...(legacy.meta ?? {}),
      savedAt: new Date().toISOString(),
      source: "wizard",
    },
  };

  writeJSON("arete:legacyForm", nextLegacy);

  // Opcional pero útil: mantener window.__arete sincronizado
  (window as any).__arete = (window as any).__arete ?? {};
  (window as any).__arete.form = nextLegacy;
  (window as any).__arete.plan = nextPlan;
}
