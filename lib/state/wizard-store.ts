import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Step1 = {
  projectName: string;
  shortDescription?: string;
  founderName?: string;
  notifyEmail?: string;
};

export type Step2 = {
  sectorId: string;   // uno de los 14
  template: string;   // "default" | "lean" | "pitch"
};

export type Step3 = {
  headline: string;
  country: string;
  city?: string;
  stage: "idea" | "launch" | "growth";
};

export type WizardData = {
  step1?: Step1;
  step2?: Step2;
  step3?: Step3;
};

type WizardStore = {
  data: WizardData;
  setStep1: (v: Step1) => void;
  setStep2: (v: Step2) => void;
  setStep3: (v: Step3) => void;
  clear: () => void;
};

export const useWizardStore = create<WizardStore>()(
  persist(
    (set) => ({
      data: {},
      setStep1: (v) => set((s) => ({ data: { ...s.data, step1: v } })),
      setStep2: (v) => set((s) => ({ data: { ...s.data, step2: v } })),
      setStep3: (v) => set((s) => ({ data: { ...s.data, step3: v } })),
      clear: () => set({ data: {} }),
    }),
    { name: "wizard", storage: createJSONStorage(() => localStorage) }
  )
);
