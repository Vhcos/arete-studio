// lib/nonAI-report.ts
import { StandardReport } from '../types/report';

// ---------- NUEVO: narrativa inversor-friendly reutilizable ----------
export function buildInvestorNarrative(input: any, meta: any): string {
  const price  = num(input?.ticket);
  const costU  = Math.min(num(input?.costoUnit), price);
  const mcUnit = Math.max(0, price - costU);

  const vMens  = num(input?.ingresosMeta);
  const pctCV  = num(input?.costoPct);
  const uMes   = price > 0 ? vMens / price : 0;                 // clientes/mes aprox.
  const cvMes  = pctCV > 0 ? vMens * (pctCV/100) : uMes * costU; // costo variable mensual
  const gfMes  = num(input?.gastosFijos);
  const mktMes = num(input?.marketingMensual);
  const resAn  = (vMens - cvMes - gfMes - mktMes) * 12;

  const fCL = (n:number)=> new Intl.NumberFormat('es-CL',{ maximumFractionDigits:0 })
                    .format(Math.max(0, Math.round(n||0)));
  const fN  = (n:number)=> new Intl.NumberFormat('es-CL',{ maximumFractionDigits:0 })
                    .format(Math.max(0, Math.round(n||0)));

  return [
    `Estás incursionando en el rubro ${txt(input?.rubro || '—')} en ${txt(input?.ubicacion || '—')}.`,
    `Estimas un ticket promedio de $${fCL(price)} y un margen de contribución unitario estimado de $${fCL(mcUnit)}.`,
    `Con tus supuestos actuales, proyectamos una atención de ${fN(uMes)} clientes/mes (~${fN(uMes*12)} al año) y ventas anuales de $${fCL(vMens*12)}.`,
    `El resultado anual estimado (antes de impuestos) es $${fCL(resAn)}.`,
    `Foco para inversores: sostener LTV/CAC ≥ 3 y disciplina de costos en los primeros 90 días.`
  ].join(' ');
}
export function buildNonAIReport(input: any, meta: any): StandardReport {
  const { rubro, ubicacion, ingresosMeta, ticket, costoUnit, cac, frecuenciaAnual,
          gastosFijos, capitalTrabajo } = input ?? {};

  const price = num(ticket);
  const cost  = Math.min(num(costoUnit), price); 
  const mc    = Math.max(0, price - cost);
  const ltv   = (num(frecuenciaAnual) || 6) * mc;
  const ratio = num(cac) ? ltv / num(cac) : (ltv > 0 ? 3 : 0);
  const sam12 = Math.max(0, num(meta?.clientsUsed) * 12);
  const gf    = num(gastosFijos);
  const cap   = num(capitalTrabajo);
  const runway = gf > 0 ? cap / gf : Infinity;

  const industryBrief = "";

  const competitionLocal =
    `Competencia en ${txt(ubicacion)} con ofertas ~$${fmt(Math.round(price*0.6))}–$${fmt(Math.round(price*1.4))}. ` +
    `Diferénciate por MC ~$${fmt(mc)}, servicio o velocidad.`;

  const swotAndMarket =
    `F: MC ~$${fmt(mc)}; O: Venta anual ~${Math.round(sam12)}; D: runway ${isFinite(runway)? runway.toFixed(1):'—'}m; A: CAC alto. ` +
    `Mercado anual estimado ~$${fmt(num(ingresosMeta)*12)}.`;

  const finalVerdict =
    ratio >= 3 && isFinite(runway) && runway >= 6
      ? 'VERDE – Avanzar (LTV/CAC ≥3 y runway ≥6m).'
      : ratio >= 2
      ? 'ÁMBAR – Ajustar (mejorar CAC o subir ticket hacia LTV/CAC ≥3).'
      : 'ROJO – Pausar (economía unitaria débil o runway insuficiente).';

  const base = {
    industryBrief: limitWords(industryBrief, 30),
    competitionLocal: limitWords(competitionLocal, 50),
    swotAndMarket: limitWords(swotAndMarket, 50),
    finalVerdict: finalVerdict,
  };

  const ranking = rankStandardReport({
    industryBrief: base.industryBrief,
    competitionLocal: base.competitionLocal,
    swotAndMarket: base.swotAndMarket,
    finalVerdict: base.finalVerdict,
    marketEstimateCLP: num(ingresosMeta) * 12,
  });

  return {
    source: 'nonAI',
    createdAt: new Date().toISOString(),
    sections: base,
    metrics: { marketEstimateCLP: num(ingresosMeta) * 12 || undefined },
    ranking,
  };
}

// ---------- ranking compartido (AI y no AI) ----------
export function rankStandardReport(r:{
  industryBrief:string; competitionLocal:string; swotAndMarket:string;
  finalVerdict:string; marketEstimateCLP?:number;
}) {
  const reasons:string[] = [];
  let score = 100;

  if (!/\$\d/.test(r.competitionLocal.replace(/\./g,''))) {
    score -= 15; reasons.push('Falta rango de precios en competencia.');
  }
  if (countWords(r.industryBrief) > 30) {
    score -= 10; reasons.push('industryBrief >30 palabras.');
  }
  if (countWords(r.competitionLocal) > 50) {
    score -= 10; reasons.push('competitionLocal >50 palabras.');
  }
  if (countWords(r.swotAndMarket) > 50) {
    score -= 10; reasons.push('swotAndMarket >50 palabras.');
  }
  if (!(r.marketEstimateCLP && r.marketEstimateCLP > 0)) {
    score -= 10; reasons.push('Sin estimación de mercado.');
  }
  if (!/(VERDE|ÁMBAR|ROJO)/i.test(r.finalVerdict)) {
    score -= 5; reasons.push('Veredicto poco claro.');
  }

  return { score: Math.max(0, score), reasons, constraintsOK: reasons.length===0 };
}

// ---------- helpers ----------
function num(x:any){ const n = typeof x==='string' ? parseFloat(x.replace(/\./g,'').replace(',','.')) : +x; return isFinite(n) ? n : 0; }
function txt(s:any){ return (s ?? '—').toString(); }
function fmt(n:number){ return new Intl.NumberFormat('es-CL').format(n||0); }
function countWords(s:string){ return (s||'').trim().split(/\s+/).filter(Boolean).length; }
function limitWords(s:string, n:number){ const p=(s||'').trim().split(/\s+/); return p.slice(0,n).join(' '); }
