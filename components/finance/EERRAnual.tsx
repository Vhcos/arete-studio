"use client";

type Tpl = {
  cv_materiales: number; cv_personal: number; margen_contrib: number;
  gf_tot: number; gf_arriendo: number; gf_sueldosAdm: number; gf_sueldoDueno: number; gf_otros: number;
  marketing: number; resultado: number;
};

function fmtCL(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString("es-CL");
}

function Row({
  label, value, percent, strong, indent, cost,
}: {
  label: string; value: number; percent?: number; strong?: boolean; indent?: boolean; cost?: boolean;
}) {
  return (
    <div className="grid grid-cols-12 items-center py-2 border-b last:border-b-0">
      <div className={`col-span-6 text-sm ${indent ? "pl-4" : ""} ${strong ? "font-semibold" : ""}`}>{label}</div>
      <div className={`col-span-4 text-right text-sm ${cost ? "text-red-600 font-semibold" : strong ? "font-semibold" : ""}`}>
        ${fmtCL(value)}
      </div>
      <div className="col-span-2 text-right text-xs text-slate-500">
        {percent != null ? `${Math.round(percent * 100)}%` : ""}
      </div>
    </div>
  );
}

export default function EERRAnual({
  ventaAnual,
  tpl,
  title = "ESTADO DE RESULTADO ANUAL · (GUÍA)",
  impuestosPct = 0.02,
}: {
  ventaAnual: number; tpl: Tpl; title?: string; impuestosPct?: number;
}) {
  const V = Math.max(0, Math.round(ventaAnual) || 0);

  const cvMat = Math.round(V * tpl.cv_materiales);
  const cvPer = Math.round(V * tpl.cv_personal);
  const margen = Math.round(V * tpl.margen_contrib);

  const gfTot = Math.round(V * tpl.gf_tot);
  const gfArr = Math.round(V * tpl.gf_arriendo);
  const gfAdm = Math.round(V * tpl.gf_sueldosAdm);
  const gfDuo = Math.round(V * tpl.gf_sueldoDueno);
  const gfOtr = Math.round(V * tpl.gf_otros);

  const mkt   = Math.round(V * tpl.marketing);
  const resAI = Math.round(V * tpl.resultado);
  const imp   = Math.round(V * impuestosPct);
  const neta  = Math.max(0, resAI - imp);
  const netaPct = V > 0 ? neta / V : 0;

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="bg-slate-50 px-3 py-2 text-sm font-semibold border-b">
        {title}
      </div>
      <div className="px-3">
        <Row label="Venta anual" value={V} percent={1} strong />

        <Row label="Costo variable materiales" value={cvMat} percent={tpl.cv_materiales} cost />
        <Row label="Costo variable Personal"  value={cvPer} percent={tpl.cv_personal} cost />

        <Row label="Margen de contribución" value={margen} percent={tpl.margen_contrib} strong />

        <Row label="Gastos fijos totales" value={gfTot} percent={tpl.gf_tot} strong cost />
        <Row label="· Arriendo y gastos básicos" value={gfArr} percent={tpl.gf_arriendo} indent cost />
        <Row label="· Sueldos personal fijo y administración" value={gfAdm} percent={tpl.gf_sueldosAdm} indent cost />
        <Row label="· Sueldo del dueño" value={gfDuo} percent={tpl.gf_sueldoDueno} indent cost />
        <Row label="· Otros gastos fijos" value={gfOtr} percent={tpl.gf_otros} indent cost />

        <Row label="Gastos de Marketing o Comercialización" value={mkt} percent={tpl.marketing} cost />
        <Row label="Resultado antes de impuestos" value={resAI} percent={tpl.resultado} strong />
        <Row label="Impuestos (2%)" value={imp} percent={impuestosPct} cost />
        <Row label="Rentabilidad neta" value={neta} percent={netaPct} strong />
      </div>
    </div>
  );
}
