import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Step1 = {
  projectName?: string;
  shortDescription?: string;
  founderName?: string;
  notifyEmail?: string;
};

export type Step2 = {
  sectorId: string;
  template: string;
};

export type Step3 = {
  headline: string;
  country: string;
  city?: string;
  stage: "idea" | "launch" | "growth";
};

export type Step5 = {
  problema: number;
  accesibilidad: number;
  competencia: number;
  experiencia: number;
  pasion: number;
  planesAlternativos: number;
  riesgo: number;
  testeoPrevio: number;
  redApoyo: number;
};

// === ECONÓMICO (campos de tu formulario) ===
export type Step6 = {
  inversionInicial: number;
  capitalTrabajo: number;

  ventaAnio1: number;         // $ venta 12 meses
  ticket: number;             // precio/promedio
  conversionPct: number;      // % conv. visitas→clientes

  gastosFijosMensuales: number;
  costoVarPct?: number;       // % opcional
  costoVarUnit?: number;      // $ opcional

  traficoMensual: number;     // visitas/leads / mes
  ltv?: number;

  modoInversion: "presupuesto" | "cac";
  presupuestoMarketing?: number; // $/mes
  cpl?: number;                  // costo por lead/visita
  cac?: number;                  // costo de adquisición por cliente

  frecuenciaCompraMeses: number;  // cada cuántos meses recompra
  mesesPE: number;                // estimación punto de equilibrio
};

export type WizardData = {
  step1?: Step1;
  step2?: Step2;
  step3?: Step3;
  step5?: Step5;
  step6?: Step6;
};

type WizardStore = {
  data: WizardData;
  setStep1: (v: Step1) => void;
  setStep2: (v: Step2) => void;
  setStep3: (v: Step3) => void;
  setStep5: (v: Step5) => void;
  setStep6: (v: Step6) => void;
  clear: () => void;
};

export const useWizardStore = create<WizardStore>()(
  persist(
    (set) => ({
      data: {},
      setStep1: (v) => set((s) => ({ data: { ...s.data, step1: v } })),
      setStep2: (v) => set((s) => ({ data: { ...s.data, step2: v } })),
      setStep3: (v) => set((s) => ({ data: { ...s.data, step3: v } })),
      setStep5: (v) => set((s) => ({ data: { ...s.data, step5: v } })),
      setStep6: (v) => set((s) => ({ data: { ...s.data, step6: v } })),
      clear: () => set({ data: {} }),
    }),
    { name: "wizard", storage: createJSONStorage(() => localStorage) }
  )
);
