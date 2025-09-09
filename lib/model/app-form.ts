
import type { WizardData } from "@/lib/state/wizard-store";

/** Largos y reglas usadas por todo el producto */
export const LENGTHS = {
  projectNameMin: 2,
  projectNameMax: 60,
  shortDescMax: 200,
  sectorMin: 2,
} as const;

/** Placeholders centralizados para mantener el copy consistente */
export const PLACEHOLDERS = {
  projectName: "Ej: Joyas de Autor",
  shortDescription: "¿Qué problema resuelves en una frase?",
  sector: "Retail, SaaS, Educación, etc.",
} as const;

/** Shape base que usará Tablero/Informe y futuros endpoints */
export type EvaluationInput = {
  projectName: string;
  shortDescription?: string;
  sector: string;

  // Campos de pasos siguientes (opcionales por ahora)
  businessType?: string;
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

/** Bridge: convierte el store del wizard en EvaluationInput */
export function fromWizard(w: WizardData): EvaluationInput {
  return {
    ...DEFAULT_EVALUATION,
    ...(w.step1
      ? {
          projectName: w.step1.projectName,
          shortDescription: w.step1.shortDescription || "",
          sector: w.step1.sector,
        }
      : {}),
    ...(w.step2
      ? {
          businessType: w.step2.businessType,
          template: w.step2.template,
        }
      : {}),
    ...(w.step3
      ? {
          headline: w.step3.headline,
          country: w.step3.country,
          city: w.step3.city,
          stage: w.step3.stage,
        }
      : {}),
  };
}
