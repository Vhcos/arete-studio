import type { WizardData } from "@/lib/state/wizard-store";
import type { SectorId } from "@/lib/domain/sectors";

/** Largos y reglas usadas por todo el producto */
export const LENGTHS = {
  projectNameMin: 2,
  projectNameMax: 60,
  shortDescMax: 200,
  sectorMin: 2,
} as const;

/** Placeholders centralizados */
export const PLACEHOLDERS = {
  projectName: "Ej: Joyas Patagonia",
  shortDescription: "¿Qué problema resuelves en una frase?",
  sector: "Retail, SaaS, Educación, etc.",
} as const;

/** Shape base que usará Tablero/Informe y endpoints */
export type EvaluationInput = {
  projectName: string;
  shortDescription?: string;
  sector: string;          // texto libre (por compatibilidad)
  sectorId?: SectorId;     // canónico (14 sectores)
  businessType?: string;   // opcional si quisieras mantenerlo
  template?: string;
  headline?: string;
  country?: string;
  city?: string;
  stage?: "idea" | "launch" | "growth";
};

export const DEFAULT_EVALUATION: EvaluationInput = {
  projectName: "",
  shortDescription: "",
  sector: "",
};

export function fromWizard(w: WizardData): EvaluationInput {
  return {
    ...DEFAULT_EVALUATION,
    ...(w.step1 ? {
      projectName: w.step1.projectName,
      shortDescription: w.step1.shortDescription || "",
      sector: w.step1.sector,
    } : {}),
    ...(w.step2 ? {
      sectorId: (w.step2 as any).sectorId,
      template: w.step2.template,
      // businessType: (w.step2 as any).businessType, // opcional
    } : {}),
    ...(w.step3 ? {
      headline: w.step3.headline,
      country: w.step3.country,
      city: w.step3.city,
      stage: w.step3.stage,
    } : {}),
  };
}
