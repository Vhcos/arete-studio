import { z } from "zod";

// Cuenta palabras reales (no caracteres)
const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export const Step1Schema = z.object({
  // ahora permite vacío (mostrarás aviso, pero no bloquea)
  ubicacion: z.string().trim().optional().default(""), // ← NUEVO
  projectName: z.string().optional(),
  idea: z.string().trim().optional().default("").refine((v) => wordCount(v) <= 500, {message: "Máximo 500 palabras",}),
  founderName: z.string().optional(),
  notifyEmail: z.string().email("Ingresa un email válido para su informe").optional(),
});

export const Step2Schema = z.object({
  sectorId: z.string().min(2, "Selecciona un sector"),
  template: z.enum(["default", "lean", "pitch"]),
});

export const Step3Schema = z.object({
  ventajaTexto: z.string().trim().optional().default(""),

});

export type Step1 = z.infer<typeof Step1Schema>;
export type Step2 = z.infer<typeof Step2Schema>;
export type Step3 = z.infer<typeof Step3Schema>;
