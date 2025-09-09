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
  inversionInicial:       z.number().nonnegative().default(0),
  capitalTrabajo:         z.number().nonnegative().default(0),

  // Ventas y demanda
  ventaAnio1:             z.number().nonnegative().default(0),
  ticket:                 z.number().nonnegative().default(0),
  conversionPct:          z.number().min(0).max(100).default(3),

  // Derivados opcionales que mostramos como preview
  clientesMensualesCalc:  z.number().nonnegative().default(0).optional(),
  clientesAnuales:        z.number().nonnegative().default(0).optional(),

  // Costos
  gastosFijosMensuales:   z.number().nonnegative().default(0),
  costoVarPct:            z.number().min(0).max(100).default(0).optional(),
  costoVarUnit:           z.number().nonnegative().default(0).optional(),

  // Tráfico y LTV
  traficoMensual:         z.number().nonnegative().default(0),
  ltv:                    z.number().nonnegative().default(0).optional(),

  // Modo de inversión
  modoInversion:          z.enum(["presupuesto", "cac"]).default("presupuesto"),
  presupuestoMarketing:   z.number().nonnegative().default(0).optional(),
  cpl:                    z.number().nonnegative().default(0).optional(),
  cac:                    z.number().nonnegative().default(0).optional(),

  // Frecuencia y punto de equilibrio
  frecuenciaCompraMeses:  z.number().min(1).max(24).default(6),
  mesesPE:                z.number().min(0).max(36).default(6),
});

export type Step5 = z.infer<typeof Step5Schema>;
export type Step6 = z.infer<typeof Step6Schema>;
