// lib/model/step6-distributions.ts
// Definiciones de plantillas de distribución de costos y gastos (step 6)
// y mapeo rubro → plantilla
// EERR propuestos 
import type { SectorId } from "@/lib/model/sectors";

export type Step6TemplateId = "A" | "B" | "C" | "D" | "E";

export type Step6Percentages = {
  venta: number;                 // siempre 1.0
  cv_materiales: number;         // %
  cv_personal: number;           // %
  margen_contrib: number;        // %
  gf_tot: number;                // %
  gf_arriendo: number;           // %
  gf_sueldosAdm: number;         // %
  gf_sueldoDueno: number;        // %
  gf_otros: number;              // %
  marketing: number;             // %
  resultado: number;             // %
};

// === Plantillas (leídas de tu Excel, hoja “% POR RUBRO”) ===
export const STEP6_TEMPLATES: Record<Step6TemplateId, Step6Percentages> = {
  A: {
    venta: 1.0,
    cv_materiales: 0.35,
    cv_personal: 0.30,
    margen_contrib: 0.35,
    gf_tot: 0.22,
    gf_arriendo: 0.08,
    gf_sueldosAdm: 0.08,
    gf_sueldoDueno: 0.04,
    gf_otros: 0.02,
    marketing: 0.03,
    resultado: 0.10,
  },
  B: {
    venta: 1.0,
    cv_materiales: 0.45,
    cv_personal: 0.23,
    margen_contrib: 0.32,
    gf_tot: 0.20,
    gf_arriendo: 0.04,
    gf_sueldosAdm: 0.08,
    gf_sueldoDueno: 0.04,
    gf_otros: 0.04,
    marketing: 0.02,
    resultado: 0.10,
  },
  C: {
    venta: 1.0,
    cv_materiales: 0.05,
    cv_personal: 0.55,
    margen_contrib: 0.40,
    gf_tot: 0.25,
    gf_arriendo: 0.03,
    gf_sueldosAdm: 0.16,
    gf_sueldoDueno: 0.04,
    gf_otros: 0.02,
    marketing: 0.05,
    resultado: 0.10,
  },
  D: {
    venta: 1.0,
    cv_materiales: 0.40,
    cv_personal: 0.25,
    margen_contrib: 0.35,
    gf_tot: 0.22,
    gf_arriendo: 0.08,
    gf_sueldosAdm: 0.08,
    gf_sueldoDueno: 0.04,
    gf_otros: 0.02,
    marketing: 0.03,
    resultado: 0.10,
  },
  E: {
    venta: 1.0,
    cv_materiales: 0.60,
    cv_personal: 0.06,
    margen_contrib: 0.34,
    gf_tot: 0.14,
    gf_arriendo: 0.03,
    gf_sueldosAdm: 0.05,
    gf_sueldoDueno: 0.04,
    gf_otros: 0.02,
    marketing: 0.10,
    resultado: 0.10,
  },
};

// === Rubro (SectorId) → Plantilla (A..E) ===
export const RUBRO_TO_TEMPLATE: Record<SectorId, Step6TemplateId> = {
  
  food_beverage: "A",
  restaurant_cafe: "A",
  retail_local: "A",
  tourism_hospitality: "A",

  construction_realestate: "B",
  logistics_mobility: "B",

  tech_saas: "C",
  services_agency: "C",
  health_wellness: "C",
  education_edtech: "C",
  creative_media: "C",

  agro_agritech: "D",
  manufacturing_product: "D",
  
  ecommerce_marketplace: "E",
};

export function getTemplateIdForSector(sector: SectorId): Step6TemplateId {
  return RUBRO_TO_TEMPLATE[sector] ?? "A"; // default seguro
}

export function getTemplateForSector(sector: SectorId): Step6Percentages {
  return STEP6_TEMPLATES[getTemplateIdForSector(sector)];
}
