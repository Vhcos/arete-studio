/** 14 sectores canónicos de Arete: usar en Wizard, API y Reporte */
export const SECTORS = [
  { id: "tech_saas",            label: "Tecnología / SaaS",              keywords: ["saas","software","plataforma","nube","cloud","b2b","b2c","app","api","webapp"], defaultTemplate: "lean"  as const, description: "Productos digitales, suscripciones, plataformas B2B/B2C." },
  { id: "ecommerce",            label: "E-commerce / Marketplace",       keywords: ["ecommerce","tienda","venta online","carrito","marketplace","catalogo","dropshipping"],                 defaultTemplate: "pitch" as const, description: "Tiendas online y marketplaces multi-vendedor." },
  { id: "services_pro",         label: "Servicios profesionales / Agencia",keywords: ["servicio","agencia","consultor","asesoria","freelance","marketing","estudio","contabilidad","legal"], defaultTemplate: "lean"  as const, description: "Servicios expertos, agencias, consultoría." },
  { id: "manufacturing",        label: "Manufactura / Producto físico",  keywords: ["producto","fabricación","hardware","artesanal","cosmética","ropa","dispositivo","insumos"],            defaultTemplate: "pitch" as const, description: "Diseño, producción y distribución de bienes." },
  { id: "food_beverage",        label: "Alimentos y Bebidas",            keywords: ["food","alimentos","bebidas","snack","gourmet","cocina","delivery","catering"],                       defaultTemplate: "lean"  as const, description: "Elaboración y venta de alimentos/bebidas." },
  { id: "restaurant",           label: "Restaurante / Cafetería",        keywords: ["restaurante","café","cafetería","bar","comida","dark kitchen","delivery","menú"],                     defaultTemplate: "lean"  as const, description: "Locales presenciales o cocinas ocultas." },
  { id: "health_wellness",      label: "Salud y Bienestar",              keywords: ["salud","bienestar","fitness","medico","clinica","terapia","psicologia","nutricion"],                  defaultTemplate: "lean"  as const, description: "Servicios/tecnología para salud física/mental." },
  { id: "education_edtech",     label: "Educación / EdTech",             keywords: ["educacion","edtech","curso","academia","tutor","plataforma educativa","lms","bootcamp"],              defaultTemplate: "lean"  as const, description: "Formación, academias y plataformas educativas." },
  { id: "tourism_hospitality",  label: "Turismo y Hospitalidad",         keywords: ["turismo","hotel","hostal","viaje","tour","guia","reserva","experiencias"],                           defaultTemplate: "pitch" as const, description: "Alojamiento, tours y experiencias." },
  { id: "finance_fintech",      label: "Finanzas / Fintech",             keywords: ["finanzas","fintech","pagos","wallet","credito","prestamo","inversion","banco"],                      defaultTemplate: "lean"  as const, description: "Pagos, préstamos, inversión, herramientas financieras." },
  { id: "real_estate",          label: "Construcción e Inmobiliario",    keywords: ["inmobiliario","real estate","construccion","arriendo","venta","edificacion","propiedad"],            defaultTemplate: "pitch" as const, description: "Desarrollo, corretaje, administración de propiedades." },
  { id: "transport_logistics",  label: "Transporte y Logística",         keywords: ["transporte","logistica","reparto","ultima milla","courier","camion","flota","almacen"],               defaultTemplate: "pitch" as const, description: "Movilización de personas/mercancías, última milla." },
  { id: "agriculture_agritech", label: "Agro / AgriTech",                keywords: ["agro","agricultura","campo","cultivo","ganaderia","agritech","riego","insumos"],                      defaultTemplate: "lean"  as const, description: "Producción agrícola y tecnología aplicada." },
  { id: "energy_cleantech",     label: "Energía y Medioambiente",        keywords: ["energia","solar","eolica","hidrogeno","cleantech","reciclaje","sostenible","carbono"],                defaultTemplate: "lean"  as const, description: "Energías renovables y soluciones sustentables." },
  { id: "media_entertainment",  label: "Medios y Entretenimiento",       keywords: ["contenido","medios","streaming","podcast","musica","videojuegos","evento","comunidad"],               defaultTemplate: "pitch" as const, description: "Contenido, gaming, eventos y plataformas creativas." },
] as const;

export type SectorId = (typeof SECTORS)[number]["id"];
export const SECTOR_IDS = SECTORS.map(s => s.id) as SectorId[];

export function sectorById(id?: string) {
  return SECTORS.find(s => s.id === id);
}
export function templateForSector(id?: string): "default"|"lean"|"pitch" {
  return (sectorById(id)?.defaultTemplate ?? "default");
}
