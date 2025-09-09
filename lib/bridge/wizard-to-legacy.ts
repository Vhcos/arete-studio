// lib/bridge/wizard-to-legacy.ts
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
 * Convierte el estado del Wizard al formato “legacy” que
 * guardamos en localStorage y que puede usar Tablero/Informe.
 */
export function toLegacyForm(data: {
  projectName?: string;
  shortDescription?: string;
  sectorId?: string;
  step6?: Partial<Step6>;
}) {
  const s6 = data.step6 ?? {};

  // payload base que el Tablero/Informe antiguo entiende sin problemas
  const legacy = {
    projectName: data.projectName ?? "",
    shortDescription: data.shortDescription ?? "",
    sectorId: data.sectorId ?? "tech_saas",

    // Dejo un bloque plan con los principales numéricos por si Tablero lo necesita
    plan: {
      ticket: n(s6.ticket),
      costoUnit: resolveCostoUnit(s6),
      ingresosMeta: n(s6.ventaAnio1),
      gastosFijos: n(s6.gastosFijosMensuales),
      marketingMensual: n(s6.presupuestoMarketing),
      costoPct: n(s6.costoVarPct),
    },
  };

  return legacy;
}

/**
 * Devuelve SOLO el objeto "input" que espera /api/plan:
 * {
 *   ticket, costoUnit, ingresosMeta, gastosFijos, marketingMensual, costoPct
 * }
 *
 * Acepta tanto el objeto `legacy` devuelto por toLegacyForm como
 * directamente el objeto original con `step6`.
 */
export function toPlanApiInput(
  src:
    | ReturnType<typeof toLegacyForm>
    | {
        step6?: Partial<Step6>;
        projectName?: string;
        sectorId?: string;
      }
) {
  // Caso 1: viene del legacy (tiene .plan)
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

  // Caso 2: viene directo con step6
  const s6 = (src as any)?.step6 ?? {};
  return {
    ticket: n(s6.ticket),
    costoUnit: resolveCostoUnit(s6),
    ingresosMeta: n(s6.ventaAnio1),
    gastosFijos: n(s6.gastosFijosMensuales),
    marketingMensual: n(s6.presupuestoMarketing),
    costoPct: n(s6.costoVarPct),
  };
}
