import type { WizardData, Step1, Step2, Step6 } from "@/lib/state/wizard-store";

/**
 * Construye el cuerpo con los campos que usa el Formulario (app/page.tsx).
 * - Mapea shortDescription -> idea
 * - Tolera alias económicos (ventaAnual | ventaAnio1, presupuestoMarketing | marketingMensual)
 * - Evita TS errors tipando como Partial<StepX> en lugar de {}
 */
export function fromWizard(data: WizardData) {
  const s1 = (data.step1 ?? {}) as Partial<Step1>;
  const s2 = (data.step2 ?? {}) as Partial<Step2>;
  const eco = (data.step6 ?? {}) as Partial<Step6>;

  // === ALIAS / DERIVADOS ECONÓMICOS ===
  // Algunos proyectos usan 'ventaAnual' y otros 'ventaAnio1' -> aceptamos ambos
  const ventaAnual = (eco as any).ventaAnual ?? (eco as any).ventaAnio1 ?? 0;

  const ticket = (eco as any).ticket ?? 0;

  // costo variable unitario: si no viene directo, lo derivamos desde % sobre ticket
  const costoVarUnitDirect = (eco as any).costoVarUnit;
  const costoVarPctDirect = (eco as any).costoVarPct;

  const costoUnit =
    typeof costoVarUnitDirect === "number" && costoVarUnitDirect > 0
      ? costoVarUnitDirect
      : ticket > 0 && typeof costoVarPctDirect === "number"
      ? (ticket * Math.max(0, Math.min(100, costoVarPctDirect))) / 100
      : 0;

  // costo variable %: si no viene directo, lo derivamos desde unit / ticket
  const costoPct =
    typeof costoVarPctDirect === "number"
      ? Math.max(0, Math.min(100, costoVarPctDirect))
      : ticket > 0 && costoUnit > 0
      ? Math.max(0, Math.min(100, (costoUnit / ticket) * 100))
      : 0;

  const gastosFijosMensuales = (eco as any).gastosFijosMensuales ?? 0;

  // alias: 'presupuestoMarketing' o 'marketingMensual'
  const marketingMensual =
    (eco as any).presupuestoMarketing ?? (eco as any).marketingMensual ?? 0;

  // La API del tablero trabaja con ingresos MENSUALES meta:
  const ingresosMeta = ventaAnual ? ventaAnual / 12 : 0;

  return {
    // === CABECERA QUE LEE app/page.tsx ===
    projectName: s1.projectName ?? "",
    idea: s1.idea ?? "", // ← mapeo correcto al formulario
    founderName: s1.founderName ?? "",
    notifyEmail: s1.notifyEmail ?? "",
    sectorId: s2.sectorId ?? "",
    template: s2.template ?? "default",

    // === ECONÓMICOS QUE USA EL TABLERO/INFORME EN app/page.tsx ===
    ticket,
    costoUnit,
    ingresosMeta,
    gastosFijos: gastosFijosMensuales,
    marketingMensual,
    costoPct,
  };
}

