// types/report.ts
export type ReportSectionKeys =
  | 'industryBrief'      // 1) Rubro (≤30 palabras)
  | 'competitionLocal'   // 2) Competencia local   (≤50 palabras + $)
  | 'swotAndMarket'      // 3) FODA  + estimación de mercado  si es posible
  | 'finalVerdict';      // 4) Evaluación final (VERDE/ÁMBAR/ROJO + razón)

export type StandardReport = {
  source: 'nonAI' | 'AI';
  createdAt: string;
  sections: Record<ReportSectionKeys, string>;
  metrics: {
    marketEstimateCLP?: number;
  };
  ranking: {
    score: number;          // 0–100
    reasons: string[];      // por qué ganó/perdió puntos
    constraintsOK: boolean; // cumplió límites (palabras, $ en competencia, etc.)
  };
};
// Punto del gráfico radar
export type ChartPoint = {
  name: string;   // etiqueta (ej. "MC", "CAC", etc.)
  value: number;  // 0–10
};