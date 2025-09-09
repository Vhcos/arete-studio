import type { WizardData } from "@/lib/state/wizard-store";

export function fromWizard(data: WizardData) {
  const s1 = data.step1 ?? {};
  const s2 = data.step2 ?? {};
  return {
    projectName: s1.projectName ?? "",
    shortDescription: s1.shortDescription ?? "",
    founderName: s1.founderName ?? "",
    notifyEmail: s1.notifyEmail ?? "",
    sector: "",                      // ya no usamos rubro libre
    sectorId: s2.sectorId ?? "",
    template: s2.template ?? "default",
  };
}
