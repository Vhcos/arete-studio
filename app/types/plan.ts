// app/types/plan.ts
export type SwitchingCost = 'Bajo' | 'Medio' | 'Alto';

export interface CompetitiveRow {
  empresa: string;
  ciudad: string;
  segmento: string;
  propuesta: string;
  precio: string;       // "$19/mes", "Freemium", etc.
  canal: string;        // "SEO", "Ads", "Partners", etc.
  switching_cost: SwitchingCost;
  moat: string;
  evidencia: string;    // enlaces/notas
}

export interface RegulationRow {
  area: 'Datos' | 'Marca' | 'Tributario' | 'Sectorial';
  que_aplica: string;
  requisito: string;
  plazo: string;
  riesgo: 'Bajo' | 'Medio' | 'Alto';
  accion: string;
}

export interface AiPlan {
  plan100: string;
  acciones: { dia: number; tarea: string; indicador: string }[];
  competencia: CompetitiveRow[];
  regulacion: RegulationRow[];
}


