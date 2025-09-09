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
  ticket: z.number().nonnegative(),
  costoUnit: z.number().nonnegative(),
  ingresosMeta: z.number().nonnegative(),
  gastosFijos: z.number().nonnegative(),
  marketingMensual: z.number().nonnegative(),
  costoPct: z.number().min(0).max(100),
});

export type Step5 = z.infer<typeof Step5Schema>;
export type Step6 = z.infer<typeof Step6Schema>;
