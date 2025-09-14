// lib/validation/wizard-extra.ts
// Schemas y utilidades de validación para los pasos del Wizard.

import { z } from "zod";

/* Utilidad: coerciona strings tipo "12.000", "3000", "" -> number */
const toNum = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return 0;
  if (typeof v === "string") {
    const s = v.replace(/[^\d.-]/g, "");
    return s === "" ? 0 : Number(s);
  }
  return v;
}, z.number().finite());

/* Paso 6 (Económico) */
export const Step6Schema = z.object({
  inversionInicial: toNum.optional(),
  capitalTrabajo: toNum.optional(),

  ventaAnual: toNum.optional(),      // "Ingresos meta" 12m
  ticket: toNum.optional(),
  conversionPct: toNum.optional(),   // 0–100

  costoVarPct: toNum.optional(),     // % del precio
  costoVarUnit: toNum.optional(),    // $ unitario (si viene, manda sobre %)

  gastosFijosMensuales: toNum.optional(),
  traficoMensual: toNum.optional(),

  presupuestoMarketing: toNum.optional(), // $/mes
  marketingMensual: toNum.optional(),     // alias opcional

  frecuenciaCompraMeses: toNum.optional(), // meses entre compras
  mesesPE: toNum.optional(),               // meses para llegar a P.E.

  // Campos opcionales que algunos formularios calculan
  clientesMensuales: z.number().nonnegative().optional(),
});
export type Step6 = z.infer<typeof Step6Schema>;

/* Paso 5 (Emocional) – valores 0–10 */
export const Step5Schema = z.object({
  urgencia: toNum.optional(),
  accesibilidad: toNum.optional(),
  competencia: toNum.optional(),
  experiencia: toNum.optional(),
  pasion: toNum.optional(),
  planesAlternativos: toNum.optional(),
  toleranciaRiesgo: toNum.optional(),
  testeoPrevio: toNum.optional(),
  redApoyo: toNum.optional(),
});
export type Step5 = z.infer<typeof Step5Schema>;

/* Paso 1 (cabecera) */
export const Step1Schema = z.object({
  projectName: z.string().min(1).max(120),
  founderName: z.string().optional().default(""),
  email: z.string().email().optional().default(""),
  ubicacion: z.string().optional().default(""),
});
export type Step1 = z.infer<typeof Step1Schema>;

/* Paso 2 (contexto corto) */
export const Step2Schema = z.object({
  idea: z.string().optional().default(""),
  ventajaTexto: z.string().optional().default(""),
  sectorId: z.string().optional().default(""),
  rubro: z.string().optional().default(""),

});
export type Step2 = z.infer<typeof Step2Schema>;

/* Paso 3 (VHC) */
export const Step3Schema = z.object({
  ventajaTexto: z.string().trim().optional().default(""),
});
export type Step3 = z.infer<typeof Step3Schema>;

/* Estructura general que usaremos para mapear a "legacy" */
export const WizardDataSchema = z.object({
  step1: Step1Schema.optional(),
  step2: Step2Schema.optional(),
  step3: Step3Schema.optional(),
  step5: Step5Schema.optional(),
  step6: Step6Schema,
});
export type WizardData = z.infer<typeof WizardDataSchema>;

/* Deriva costo unitario desde Step6 */
export function deriveCostoUnit(s6: Step6): number {
  const unit = s6.costoVarUnit ?? 0;
  const pct = s6.costoVarPct ?? 0;
  const ticket = s6.ticket ?? 0;

  if (unit && unit > 0) return Math.round(unit);
  if (pct && ticket) return Math.round((ticket * pct) / 100);
  return 0;
}

/* Payload para /api/plan (preview IA) */
export function toPlanApiPayload(data: WizardData) {
  const s1 = data.step1 ?? ({ projectName: "" } as Step1);
  const s2 = data.step2 ?? ({} as Step2);
  const s6 = data.step6;

  const costoUnit = deriveCostoUnit(s6);

  return {
    projectName: s1.projectName || "Proyecto",
    sectorId: s2.sectorId || "tech_saas",
    input: {
      ticket: s6.ticket ?? 0,
      costoUnit,
      ingresosMeta: s6.ventaAnual ?? 0,
      gastosFijos: (s6.gastosFijosMensuales ?? 0) * 12,
      marketingMensual: s6.presupuestoMarketing ?? s6.marketingMensual ?? 0,
      costoPct: s6.costoVarPct ?? 0,
    },
  };
}

// === Helper mínimo para reflejar meta en localStorage ===
export function mergeFromWizardMeta(patch: Record<string, any>) {
  try {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("arete:fromWizard");
    const prev = raw ? JSON.parse(raw) : {};
    const prevMeta = (prev?.meta ?? {}) as Record<string, any>;
    const next = { ...prev, meta: { ...prevMeta, ...patch } };
    localStorage.setItem("arete:fromWizard", JSON.stringify(next));
  } catch {
    // silencioso
  }
}
