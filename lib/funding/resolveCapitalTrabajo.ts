// lib/funding/resolveCapitalTrabajo.ts
type AnyObj = Record<string, any>;

function toNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Intenta rescatar "capital de trabajo" desde la mayor cantidad de lugares posibles.
 * Devuelve { value, source } para poder debuggear sin adivinar.
 */
export function resolveCapitalTrabajo(opts: {
  legacy: AnyObj | null;
  plan: AnyObj | null;
}): { value: number | null; source: string } {
  const { legacy, plan } = opts;

  const candidates: Array<{ v: any; source: string }> = [
    // Plan (nuevo)
    { v: plan?.capitalTrabajo, source: "plan.capitalTrabajo" },

    // Plan dentro de legacy
    { v: legacy?.plan?.capitalTrabajo, source: "legacy.plan.capitalTrabajo" },
    { v: legacy?.data?.plan?.capitalTrabajo, source: "legacy.data.plan.capitalTrabajo" },

    // Step6 / Step9 en distintos formatos
    { v: legacy?.step9?.capitalTrabajo, source: "legacy.step9.capitalTrabajo" },
    { v: legacy?.data?.step9?.capitalTrabajo, source: "legacy.data.step9.capitalTrabajo" },
    { v: legacy?.step6?.capitalTrabajo, source: "legacy.step6.capitalTrabajo" },
    { v: legacy?.data?.step6?.capitalTrabajo, source: "legacy.data.step6.capitalTrabajo" },

    // Otros nombres comunes por si acaso
    { v: legacy?.capitalTrabajo, source: "legacy.capitalTrabajo" },
    { v: legacy?.data?.capitalTrabajo, source: "legacy.data.capitalTrabajo" },
    { v: legacy?.step9?.workingCapital, source: "legacy.step9.workingCapital" },
    { v: legacy?.data?.step9?.workingCapital, source: "legacy.data.step9.workingCapital" },
  ];

  for (const c of candidates) {
    const n = toNumber(c.v);
    if (typeof n === "number" && n > 0) return { value: Math.round(n), source: c.source };
  }

  /**
   * Fallback: si Step9 guarda una tabla de meses con resultados,
   * sumamos los meses con resultado negativo (capital de trabajo = caja mínima acumulada).
   *
   * OJO: esto es best-effort porque no sabemos el shape exacto.
   */
  const step9 =
    legacy?.step9 ??
    legacy?.data?.step9 ??
    null;

  const monthArrays =
    step9?.months ??
    step9?.meses ??
    step9?.cashflow ??
    step9?.flujo ??
    step9?.table ??
    null;

  if (Array.isArray(monthArrays) && monthArrays.length > 0) {
    const possibleKeys = ["resultado", "net", "flujo", "cash", "saldoMes", "deltaCaja", "resultadoMes"];
    let sumNeg = 0;
    let hits = 0;

    for (const row of monthArrays) {
      if (!row || typeof row !== "object") continue;

      let val: number | null = null;
      for (const k of possibleKeys) {
        val = toNumber((row as AnyObj)[k]);
        if (typeof val === "number") break;
      }

      if (typeof val === "number") {
        hits++;
        if (val < 0) sumNeg += Math.abs(val);
      }
    }

    if (hits >= 3 && sumNeg > 0) {
      return { value: Math.round(sumNeg), source: "step9.months.* (sum negativos)" };
    }
  }

  return { value: null, source: "not_found" };
}
