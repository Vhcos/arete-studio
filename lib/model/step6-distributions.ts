import type { SectorId } from "./sectors";

/**
 * Plantillas por sector (sin tramos A–E).
 * Cada valor es proporción sobre la VENTA (0..1).
 * Step-6 usa: cv_materiales, cv_personal, gf_tot, marketing.
 * El desglose gf_* queda disponible para el informe financiero por rubro.
 */
export type DistributionTemplate = {
  cv_materiales: number;
  cv_personal: number;
  gf_tot: number;
  gf_arriendo: number;
  gf_sueldosAdm: number;
  gf_sueldoDueno: number;
  gf_otros: number;
  marketing: number;
  resultado: number;
};

const TEMPLATES: Record<SectorId, DistributionTemplate> = {
  tech_saas: {
    cv_materiales: 0.10, cv_personal: 0.18, gf_tot: 0.32,
    gf_arriendo: 0.03, gf_sueldosAdm: 0.21, gf_sueldoDueno: 0.04, gf_otros: 0.04,
    marketing: 0.20, resultado: 0.20,
  },
  ecommerce_marketplace: {
    cv_materiales: 0.55, cv_personal: 0.10, gf_tot: 0.15,
    gf_arriendo: 0.03, gf_sueldosAdm: 0.06, gf_sueldoDueno: 0.04, gf_otros: 0.02,
    marketing: 0.10, resultado: 0.10,
  },
  services_agency: {
    cv_materiales: 0.05, cv_personal: 0.50, gf_tot: 0.30,
    gf_arriendo: 0.05, gf_sueldosAdm: 0.18, gf_sueldoDueno: 0.04, gf_otros: 0.03,
    marketing: 0.05, resultado: 0.10,
  },
  manufacturing_product: {
    cv_materiales: 0.45, cv_personal: 0.20, gf_tot: 0.20,
    gf_arriendo: 0.04, gf_sueldosAdm: 0.10, gf_sueldoDueno: 0.04, gf_otros: 0.02,
    marketing: 0.05, resultado: 0.10,
  },
  food_beverage: {
    cv_materiales: 0.50, cv_personal: 0.10, gf_tot: 0.20,
    gf_arriendo: 0.03, gf_sueldosAdm: 0.11, gf_sueldoDueno: 0.04, gf_otros: 0.02,
    marketing: 0.15, resultado: 0.05,
  },
  restaurant_cafe: {
    cv_materiales: 0.30, cv_personal: 0.30, gf_tot: 0.25,
    gf_arriendo: 0.12, gf_sueldosAdm: 0.07, gf_sueldoDueno: 0.04, gf_otros: 0.02,
    marketing: 0.05, resultado: 0.10,
  },
  health_wellness: {
    cv_materiales: 0.05, cv_personal: 0.47, gf_tot: 0.33,
    gf_arriendo: 0.12, gf_sueldosAdm: 0.12, gf_sueldoDueno: 0.04, gf_otros: 0.05,
    marketing: 0.05, resultado: 0.10,
  },
  education_edtech: {
    cv_materiales: 0.03, cv_personal: 0.56, gf_tot: 0.26,
    gf_arriendo: 0.08, gf_sueldosAdm: 0.12, gf_sueldoDueno: 0.04, gf_otros: 0.02,
    marketing: 0.05, resultado: 0.10,
  },
  tourism_hospitality: {
    cv_materiales: 0.05, cv_personal: 0.40, gf_tot: 0.30,
    gf_arriendo: 0.10, gf_sueldosAdm: 0.08, gf_sueldoDueno: 0.04, gf_otros: 0.08,
    marketing: 0.20, resultado: 0.05,
  },
  construction_realestate: {
    cv_materiales: 0.50, cv_personal: 0.20, gf_tot: 0.20,
    gf_arriendo: 0.02, gf_sueldosAdm: 0.10, gf_sueldoDueno: 0.04, gf_otros: 0.04,
    marketing: 0.00, resultado: 0.10,
  },
  logistics_mobility: {
    cv_materiales: 0.30, cv_personal: 0.45, gf_tot: 0.18,
    gf_arriendo: 0.03, gf_sueldosAdm: 0.08, gf_sueldoDueno: 0.04, gf_otros: 0.03,
    marketing: 0.02, resultado: 0.05,
  },
  retail_local: {
    cv_materiales: 0.65, cv_personal: 0.12, gf_tot: 0.15,
    gf_arriendo: 0.07, gf_sueldosAdm: 0.03, gf_sueldoDueno: 0.04, gf_otros: 0.01,
    marketing: 0.03, resultado: 0.05,
  },
  creative_media: {
    cv_materiales: 0.05, cv_personal: 0.55, gf_tot: 0.27,
    gf_arriendo: 0.06, gf_sueldosAdm: 0.13, gf_sueldoDueno: 0.04, gf_otros: 0.04,
    marketing: 0.03, resultado: 0.10,
  },
  agro_agritech: {
    cv_materiales: 0.67, cv_personal: 0.15, gf_tot: 0.13,
    gf_arriendo: 0.05, gf_sueldosAdm: 0.02, gf_sueldoDueno: 0.04, gf_otros: 0.02,
    marketing: 0.00, resultado: 0.05,
  },
};

export function getTemplateForSector(sector: SectorId): DistributionTemplate {
  return TEMPLATES[sector] ?? TEMPLATES["retail_local"];
}
