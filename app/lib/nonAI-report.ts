// app/lib/nonAI-report.ts
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
                    
    const ubicacionTxt = (() => {
    if (input?.ubicacion) return txt(input.ubicacion);
    // si no hay "ubicacion", intenta reconstruir con otros campos posibles
    const partes = [
      input?.ciudad,
      input?.city,
      input?.comuna,
      input?.region,
      input?.pais,
      input?.countryName,
    ].filter(Boolean);
    return partes.length ? partes.join(', ') : '—';
  })();

  // ——— Resumen ejecutivo (ES) ———
  // Normaliza rubro a español si viene como slug/inglés; si ya viene en ES, lo respeta
  const rubroTxt = (() => {
    const es = input?.rubro_es ?? input?.rubroEs ?? input?.rubroTexto;
    const raw = es ?? input?.rubro ?? '—';
    const map: Record<string,string> = {
      tech_saas: 'software (SaaS)',
      food_beverage: 'alimentos y bebidas',
      ecommerce: 'e-commerce',
      healthcare: 'salud',
      education: 'educación',
      real_estate: 'bienes raíces',
      logistics: 'logística',
      tourism: 'turismo',
      construction: 'construcción',
      services: 'servicios',
      manufacturing_product: 'Manufactura / Producto físico',
      restaurant_cafe: 'Restaurante / Café',
      health_wellness: 'Salud y Bienestar',
      education_edtech: 'Educación / EdTech',
      tourism_hospitality: 'Turismo / Hotelería',
      construction_realestate: 'Construcción / Inmobiliaria',
      logistics_mobility: 'Logística / Transporte',
      retail_local: 'Retail / Tienda Física',
      creative_media: 'Creativo / Medios',
      agro_agritech: 'Agro / AgroTech',
      services_agency: 'Servicios profesionales / Agencia',
      ecommerce_marketplace: 'E-commerce / Marketplace',
    };
    const key = String(raw || '').toLowerCase();
    if (map[key]) return map[key];
    // slug → Title Case
    return String(raw).replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  })();

  // Brújula en texto (usa lo disponible del input / cálculos previos del fn)
  const N        = Math.max(0, Math.round(uMes || 0));          // clientes objetivo / mes
  const convPct  = num(input?.convPct) || 0;
  const conv     = convPct > 0 ? convPct / 100 : 0;
  const Q        = (N > 0 && conv > 0) ? Math.ceil(N / conv) : 0;   // visitas requeridas / mes
  const M        = num(input?.marketingMensual) || 0;                // presupuesto marketing / mes
  const CAC_goal = num(input?.cac) || 0;                              // meta CAC si no hay M
  const CPL      = (M > 0 && Q > 0) ? Math.round(M / Q) : 0;
  const CAC      = (M > 0 && N > 0) ? Math.round(M / N) : CAC_goal;

  // Datos de Brújula (para el resumen narrativo)
  const mesesPlan       = Number(input?.mesesPE ?? meta?.mesesPE ?? meta?.pe?.mesesPE ?? 6);
  const capitalTrabajo  = Number(meta?.capitalTrabajo ?? meta?.peCurve?.acumDeficitUsuario ?? meta?.peCurve?.acumDeficit
    ?? meta?.acumDeficitUsuario
    ?? 0
  );
  const ventasPE        = Number(meta?.ventasPE ?? 0);
  const clientsPE       = Number(meta?.clientsPE ?? 0);
  return [
        `Estás incursionando en ${rubroTxt} en ${ubicacionTxt}.`,
    `Tu ticket promedio es $${fCL(price)} y el margen de contribución por unidad se estima en $${fCL(mcUnit)}.`,
    `Con tus supuestos (primer objetivo), proyectamos ${fN(uMes)} clientes/mes (~${fN(uMes * 12)} al año) y ventas anuales por $${fCL((vMens || 0) * 12)}.`,
    `El resultado anual estimado (antes de impuestos) es $${fCL(resAn)}.`,
    N ? `Para alcanzar esa meta mensual de ${fN(N)} clientes, con una conversión del ${convPct}%, necesitas cerca de ${fN(Q)} visitas al mes.` : '',
    M > 0
      ? `Con un presupuesto de marketing de $${fCL(M)}/mes, tu costo por visita ronda $${fCL(CPL)} y el costo por cliente que gastas en marketing o lo que te 
       cuestra atraerlo para te compre es ~$${fCL(CAC)} esto proviene de tu presupeusto de marketing / numero de clientes.`
      : (CAC_goal > 0 ? `Como guía, busca que el costo por cliente sea cercano a $${fCL(CAC_goal)}.` : ''),
    // Reemplazo de “LTV/CAC ≥ 3” por lenguaje simple
    `Regla práctica: procura que el valor total que te deja o renta  cada cliente a lo largo del tiempo sea al menos tres veces lo que te cuesta conseguirlo (relación 3 a 1).`,
    `Para iniciar tu negocio con tranquilidad y considerando que tu plan es en ${mesesPlan} meses estar en punto de equilibrio, necesitarás al menos un capital de trabajo de $${fCL(capitalTrabajo)}; es tu colchón para ejecutar sin apuros. Tu punto de equilibrio está en $${fCL(ventasPE)} de venta mensual que lo alcanzarás en el periodo de ${mesesPlan} meses, lo que implica ${fN(Math.round(clientsPE))} clientes al mes. Con estas metas a la vista, cada campaña y mejora del producto puede medirse contra ellas: si nos acercamos a esta meta mes a mes, vamos en ruta; si no, ajustamos rápido. El objetivo es simple: enfocarse en cumplir el plan, crecer y mucha disciplina, evitando la ansiedad de caja y que el proyecto no llegue a puerto, mientras conviertes este periodo de aprendizaje en un negocio exitoso.`,
  ,
  ].filter(Boolean).join(' ');
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
