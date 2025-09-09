export type SectorId =
  | 'tech_saas'
  | 'ecommerce_marketplace'
  | 'services_agency'
  | 'manufacturing_product'
  | 'food_beverage'
  | 'restaurant_cafe'
  | 'health_wellness'
  | 'education_edtech'
  | 'tourism_hospitality'
  | 'construction_realestate'
  | 'logistics_mobility'
  | 'retail_local'
  | 'creative_media'
  | 'agro_agritech';

export type Sector = { id: SectorId; label: string; hint: string };

export const SECTORS: Sector[] = [
  { id:'tech_saas',              label:'Tecnología / SaaS',              hint:'Productos digitales, suscripciones, plataformas B2B/B2C.' },
  { id:'ecommerce_marketplace',  label:'E-commerce / Marketplace',       hint:'Tiendas online y marketplaces multi-vendedor.' },
  { id:'services_agency',        label:'Servicios profesionales / Agencia', hint:'Servicios expertos, agencias, consultoría.' },
  { id:'manufacturing_product',  label:'Manufactura / Producto físico',   hint:'Diseño, producción y distribución de bienes.' },
  { id:'food_beverage',          label:'Alimentos y Bebidas',             hint:'Elaboración y venta de alimentos/bebidas.' },
  { id:'restaurant_cafe',        label:'Restaurante / Cafetería',         hint:'Locales presenciales o dark-kitchen.' },
  { id:'health_wellness',        label:'Salud y Bienestar',               hint:'Servicios/tecnología para salud física/mental.' },
  { id:'education_edtech',       label:'Educación / EdTech',              hint:'Formación, academias y plataformas educativas.' },
  { id:'tourism_hospitality',    label:'Turismo / Hotelería',             hint:'Alojamiento, tours, experiencias.' },
  { id:'construction_realestate',label:'Construcción / Inmobiliaria',     hint:'Obras, oficios, corretaje, arriendo/venta.' },
  { id:'logistics_mobility',     label:'Logística / Transporte',          hint:'Delivery, flotas, movilidad, última milla.' },
  { id:'retail_local',           label:'Retail / Tienda física',          hint:'Comercio presencial, multi-SKU.' },
  { id:'creative_media',         label:'Creativo / Medios',               hint:'Agencias creativas, productoras, contenido.' },
  { id:'agro_agritech',          label:'Agro / AgroTech',                 hint:'Agrícola, alimentos primarios, tecnología agro.' },
];
