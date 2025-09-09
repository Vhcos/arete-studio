import type { Step6 } from "@/lib/validation/wizard-extra";

/** Normaliza a número >= 0 */
function n(v: unknown, def = 0): number {
  const x = Number(v);
  return Number.isFinite(x) && x >= 0 ? x : def;
}

/** Calcula costo unitario a partir de unitario explícito o % del precio */
function resolveCostoUnit(step6?: Partial<Step6>): number {
  const ticket = n(step6?.ticket);
  const unit   = n(step6?.costoVarUnit);
  if (unit > 0) return unit;
  const pct = n(step6?.costoVarPct);
  return Math.round(ticket * (pct / 100));
}

/**
 * Convierte el estado del Wizard (o fragmentos) al formato “legacy”
 * que usa el Tablero/Informe (guardamos en localStorage).
 */
export function toLegacyForm(data: {
  // puedes pasar estos campos directos…
  projectName?: string;
  shortDescription?: string;
  sectorId?: string;
  step6?: Partial<Step6>;
  // …o paso 1/2 por si te resulta más cómodo:
  step1?: { projectName?: string; shortDescription?: string };
  step2?: { sectorId?: string };
}) {
  const s1 = data.step1 ?? {};
  const s2 = data.step2 ?? {};
  const s6 = data.step6 ?? {};

  const legacy = {
    projectName: (data.projectName ?? s1.projectName ?? "").toString(),
    shortDescription: (data.shortDescription ?? s1.shortDescription ?? "").toString(),
    sectorId: (data.sectorId ?? s2.sectorId ?? "tech_saas").toString(),
    plan: {
      ticket: n(s6.ticket),
      costoUnit: resolveCostoUnit(s6),
      ingresosMeta: n(s6.ventaAnio1),           // usamos “Venta año 1” como meta (12m)
      gastosFijos: n(s6.gastosFijosMensuales),
      marketingMensual: n(s6.presupuestoMarketing),
      costoPct: n(s6.costoVarPct),
    },
    meta: {
      savedAt: new Date().toISOString(),
      source: "wizard",
      version: 1,
    },
  };

  return legacy;
}

/** Solo el objeto `input` que espera POST /api/plan */
export function toPlanApiInput(
  src:
    | ReturnType<typeof toLegacyForm>
    | { step6?: Partial<Step6> }
) {
  const maybePlan = (src as any)?.plan;
  if (maybePlan) {
    return {
      ticket: n(maybePlan.ticket),
      costoUnit: n(maybePlan.costoUnit),
      ingresosMeta: n(maybePlan.ingresosMeta),
      gastosFijos: n(maybePlan.gastosFijos),
      marketingMensual: n(maybePlan.marketingMensual),
      costoPct: n(maybePlan.costoPct),
    };
  }
  const s6: Partial<Step6> = (src as any)?.step6 ?? {};
  return {
    ticket: n(s6.ticket),
    costoUnit: resolveCostoUnit(s6),
    ingresosMeta: n(s6.ventaAnio1),
    gastosFijos: n(s6.gastosFijosMensuales),
    marketingMensual: n(s6.presupuestoMarketing),
    costoPct: n(s6.costoVarPct),
  };
}

/** Payload completo listo para fetch POST /api/plan */
export function toPlanApiPayload(legacy: ReturnType<typeof toLegacyForm>) {
  return {
    projectName: legacy.projectName,
    sectorId: legacy.sectorId,
    input: toPlanApiInput(legacy),
  };
}
