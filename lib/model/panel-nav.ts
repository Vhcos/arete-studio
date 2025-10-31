// lib/model/panel-nav.ts
import { getTemplateForSector } from "@/lib/model/step6-distributions";
import type { SectorId } from "@/lib/model/sectors";

const ceil = (x: number) => (x > 0 ? Math.ceil(x) : 0);

function deriveCostoUnit(ticket: number, costoVarPct?: number, costoVarUnit?: number) {
  if (typeof costoVarUnit === "number" && costoVarUnit > 0) return Math.min(costoVarUnit, ticket);
  if (typeof costoVarPct === "number" && costoVarPct > 0) return Math.min((ticket * costoVarPct) / 100, ticket);
  return 0;
}
const calcMcUnit = (ticket: number, costoUnit: number) => Math.max(ticket - costoUnit, 0);

export type PenRow = {
  mes: number;
  pctPE: number;
  clientes: number;
  ingresos: number;
  costoVar: number;
  mc: number;
  gastos: number;
  resultado: number;
  cajaAcum: number;
};

export type PanelNavSnapshot = {
  // unit economics
  ticket: number;
  costoUnit: number;
  mcUnit: number;
  CAC_estimado: number | null;

  // operación
  gastosFijosMensuales: number;
  marketingMensual: number;
  mesesPE: number;
  clientesPE: number;
  ventasPE: number;
  clientesObjetivoMes: number;

  // anual
  ventaAnual: number;
  rentabAntesImp: number;
  sueldoDueno?: number;

  // curva / capital
  rows: PenRow[];
  capitalTrabajo: number;           // suma de déficits
  capitalTrabajoNecesario: number;  // -minCaja
  minCaja: number;
  minCajaMes: number;

  // emocional
  s5idx: number;
};

function proyectar12Meses(opts: {
  ticket: number;
  costoUnit: number;
  gastosFijosMensuales: number;
  marketingMensual: number;
  clientesPE: number;
  mesesPE: number;
  clientesObjetivoMes?: number;
  cajaInicial?: number;
}) {
  const { ticket, costoUnit, gastosFijosMensuales, marketingMensual, clientesPE, mesesPE, clientesObjetivoMes = 0, cajaInicial = 0 } = opts;

  const rows: PenRow[] = [];
  let caja = Math.round(cajaInicial);
  let minCaja = caja;
  let minCajaMes = 0;

  for (let m = 1; m <= 12; m++) {
    const factor = mesesPE > 0 ? m / mesesPE : 1;
    const basePE = ceil(clientesPE * factor);
    const clientes = clientesObjetivoMes > 0 ? Math.min(basePE, Math.round(clientesObjetivoMes)) : basePE;

    const ingresos = clientes * ticket;
    const costoVar = clientes * costoUnit;
    const mc = Math.max(0, ingresos - costoVar);
    const gastos = Math.max(0, gastosFijosMensuales) + Math.max(0, marketingMensual);
    const resultado = mc - gastos;

    caja += resultado;
    if (caja < minCaja) { minCaja = caja; minCajaMes = m; }

    rows.push({ mes: m, pctPE: Math.min(1, factor) * 100, clientes, ingresos, costoVar, mc, gastos, resultado, cajaAcum: caja });
  }

  const capitalTrabajo = rows.filter(r => r.resultado < 0).reduce((a, r) => a + Math.abs(r.resultado), 0);

  return {
    rows,
    capitalTrabajo,
    minCaja,
    minCajaMes,
    capitalTrabajoNecesario: Math.max(0, Math.round(0 - minCaja)),
  };
}

// escala 1–3 → índice %
function s5idx(step5: any): number {
  const keys = ["urgencia","accesibilidad","competencia","experiencia","pasion","planesAlternativos","toleranciaRiesgo","testeoPrevio","redApoyo"];
  const vals = keys.map(k => {
    const n = Number(step5?.[k]); if (!Number.isFinite(n) || n <= 0) return 0;
    if (n <= 1) return 1; if (n <= 2) return 2; return 3;
  }).filter(v => v > 0);
  if (!vals.length) return 0;
  const sum = vals.reduce((a: number, b: number) => a + b, 0);
  return Math.round((sum / (vals.length * 3)) * 100);
}

export function computePanelNav(data: any): PanelNavSnapshot {
  const s6 = (data?.step6 ?? {}) as any;
  const ticket = Math.max(0, Number(s6.ticket ?? 0));
  const ventaAnual = Math.max(0, Number(s6.ventaAnual ?? s6.ventaAnio1 ?? 0));
  const ventaMensual = ventaAnual > 0 ? ventaAnual / 12 : 0;

  const sector: SectorId = (data?.step2?.sectorId as SectorId) ?? ("retail_local" as SectorId);
  const tpl = getTemplateForSector(sector);

  const gastosFijosMensuales = Math.max(0, Number(s6.gastosFijosMensuales ?? 0));
  const marketingMensual = Math.max(0, Number(s6.presupuestoMarketing ?? s6.marketingMensual ?? 0));
  const mesesPE = Math.max(1, Math.round(Number(s6.mesesPE ?? 6)));

  const costoUnit = deriveCostoUnit(ticket, Number(s6.costoVarPct ?? 0), Number(s6.costoVarUnit ?? 0));
  const mcUnit = calcMcUnit(ticket, costoUnit);
  const clientesPE = mcUnit > 0 && gastosFijosMensuales > 0 ? Math.ceil(gastosFijosMensuales / mcUnit) : 0;

  const clientesObjetivoMes =
    Number(s6.clientesMensuales ?? 0) > 0
      ? Math.round(Number(s6.clientesMensuales))
      : ticket > 0
      ? Math.round((ventaMensual || 0) / ticket)
      : 0;

  const snap = proyectar12Meses({
    ticket, costoUnit, gastosFijosMensuales, marketingMensual, clientesPE, mesesPE, clientesObjetivoMes, cajaInicial: 0,
  });

  const CAC_estimado =
    marketingMensual > 0 && clientesObjetivoMes > 0
      ? Math.round(marketingMensual / clientesObjetivoMes)
      : null;

  const clientesAnualesCalc = ticket > 0 ? Math.round(ventaAnual / ticket) : 0;
  const costoVarAnual =
    Number(s6.costoVarUnit ?? 0) > 0
      ? Math.round(clientesAnualesCalc * Number(s6.costoVarUnit))
      : Number(s6.costoVarPct ?? 0) > 0
      ? Math.round((ventaAnual * Number(s6.costoVarPct)) / 100)
      : 0;

  const rentabAntesImp = Math.round(
    ventaAnual - costoVarAnual - (gastosFijosMensuales + marketingMensual) * 12
  );

  const sueldoDueno = Math.round((ventaAnual || 0) * (tpl?.gf_sueldoDueno || 0));

  return {
    ticket, costoUnit, mcUnit, CAC_estimado,
    gastosFijosMensuales, marketingMensual, mesesPE, clientesPE, ventasPE: clientesPE * ticket, clientesObjetivoMes,
    ventaAnual, rentabAntesImp, sueldoDueno,
    rows: snap.rows,
    capitalTrabajo: snap.capitalTrabajo,
    capitalTrabajoNecesario: snap.capitalTrabajoNecesario,
    minCaja: snap.minCaja,
    minCajaMes: snap.minCajaMes,
    s5idx: s5idx(data?.step5),
  };
}
