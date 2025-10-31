"use client";
import React from "react";

type Tpl = {
  cv_materiales?: number;
  cv_personal?: number;
  gf_tot?: number;
  marketing?: number;
};

export default function Step8Board({
  ventaAnual,
  tpl,
}: {
  ventaAnual: number;
  tpl: Tpl;
}) {
  const V = Math.max(0, Number.isFinite(ventaAnual) ? ventaAnual : 0);
  const cvPct = Math.max(0, Math.min(1, (tpl.cv_materiales ?? 0) + (tpl.cv_personal ?? 0)));
  const cv    = Math.round(V * cvPct);
  const margen = V - cv;

  const gf  = Math.round(V * (tpl.gf_tot ?? 0));
  const mkt = Math.round(V * (tpl.marketing ?? 0));

  const rai = Math.max(0, margen - (gf + mkt));
  const imp = Math.round(0.25 * rai);             // 25% del RAI (entero)
  const net = Math.max(0, rai - imp);

  const fmtCL = (n:number) => n.toLocaleString("es-CL", { maximumFractionDigits: 0 });

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">Estado de Resultados anual (Step-8)</h3>
        <p className="text-xs text-slate-500 mt-1">Impuestos: 25% del resultado antes de impuestos (RAI).</p>
      </div>
      <div className="p-4">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-t"><td className="py-1 pr-4">Ventas</td><td className="py-1 font-semibold">${fmtCL(V)}</td></tr>
            <tr className="border-t text-red-600"><td className="py-1 pr-4">Costos variables</td><td className="py-1">-${fmtCL(cv)}</td></tr>
            <tr className="border-t"><td className="py-1 pr-4">Margen de contribución</td><td className="py-1 font-semibold">${fmtCL(margen)}</td></tr>
            <tr className="border-t text-red-600"><td className="py-1 pr-4">Gastos fijos totales</td><td className="py-1">-${fmtCL(gf)}</td></tr>
            <tr className="border-t text-red-600"><td className="py-1 pr-4">Gastos de marketing</td><td className="py-1">-${fmtCL(mkt)}</td></tr>
            <tr className="border-t"><td className="py-1 pr-4">Resultado antes de impuestos</td><td className="py-1 font-semibold">${fmtCL(rai)}</td></tr>
            <tr className="border-t text-red-600"><td className="py-1 pr-4">Impuestos (25% RAI)</td><td className="py-1">-${fmtCL(imp)}</td></tr>
            <tr className="border-t"><td className="py-1 pr-4">Rentabilidad neta</td><td className="py-1 font-semibold">${fmtCL(net)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
