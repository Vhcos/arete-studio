import { z } from "zod";
import { LENGTHS } from "@/lib/model/app-form";
import { SECTOR_IDS } from "@/lib/domain/sectors";

export const Step1Schema = z.object({
  projectName: z
    .string()
    .min(LENGTHS.projectNameMin, `Mínimo ${LENGTHS.projectNameMin} caracteres`)
    .max(LENGTHS.projectNameMax),
  shortDescription: z.string().max(LENGTHS.shortDescMax).optional().or(z.literal("")),
  sector: z.string().min(LENGTHS.sectorMin, "Indica un sector"),
});
export type Step1 = z.infer<typeof Step1Schema>;

/** Tipos auxiliares */
export type BusinessType = "saas" | "ecommerce" | "servicio" | "producto" | "restaurante";

/**
 * Nota: z.enum necesita una tupla, pero nuestros IDs vienen de un array dinámico.
 * Usamos string() + refine para validar contra SECTOR_IDS y mantener flexibilidad.
 */
export const Step2Schema = z.object({
  sectorId: z.string().refine(v => SECTOR_IDS.includes(v as any), "Sector inválido"),
  template: z.string().min(2),
  // businessType: z.string().optional(),
});
export type Step2 = {
  sectorId: (typeof SECTOR_IDS)[number];
  template: string;
  // businessType?: BusinessType;
};

export const stageValues = ["idea","launch","growth"] as const;
export type Stage = typeof stageValues[number];

export const Step3Schema = z.object({
  headline: z.string().min(6, "Describe tu propuesta en una frase"),
  country: z.string().min(2),
  city: z.string().min(2),
  stage: z.enum(stageValues),
});
export type Step3 = z.infer<typeof Step3Schema>;
