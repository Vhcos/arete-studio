// app/wizard/step-8/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/state/wizard-store";
import { PrevButton, NextButton } from "@/components/wizard/WizardNav";
import { getTemplateForSector } from "@/lib/model/step6-distributions";
import { SECTORS } from "@/lib/model/sectors";
import type { SectorId } from "@/lib/model/sectors";
import UpsellBanner from "@/components/wizard/UpsellBanner";
import EconomicHeader from "@/components/wizard/EconomicHeader";
import BotIcon from "@/components/icons/BotIcon";

/* helpers */
const fmtCL = (n: number) => n.toLocaleString("es-CL");
const fmtCLP = (n: number) => `$${fmtCL(Math.round(n || 0))}`;
const pctTxt = (p: number) => `${Math.round((p || 0) * 100)}%`;
const r = (n: number) => Math.round(n);
const clamp0 = (n: number) => Math.max(0, n);

export default function Step8Page() {
  const router = useRouter();
  const { data } = useWizardStore();

  /* sector/plantilla */
  const sector: SectorId =
    (data.step2?.sectorId as SectorId) ?? ("retail_local" as SectorId);
  const tpl = getTemplateForSector(sector);
  const sectorInfo = SECTORS.find((s) => s.id === sector);
  const sectorLabel = sectorInfo?.label ?? sector;

  /* venta anual desde Step-6 */
  const ventaAnual = useMemo(() => {
    const v = Number(data.step6?.ventaAnio1 ?? 0);
    return Number.isFinite(v) && v > 0 ? r(v) : 0;
  }, [data.step6?.ventaAnio1]);

  /* derivados anuales (según tu plantilla) */
  const impuestosPct = 0.02;

  const cvMat = r(ventaAnual * tpl.cv_materiales);
  const cvPer = r(ventaAnual * tpl.cv_personal);
  const costosVariables = clamp0(cvMat + cvPer);

  const margen = clamp0(ventaAnual - costosVariables);

  const gfTot = r(ventaAnual * tpl.gf_tot);
  const gfArr = r(ventaAnual * tpl.gf_arriendo);
  const gfAdm = r(ventaAnual * tpl.gf_sueldosAdm);
  const gfDuo = r(ventaAnual * tpl.gf_sueldoDueno);
  const gfOtr = r(ventaAnual * tpl.gf_otros);

  const mkt = r(ventaAnual * tpl.marketing);
  const resAI = clamp0(margen - (gfTot + mkt)); // resultado antes de impuestos (no negativo)
  const impuestos = r(ventaAnual * impuestosPct);
  const rentaNeta = clamp0(resAI - impuestos);
  const rentaNetaPct = ventaAnual > 0 ? rentaNeta / ventaAnual : 0;

  /* mensual (réplica /12) */
  const toMensual = (anual: number) => r(anual / 12);

  const rows = [
    { label: "Venta", anual: ventaAnual, mensual: toMensual(ventaAnual), p: 1, strong: true, dividerTop: true },
    { label: "Costo variable materiales", anual: cvMat, mensual: toMensual(cvMat), p: ventaAnual > 0 ? cvMat / ventaAnual : 0, cost: true },
    { label: "Costo variable Personal", anual: cvPer, mensual: toMensual(cvPer), p: ventaAnual > 0 ? cvPer / ventaAnual : 0, cost: true },
    { label: "Margen de contribución", anual: margen, mensual: toMensual(margen), p: ventaAnual > 0 ? margen / ventaAnual : 0, strong: true },

    { label: "Gastos fijos totales", anual: gfTot, mensual: toMensual(gfTot), p: ventaAnual > 0 ? gfTot / ventaAnual : 0, cost: true, dividerTop: true },
    { label: "· Arriendo y gastos básicos", anual: gfArr, mensual: toMensual(gfArr), p: ventaAnual > 0 ? gfArr / ventaAnual : 0, cost: true, indent: true },
    { label: "· Sueldos personal fijo y administración", anual: gfAdm, mensual: toMensual(gfAdm), p: ventaAnual > 0 ? gfAdm / ventaAnual : 0, cost: true, indent: true },
    { label: "· Sueldo del dueño", anual: gfDuo, mensual: toMensual(gfDuo), p: ventaAnual > 0 ? gfDuo / ventaAnual : 0, cost: true, indent: true },
    { label: "· Otros gastos fijos", anual: gfOtr, mensual: toMensual(gfOtr), p: ventaAnual > 0 ? gfOtr / ventaAnual : 0, cost: true, indent: true },

    { label: "Gastos de Marketing o Comercialización", anual: mkt, mensual: toMensual(mkt), p: ventaAnual > 0 ? mkt / ventaAnual : 0, cost: true, dividerTop: true },

    { label: "Resultado antes de impuestos", anual: resAI, mensual: toMensual(resAI), p: ventaAnual > 0 ? resAI / ventaAnual : 0, strong: true, dividerTop: true },
    { label: "Impuestos (2%)", anual: impuestos, mensual: toMensual(impuestos), p: impuestosPct, cost: true },
    { label: "Rentabilidad neta", anual: rentaNeta, mensual: toMensual(rentaNeta), p: rentaNetaPct, strong: true, dividerTop: true },
  ];

  /* UI toggles */
  const [basicMode, setBasicMode] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);

  /* indicadores visuales */
  const healthBadge =
    rentaNetaPct >= 0.1
      ? { txt: "Excelente (≥10%)", cls: "bg-emerald-100 text-emerald-800" }
      : rentaNetaPct >= 0.06
      ? { txt: "Sólida (6–9%)", cls: "bg-sky-100 text-sky-800" }
      : rentaNetaPct > 0
      ? { txt: "Ajustable (<6%)", cls: "bg-amber-100 text-amber-800" }
      : { txt: "En riesgo (≤0%)", cls: "bg-rose-100 text-rose-800" };

  /* barras “waterfall” (Venta → Costos variables → Gastos fijos → Marketing → Impuestos → Ganancia) */
  const segVenta = ventaAnual;
  const segCV = costosVariables;
  const segGF = gfTot;
  const segMkt = mkt;
  const segImp = impuestos;
  const segUtil = rentaNeta;
  const denom = Math.max(1, segVenta); // evita /0
  const segStyle = (v: number, color: string) => ({
    width: `${Math.min(100, Math.round((clamp0(v) / denom) * 100))}%`,
    backgroundColor: color,
  });

  return (
    <main className="mx-auto max-w-5xl px-2 py-8">
      <EconomicHeader
        title="Paso 8 · ¿Cuánto podrías ganar con tu idea?"
        subtitle={<>Rubro: <b>{sectorLabel}</b>. Mira tu <b>Estado de Resultados</b> con cifras mensuales, anuales y ayudas visuales.</>}
        sectorLabel={sectorLabel}
      />

      {/* Toggles */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex overflow-hidden rounded-xl border">
          <button
            onClick={() => setBasicMode(true)}
            className={`px-3 py-1.5 text-sm ${basicMode ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"}`}
          >
            Modo básico
          </button>
          <button
            onClick={() => setBasicMode(false)}
            className={`px-3 py-1.5 text-sm ${!basicMode ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"}`}
          >
            Modo experto
          </button>
        </div>

        <button
          onClick={() => setHelpOpen(v => !v)}
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          {helpOpen ? "Ocultar definiciones" : "Expandir definiciones"}
        </button>
      </div>

      {/* Tarjetas KPI resumidas */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border p-4 bg-emerald-50/60">
          <div className="text-xs text-emerald-800">Rentabilidad neta</div>
          <div className="mt-1 text-lg font-semibold text-emerald-900">{fmtCLP(rentaNeta)} <span className="text-sm">({pctTxt(rentaNetaPct)})</span></div>
          <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] ${healthBadge.cls}`}>{healthBadge.txt}</span>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-slate-500">Venta anual</div>
          <div className="mt-1 text-lg font-semibold">{fmtCLP(ventaAnual)}</div>
          <div className="text-xs text-slate-500">Mensual: {fmtCLP(toMensual(ventaAnual))}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-slate-500">Costos variables (totales)</div>
          <div className="mt-1 text-lg font-semibold text-rose-700">{fmtCLP(costosVariables)}</div>
          <div className="text-xs text-slate-500">{pctTxt(costosVariables / denom)} de la venta</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-slate-500">Gastos fijos + Marketing</div>
          <div className="mt-1 text-lg font-semibold text-rose-700">{fmtCLP(gfTot + mkt)}</div>
          <div className="text-xs text-slate-500">{pctTxt((gfTot + mkt) / denom)} de la venta</div>
        </div>
      </section>

      {/* Waterfall simple */}
      <section className="mt-6 rounded-2xl border bg-white shadow-sm p-5">
        <h3 className="font-medium">De la venta a tu ganancia</h3>
        <div className="mt-3 space-y-2 text-sm">
          <div className="h-3 w-full rounded bg-slate-200 overflow-hidden">
            <div className="h-3" style={segStyle(segVenta, "#93c5fd")} title="Venta" />
          </div>
          <div className="flex justify-between text-slate-600"><span>Venta</span><span>{fmtCLP(segVenta)}</span></div>

          <div className="h-3 w-full rounded bg-slate-200 overflow-hidden">
            <div className="h-3" style={segStyle(segCV, "#fda4af")} title="Costos variables" />
          </div>
          <div className="flex justify-between text-slate-600"><span>− Costos variables</span><span>{fmtCLP(segCV)}</span></div>

          <div className="h-3 w-full rounded bg-slate-200 overflow-hidden">
            <div className="h-3" style={segStyle(segGF, "#fecaca")} title="Gastos fijos" />
          </div>
          <div className="flex justify-between text-slate-600"><span>− Gastos fijos</span><span>{fmtCLP(segGF)}</span></div>

          <div className="h-3 w-full rounded bg-slate-200 overflow-hidden">
            <div className="h-3" style={segStyle(segMkt, "#fde68a")} title="Marketing" />
          </div>
          <div className="flex justify-between text-slate-600"><span>− Marketing</span><span>{fmtCLP(segMkt)}</span></div>

          <div className="h-3 w-full rounded bg-slate-200 overflow-hidden">
            <div className="h-3" style={segStyle(segImp, "#c7d2fe")} title="Impuestos (2%)" />
          </div>
          <div className="flex justify-between text-slate-600"><span>− Impuestos (2%)</span><span>{fmtCLP(segImp)}</span></div>

          <div className="h-3 w-full rounded bg-slate-200 overflow-hidden">
            <div className="h-3" style={segStyle(segUtil, "#86efac")} title="Rentabilidad neta" />
          </div>
          <div className="flex justify-between text-slate-600"><span>= Rentabilidad neta</span><span className="font-semibold text-emerald-700">{fmtCLP(segUtil)}</span></div>
        </div>
      </section>

      {/* Distribución por % y definiciones */}
      <section className="mt-6 rounded-2xl border bg-white shadow-sm p-5">
        <h3 className="font-medium">Distribución sobre la venta</h3>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            { k: "Costos variables (mat.)", v: cvMat, c: "bg-rose-200" },
            { k: "Costos variables (personal)", v: cvPer, c: "bg-rose-300" },
            { k: "Gastos fijos totales", v: gfTot, c: "bg-orange-200" },
            { k: "Marketing", v: mkt, c: "bg-amber-200" },
            { k: "Impuestos (2%)", v: impuestos, c: "bg-indigo-200" },
            { k: "Rentabilidad neta", v: rentaNeta, c: "bg-emerald-200" },
          ].map((it) => {
            const p = denom > 0 ? clamp0(it.v) / denom : 0;
            return (
              <div key={it.k}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">{it.k}</span>
                  <span className="text-slate-500">{pctTxt(p)}</span>
                </div>
                <div className="mt-1 h-2 w-full rounded bg-slate-100 overflow-hidden">
                  <div className={`h-2 ${it.c}`} style={{ width: `${Math.min(100, Math.round(p * 100))}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Definiciones con control global */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <details open={helpOpen} className="text-sm">
            <summary className="cursor-pointer font-medium text-slate-800">¿Qué es el Margen de contribución?</summary>
            <p className="mt-1 text-slate-600 text-[13px]">
              <b>Venta – Costos variables</b>. Con ese margen pagas los gastos fijos. Sobre el Punto de Equilibrio, se vuelve utilidad.
            </p>
          </details>
          <details open={helpOpen} className="text-sm">
            <summary className="cursor-pointer font-medium text-slate-800">¿Qué son los Costos fijos?</summary>
            <p className="mt-1 text-slate-600 text-[13px]">
              Gastos que no cambian con tu volumen de ventas: arriendo/servicios, sueldos fijos/administración, sueldo del dueño y otros.
            </p>
          </details>
          <details open={helpOpen} className="text-sm">
            <summary className="cursor-pointer font-medium text-slate-800">Impuestos (2%)</summary>
            <p className="mt-1 text-slate-600 text-[13px]">
              Aproximación práctica: si la utilidad antes de impuestos ronda el 10% de las ventas y la tasa es ~25%, entonces 25%×10% ≈ <b>2% de la venta</b>.
            </p>
          </details>
          <details open={helpOpen} className="text-sm">
            <summary className="cursor-pointer font-medium text-slate-800">Sugerencias</summary>
            <ul className="mt-1 list-disc pl-5 text-slate-600 text-[13px] space-y-1">
              <li>Si tus <b>costos variables</b> superan 40%, revisa precios o proveedores.</li>
              <li>Una <b>rentabilidad ≥10%</b> es excelente para escalar.</li>
            </ul>
          </details>
        </div>
      </section>

      {/* Tabla comparativa (solo modo experto) */}
      {!basicMode && (
        <section className="mt-6 rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b bg-slate-50">
            <h3 className="font-semibold">Estado de Resultado (EERR) — guía por rubro</h3>
            <p className="text-xs text-slate-600">
              Los porcentajes provienen del patrón del rubro y son orientativos.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="text-left py-3 px-4 w-[45%]">Ítem</th>
                  <th className="text-right py-3 px-4">EERR Mensual</th>
                  <th className="text-right py-3 px-4">EERR Anual</th>
                  <th className="text-right py-3 px-4 w-24">% guía</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const isNet = r.label === "Rentabilidad neta";
                  const moneyPill = (value: number) => (
                    <span
                      className={[
                        "inline-block",
                        "px-2 py-0.5 rounded-full border",
                        isNet
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold"
                          : "border-transparent",
                      ].join(" ")}
                    >
                      {fmtCLP(value)}
                    </span>
                  );

                  return (
                    <tr
                      key={i}
                      className={[
                        "border-t",
                        r.dividerTop ? "border-slate-300" : "border-slate-100",
                        r.cost ? "text-red-700" : "",
                        r.strong ? "font-semibold" : "",
                      ].join(" ")}
                    >
                      <td className={`py-2.5 px-4 ${r.indent ? "pl-8" : ""}`}>{r.label}</td>
                      <td className="py-2.5 px-4 text-right">{moneyPill(r.mensual)}</td>
                      <td className="py-2.5 px-4 text-right">{moneyPill(r.anual)}</td>
                      <td className="py-2.5 px-4 text-right text-slate-500">{pctTxt(r.p || 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Historia + CTA */}
      <section className="mt-6 rounded-2xl border bg-white shadow-sm p-5">
        <p className="text-sm text-slate-700">
          <b>Ejemplo realista:</b> “María vendió {fmtCLP(toMensual(ventaAnual))} este mes; tras sus costos y gastos,
          obtuvo una utilidad de {fmtCLP(toMensual(rentaNeta))}. Usó este tablero para ajustar su precio y reducir costos
          de proveedores antes de lanzar”.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => router.push("/wizard/step-6")}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
            title="Ajusta metas/porcentajes del rubro y vuelve a simular"
          >
            Probar cambiando precio o costos
          </button>
          <span className="text-xs text-slate-500">Tip: pequeños cambios mueven mucho tu utilidad.</span>
        </div>
      </section>

      {/* Navegación */}
      <div className="mt-6 flex items-center justify-between">
        <PrevButton href="/wizard/step-7" />
        <NextButton onClick={() => router.push("/wizard/step-9")} />
      </div>

      <UpsellBanner />

      <p className="mt-4 text-xs text-slate-500">
        Nota: estos números son orientativos. La{" "}
        <span className="inline-flex items-center gap-1 font-medium">
          <BotIcon className="w-3.5 h-3.5" /> IA Aret3
        </span>{" "}
        los usará para ajustar tu Tablero e Informe final.
      </p>
    </main>
  );
}
