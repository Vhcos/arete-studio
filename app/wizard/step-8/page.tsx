// app/wizard/step-8/page.tsx
"use client";

import { useMemo } from "react";
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
const pct = (p: number) => `${Math.round(p * 100)}%`;
const r = (n: number) => Math.round(n);

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
  const margen = r(ventaAnual * tpl.margen_contrib);

  const gfTot = r(ventaAnual * tpl.gf_tot);
  const gfArr = r(ventaAnual * tpl.gf_arriendo);
  const gfAdm = r(ventaAnual * tpl.gf_sueldosAdm);
  const gfDuo = r(ventaAnual * tpl.gf_sueldoDueno);
  const gfOtr = r(ventaAnual * tpl.gf_otros);

  const mkt = r(ventaAnual * tpl.marketing);
  const resAI = r(ventaAnual * tpl.resultado);
  const impuestos = r(ventaAnual * impuestosPct);
  const rentaNeta = Math.max(0, resAI - impuestos);
  const rentaNetaPct = ventaAnual > 0 ? rentaNeta / ventaAnual : 0;

  /* mensual (réplica /12) */
  const toMensual = (anual: number) => r(anual / 12);
  const rows = [
    { label: "Venta", anual: ventaAnual, mensual: toMensual(ventaAnual), p: 1, strong: true, dividerTop: true },
    { label: "Costo variable materiales", anual: cvMat, mensual: toMensual(cvMat), p: tpl.cv_materiales, cost: true },
    { label: "Costo variable Personal", anual: cvPer, mensual: toMensual(cvPer), p: tpl.cv_personal, cost: true },
    { label: "Margen de contribución", anual: margen, mensual: toMensual(margen), p: tpl.margen_contrib, strong: true },

    { label: "Gastos fijos totales", anual: gfTot, mensual: toMensual(gfTot), p: tpl.gf_tot, cost: true, dividerTop: true },
    { label: "· Arriendo y gastos básicos", anual: gfArr, mensual: toMensual(gfArr), p: tpl.gf_arriendo, cost: true, indent: true },
    { label: "· Sueldos personal fijo y administración", anual: gfAdm, mensual: toMensual(gfAdm), p: tpl.gf_sueldosAdm, cost: true, indent: true },
    { label: "· Sueldo del dueño", anual: gfDuo, mensual: toMensual(gfDuo), p: tpl.gf_sueldoDueno, cost: true, indent: true },
    { label: "· Otros gastos fijos", anual: gfOtr, mensual: toMensual(gfOtr), p: tpl.gf_otros, cost: true, indent: true },

    { label: "Gastos de Marketing o Comercialización", anual: mkt, mensual: toMensual(mkt), p: tpl.marketing, cost: true, dividerTop: true },

    { label: "Resultado antes de impuestos", anual: resAI, mensual: toMensual(resAI), p: tpl.resultado, strong: true, dividerTop: true },
    { label: "Impuestos (2%)", anual: impuestos, mensual: toMensual(impuestos), p: impuestosPct, cost: true },
    { label: "Rentabilidad neta", anual: rentaNeta, mensual: toMensual(rentaNeta), p: rentaNetaPct, strong: true, dividerTop: true },
  ];

  return (
    <main className="mx-auto max-w-5xl px-2 py-8">
      <EconomicHeader
        title="Paso 8 · Tus resultados necesarios para tu planificación financiera"
        subtitle={
          <>
            Rubro: <b>{sectorLabel}</b>. Abajo verás tu <b>Estado de Resultado</b> como
            tabla comparativa: <b>Mensual</b> y <b>Anual</b>, con el <b>% guía</b> por concepto.
          </>
        }
      />

      {/* Tabla comparativa */}
      <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
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
                    ${fmtCL(value)}
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
                    <td className="py-2.5 px-4 text-right">
                      {moneyPill(r.mensual)}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {moneyPill(r.anual)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-500">
                      {pct(r.p || 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Ayudas al estilo Step-7 */}
        <div className="px-5 py-4 border-t bg-slate-50/60">
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-slate-800">
              ¿Cómo leer esta tabla?
            </summary>
            <ul className="mt-2 text-slate-600 text-[13px] list-disc pl-5 space-y-1">
              <li><b>EERR Mensual</b> es la réplica del anual dividido en 12.</li>
              <li>La columna <b>% guía</b> muestra el peso sugerido por rubro (referencia).</li>
              <li>Si cambias tus metas en el Paso 6–7, aquí verás el efecto en márgenes.</li>
            </ul>
          </details>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-slate-800">
                ¿Costo variable materiales?
              </summary>
              <p className="mt-1 text-slate-600 text-[13px]">
                Insumos, materias primas y componentes que <b>aumentan cuando vendes más</b>.
                En la tabla se expresan como valor y también como proporción de la venta.
              </p>
            </details>

            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-slate-800">
                ¿Costo variable Personal?
              </summary>
              <p className="mt-1 text-slate-600 text-[13px]">
                Mano de obra asociada directamente al nivel de ventas/producción:
                horas por turno, comisiones, repartos, bonos por venta, etc. <b>Sube
                y baja con tu actividad</b>.
              </p>
            </details>

            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-slate-800">
                ¿Qué significa “Margen de contribución”?
              </summary>
              <p className="mt-1 text-slate-600 text-[13px]">
                Es <b>Venta – Costos variables</b>. Con eso pagas los gastos fijos.
                Sobre el punto de equilibrio, ese margen se transforma en utilidad.
              </p>
            </details>

            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-slate-800">
                ¿Qué incluye “Gastos fijos totales”?
              </summary>
              <p className="mt-1 text-slate-600 text-[13px]">
                Arriendo/servicios, sueldos fijos/administración, sueldo del dueño y otros gastos
                que no cambian con el volumen de ventas.
              </p>
            </details>

            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-slate-800">
                Resultado antes de impuestos e Impuestos (2%)
              </summary>
              <p className="mt-1 text-slate-600 text-[13px]">
                El resultado antes de impuestos es tu utilidad previa a tributar. Para simplificar,
                usamos un <b>impuesto del 2% de la venta</b>. ¿De dónde sale ese 2%?
                En muchos casos el impuesto sobre la utilidad ronda el <b>25%</b>; si tu
                utilidad antes de impuestos está cerca del <b>10% de las ventas</b> (patrón de rubro),
                entonces 25% × 10% ≈ <b>2% de la venta</b>. Es una <i>aproximación práctica</i>.
              </p>
            </details>

            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-slate-800">
                Rentabilidad neta
              </summary>
              <p className="mt-1 text-slate-600 text-[13px]">
                Utilidad después de impuestos. El porcentaje indica qué parte de cada $100 vendidos
                se convierte en ganancia.
              </p>
            </details>
          </div>
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
