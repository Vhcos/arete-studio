// lib/nonAI-report.ts
import { StandardReport } from '../types/report';

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

  const industryBrief =
    `Rubro ${txt(rubro)} en ${txt(ubicacion)}; ticket ~$${fmt(price)} y margen unitario ~$${fmt(mc)}. ` +
    `Demanda cercana estimada ~${Math.round(sam12)} clientes/año.`;

  const competitionLocal =
    `Competencia en ${txt(ubicacion)} con ofertas ~$${fmt(Math.round(price*0.6))}–$${fmt(Math.round(price*1.4))}. ` +
    `Diferénciate por MC ~$${fmt(mc)}, servicio o velocidad.`;

  const swotAndMarket =
    `F: MC ~$${fmt(mc)}; O: SAM12 ~${Math.round(sam12)}; D: runway ${isFinite(runway)? runway.toFixed(1):'—'}m; A: CAC alto. ` +
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
