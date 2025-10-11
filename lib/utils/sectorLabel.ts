// lib/utils/sectorLabel.ts
import { SECTORS, type SectorId } from "@/lib/model/sectors";

/** Normaliza strings a un id comparable (e.g., "Services Agency" → "services_agency") */
function toIdLike(s?: string) {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // sin tildes
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")                      // espacios/punct → _
    .replace(/^_+|_+$/g, "");
}

/** Diccionario simple de equivalencias en inglés → id de catálogo */
const EN_TO_ID: Record<string, SectorId> = {
  "services_agency": "services_agency",
  "service_agency": "services_agency",
  "marketing_agency": "services_agency",
  "saas": "tech_saas",
  "tech_saas": "tech_saas",
  "retail": "retail_local",
  "retail_store": "retail_local",
  "ecommerce": "ecommerce_marketplace",
  "e_commerce": "ecommerce_marketplace",
  "marketplace": "ecommerce_marketplace",
  "logistics": "logistics_mobility",
  "mobility": "logistics_mobility",
  "health": "health_wellness",
  "health_wellness": "health_wellness",
  "education": "education_edtech",
  "edtech": "education_edtech",
  "tourism": "tourism_hospitality",
  "hospitality": "tourism_hospitality",
  "construction": "construction_realestate",
  "real_estate": "construction_realestate",
  "creative": "creative_media",
  "media": "creative_media",
  "agro": "agro_agritech",
  "agritech": "agro_agritech",
  "food_beverage": "food_beverage",
  "restaurant": "restaurant_cafe",
  "cafe": "restaurant_cafe",
  "manufacturing": "manufacturing_product",
};

/** Devuelve la etiqueta en español del sector, si se puede resolver. */
export function sectorLabelES(opts: { sectorId?: string; rubro?: string }): string | undefined {
  const { sectorId, rubro } = opts || {};

  // 1) sectorId exacto
  const byId = SECTORS.find(s => s.id === sectorId);
  if (byId) return byId.label;

  // 2) rubro coincide con un id conocido (directo o normalizado)
  const rId = EN_TO_ID[toIdLike(rubro)] || toIdLike(rubro);
  const byRubId = SECTORS.find(s => s.id === (rId as SectorId));
  if (byRubId) return byRubId.label;

  // 3) rubro contiene palabras del label (heurística suave)
  if (rubro) {
    const norm = toIdLike(rubro);
    const fuzzy = SECTORS.find(s => norm.includes(toIdLike(s.label)));
    if (fuzzy) return fuzzy.label;
  }

  return undefined;
}
