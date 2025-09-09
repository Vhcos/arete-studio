import { z } from "zod";

export const Step5Schema = z.object({
  problema: z.number().min(0).max(10),
  accesibilidad: z.number().min(0).max(10),
  competencia: z.number().min(0).max(10),
  experiencia: z.number().min(0).max(10),
  pasion: z.number().min(0).max(10),
  planesAlternativos: z.number().min(0).max(10),
  riesgo: z.number().min(0).max(10),
  testeoPrevio: z.number().min(0).max(10),
  redApoyo: z.number().min(0).max(10),
});

export const Step6Schema = z.object({
  inversionInicial: z.number().nonnegative(),
  capitalTrabajo: z.number().nonnegative(),

  ventaAnio1: z.number().nonnegative(),
  ticket: z.number().nonnegative(),
  conversionPct: z.number().min(0).max(100),

  gastosFijosMensuales: z.number().nonnegative(),
  costoVarPct: z.number().min(0).max(100).optional(),
  costoVarUnit: z.number().nonnegative().optional(),

  traficoMensual: z.number().nonnegative(),
  ltv: z.number().nonnegative().optional(),

  modoInversion: z.enum(["presupuesto","cac"]),
  presupuestoMarketing: z.number().nonnegative().optional(),
  cpl: z.number().nonnegative().optional(),
  cac: z.number().nonnegative().optional(),

  frecuenciaCompraMeses: z.number().min(1),
  mesesPE: z.number().min(0),
});

export type Step5 = z.infer<typeof Step5Schema>;
export type Step6 = z.infer<typeof Step6Schema>;
