// components/report/PanelNavegacion.tsx
"use client";
import React from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { computePanelNav } from "@/lib/model/panel-nav";

const formatCLP = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })
    .format(Math.round(n || 0));

export default function PanelNavegacion() {
  const { data } = useWizardStore();
  const p = computePanelNav(data);

  return (
    <section className="mt-6 rounded-2xl border bg-white shadow-sm p-5">
      <h3 className="font-semibold text-lg">Panel de Navegación</h3>
      <p className="text-sm text-slate-600 mt-1">
        Resumen ejecutivo: ventas, costos, <b>punto de equilibrio</b>, <b>capital de trabajo</b> y KPI emocionales.
      </p>

      {/* KPIs */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border p-4">
          <h4 className="font-medium">Objetivos unitarios</h4>
          <ul className="mt-2 text-sm space-y-1">
            <li>Ticket: <b>{formatCLP(p.ticket)}</b></li>
            <li>Costo variable unit.: <b>{formatCLP(p.costoUnit)}</b></li>
            <li>Margen por unidad: <b>{formatCLP(p.mcUnit)}</b></li>
            <li>CAC (est.): <b>{p.CAC_estimado != null ? formatCLP(p.CAC_estimado) : "—"}</b></li>
            <li>Clientes para P.E.: <b>{p.clientesPE}</b></li>
          </ul>
        </div>

        <div className="rounded-xl border p-4">
          <h4 className="font-medium">Operación mensual</h4>
          <ul className="mt-2 text-sm space-y-1">
            <li>Gastos fijos: <b>{formatCLP(p.gastosFijosMensuales)}</b></li>
            <li>Marketing: <b>{formatCLP(p.marketingMensual)}</b></li>
            <li>Meses a P.E.: <b>{p.mesesPE}</b></li>
            <li>Ventas P.E. (mensual): <b>{formatCLP(p.ventasPE)}</b></li>
          </ul>
        </div>

        <div className="rounded-xl border p-4">
          <h4 className="font-medium">Indicadores anuales</h4>
          <ul className="mt-2 text-sm space-y-1">
            <li>Venta anual: <b>{formatCLP(p.ventaAnual)}</b></li>
            <li>Rentab. antes de imp.: <b>{formatCLP(p.rentabAntesImp)}</b></li>
            <li>Capital de trabajo (déficits): <b>{formatCLP(p.capitalTrabajo)}</b></li>
            <li>Sueldo dueño (plantilla): <b>{formatCLP(p.sueldoDueno || 0)}</b></li>
          </ul>
        </div>
      </div>

      {/* Mini curva (texto simple para informe) */}
      <details className="mt-4">
        <summary className="cursor-pointer font-medium">Curva hacia P.E. (12 meses)</summary>
        <div className="mt-2 overflow-auto">
          <table className="min-w-[640px] text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="text-left pr-3">Mes</th>
                <th className="text-right pr-3">Resultado</th>
                <th className="text-right pr-3">Avance P.E.</th>
                <th className="text-right">Caja acum.</th>
              </tr>
            </thead>
            <tbody>
              {p.rows.map(r => (
                <tr key={r.mes} className="border-t">
                  <td className="py-1 pr-3">M{r.mes}</td>
                  <td className="py-1 pr-3 text-right">{formatCLP(r.resultado)}</td>
                  <td className="py-1 pr-3 text-right">{Math.round(r.pctPE)}%</td>
                  <td className="py-1 text-right">{formatCLP(r.cajaAcum)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Capital requerido hasta P.E.: <b>{formatCLP(p.capitalTrabajo)}</b> ·
          Mínimo de caja: <b>{formatCLP(p.minCaja)}</b> (mes {p.minCajaMes})
        </p>
      </details>

      {/* Índice emocional */}
      <div className="mt-3 text-xs text-slate-500">
        Índice emocional (Step-5): <b>{p.s5idx}%</b>
      </div>
    </section>
  );
}
