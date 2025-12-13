// lib/economics/break-even.ts

export type BreakEvenInputs = {
  ticket: number;
  costoVarUnit?: number; // CLP por unidad
  costoVarPct?: number; // % del ticket
  gastosFijosMensuales: number; // CLP/mes
  marketingMensual: number; // CLP/mes
};

export type BreakEvenResult = {
  ticket: number;
  costoUnit: number; // costo variable unitario efectivo (CLP)
  mcUnit: number; // margen contribución unitario (CLP)
  gastosFijosMensuales: number;
  marketingMensual: number;
  gastosMensuales: number; // gastos fijos + marketing (CLP/mes)
  clientesPE: number; // ceil(gastosMensuales / mcUnit)
  ventasPE: number; // clientesPE * ticket
};

const clamp0 = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

function deriveCostoUnit(ticket: number, costoVarPct?: number, costoVarUnit?: number) {
  const t = clamp0(ticket);
  const unit = clamp0(Number(costoVarUnit ?? 0));
  const pct = clamp0(Number(costoVarPct ?? 0));

  if (t <= 0) return 0;

  if (unit > 0) return Math.min(unit, t);
  if (pct > 0) return Math.min((t * pct) / 100, t);

  return 0;
}

export function calcBreakEven(inputs: BreakEvenInputs): BreakEvenResult {
  const ticket = clamp0(Number(inputs.ticket ?? 0));
  const gastosFijosMensuales = clamp0(Number(inputs.gastosFijosMensuales ?? 0));
  const marketingMensual = clamp0(Number(inputs.marketingMensual ?? 0));

  const costoUnit = deriveCostoUnit(
    ticket,
    Number(inputs.costoVarPct ?? 0),
    Number(inputs.costoVarUnit ?? 0)
  );

  const mcUnit = Math.max(0, ticket - costoUnit);
  const gastosMensuales = Math.max(0, gastosFijosMensuales + marketingMensual);

  const clientesPE = mcUnit > 0 ? Math.ceil(gastosMensuales / mcUnit) : 0;
  const ventasPE = clientesPE > 0 ? Math.round(clientesPE * ticket) : 0;

  return {
    ticket,
    costoUnit: Math.round(costoUnit),
    mcUnit: Math.round(mcUnit),
    gastosFijosMensuales: Math.round(gastosFijosMensuales),
    marketingMensual: Math.round(marketingMensual),
    gastosMensuales: Math.round(gastosMensuales),
    clientesPE,
    ventasPE,
  };
}
