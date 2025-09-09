import { z } from "zod";

export const Step1Schema = z.object({
  projectName: z.string().min(2, "Mínimo 2 caracteres").max(60),
  shortDescription: z.string().max(200).optional().or(z.literal("")),
  sector: z.string().min(2, "Indica un sector"),
});
export type Step1 = z.infer<typeof Step1Schema>;

export const businessTypeValues = ["saas","ecommerce","servicio","producto","restaurante"] as const;
export type BusinessType = typeof businessTypeValues[number];

export const Step2Schema = z.object({
  businessType: z.enum(businessTypeValues),
  template: z.string().min(2),
});
export type Step2 = z.infer<typeof Step2Schema>;

export const stageValues = ["idea","launch","growth"] as const;
export type Stage = typeof stageValues[number];

export const Step3Schema = z.object({
  headline: z.string().min(6, "Describe tu propuesta en una frase"),
  country: z.string().min(2),
  city: z.string().min(2),
  stage: z.enum(stageValues),
});
export type Step3 = z.infer<typeof Step3Schema>;
