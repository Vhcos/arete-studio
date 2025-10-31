export type SectorId =
  | "tech_saas"
  | "ecommerce_marketplace"
  | "services_agency"
  | "manufacturing_product"
  | "food_beverage"
  | "restaurant_cafe"
  | "health_wellness"
  | "education_edtech"
  | "tourism_hospitality"
  | "construction_realestate"
  | "logistics_mobility"
  | "retail_local"
  | "creative_media"
  | "agro_agritech";

export const SECTORS: { id: SectorId; label: string }[] = [
  { id: "tech_saas", label: "Tecnología (SaaS)" },
  { id: "ecommerce_marketplace", label: "E-commerce / Marketplace" },
  { id: "services_agency", label: "Servicios / Agencia" },
  { id: "manufacturing_product", label: "Manufactura / Producto" },
  { id: "food_beverage", label: "Alimentos y Bebidas" },
  { id: "restaurant_cafe", label: "Restaurante / Café" },
  { id: "health_wellness", label: "Salud y Bienestar" },
  { id: "education_edtech", label: "Educación / EdTech" },
  { id: "tourism_hospitality", label: "Turismo / Hospitality" },
  { id: "construction_realestate", label: "Construcción / Real Estate" },
  { id: "logistics_mobility", label: "Logística / Movilidad" },
  { id: "retail_local", label: "Retail Local" },
  { id: "creative_media", label: "Creativo / Media" },
  { id: "agro_agritech", label: "Agro / Agritech" },
];

export function isSectorId(x: string | undefined | null): x is SectorId {
  return !!SECTORS.find((s) => s.id === x);
}
