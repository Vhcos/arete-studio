"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Step1, Step2, Step3 } from "@/lib/validation/wizard";

export type WizardData = {
  step1?: Step1;
  step2?: Step2;
  step3?: Step3;
  createdAt?: string;
};

interface WizardStore {
  data: WizardData;
  setStep1: (v: Step1) => void;
  setStep2: (v: Step2) => void;
  setStep3: (v: Step3) => void;
  clear: () => void;
}

export const useWizardStore = create<WizardStore>()(
  persist(
    (set, get) => ({
      data: { createdAt: new Date().toISOString() },
      setStep1: (v) => set({ data: { ...get().data, step1: v } }),
      setStep2: (v) => set({ data: { ...get().data, step2: v } }),
      setStep3: (v) => set({ data: { ...get().data, step3: v } }),
      clear: () => set({ data: { createdAt: new Date().toISOString() } }),
    }),
    {
      name: "arete-wizard",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (s) => s,
    }
  )
);
