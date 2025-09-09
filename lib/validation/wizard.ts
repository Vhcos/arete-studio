import { z } from "zod";

export const Step1Schema = z.object({
  projectName: z.string().min(2, "Ingresa un nombre válido"),
  shortDescription: z.string().max(280).optional(),
  founderName: z.string().min(2, "Nombre muy corto").optional(),
  notifyEmail: z.string().email("Email inválido").optional(),
});

export const Step2Schema = z.object({
  sectorId: z.string().min(2, "Selecciona un sector"),
  template: z.enum(["default", "lean", "pitch"]),
});

export const Step3Schema = z.object({
  headline: z.string().min(3, "Escribe tu idea en una frase"),
  country: z.string().min(2, "Selecciona un país"),
  city: z.string().optional(),
  stage: z.enum(["idea", "launch", "growth"]),
});

export type Step1 = z.infer<typeof Step1Schema>;
export type Step2 = z.infer<typeof Step2Schema>;
export type Step3 = z.infer<typeof Step3Schema>;
