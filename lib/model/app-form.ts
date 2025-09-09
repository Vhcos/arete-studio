import type { WizardData } from "@/lib/state/wizard-store";

export function fromWizard(data: WizardData) {
  const s1 = data.step1 ?? {};
  const s2 = data.step2 ?? {};
  const eco = data.step6 ?? {};

  // Derivar fields que la API ya espera
  const ingresosMeta = eco.ventaAnio1 ? eco.ventaAnio1 / 12 : 0;
  const costoUnit = eco.costoVarUnit && eco.costoVarUnit > 0
    ? eco.costoVarUnit
    : (eco.ticket ? (eco.ticket * (eco.costoVarPct ?? 0) / 100) : 0);
  const costoPct = eco.ticket && (eco.costoVarUnit ?? 0) > 0
    ? Math.min(100, Math.max(0, (eco.costoVarUnit! / eco.ticket) * 100))
    : (eco.costoVarPct ?? 0);

  return {
    projectName: s1.projectName ?? "",
    shortDescription: s1.shortDescription ?? "",
    founderName: s1.founderName ?? "",
    notifyEmail: s1.notifyEmail ?? "",
    sectorId: s2.sectorId ?? "",
    template: s2.template ?? "default",

    // Económicos mapeados a la API
    ticket: eco.ticket ?? 0,
    costoUnit,
    ingresosMeta,
    gastosFijos: eco.gastosFijosMensuales ?? 0,
    marketingMensual: eco.presupuestoMarketing ?? 0,
    costoPct,
  };
}
