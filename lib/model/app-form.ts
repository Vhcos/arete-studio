import type { WizardData } from "@/lib/state/wizard-store";

export function fromWizard(data: WizardData) {
  const s1 = data.step1 ?? {};
  const s2 = data.step2 ?? {};
  const eco = data.step6 ?? {}; // futuro (económico)

  return {
    projectName: s1.projectName ?? "",
    shortDescription: s1.shortDescription ?? "",
    founderName: s1.founderName ?? "",
    notifyEmail: s1.notifyEmail ?? "",
    sectorId: s2.sectorId ?? "",
    template: s2.template ?? "default",

    // económicos (para cuando agreguemos el paso 6)
    ticket: eco.ticket ?? 0,
    costoUnit: eco.costoUnit ?? 0,
    ingresosMeta: eco.ingresosMeta ?? 0,
    gastosFijos: eco.gastosFijos ?? 0,
    marketingMensual: eco.marketingMensual ?? 0,
    costoPct: eco.costoPct ?? 0,
  };
}
