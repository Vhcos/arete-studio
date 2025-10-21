// app/wizard/step-6/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/state/wizard-store";
import { PrevButton, NextButton } from "@/components/wizard/WizardNav";
import { Step6Schema } from "@/lib/validation/wizard-extra";
import { toLegacyForm } from "@/lib/bridge/wizard-to-legacy";
import { getTemplateForSector } from "@/lib/model/step6-distributions";
import type { SectorId } from "@/lib/model/sectors";
import EconomicHeader from "./_components/EconomicHeader";
import { SECTORS } from "@/lib/model/sectors";
import EERRAnual from "@/components/finance/EERRAnual";

/* =============== Helpers CLP y números =============== */
const onlyDigitsComma = (s: string) => s.replace(/[^\d,]/g, "");
const fmtCL = (n: number) => n.toLocaleString("es-CL");
const pct = (p: number) => `${Math.round(p * 100)}%`;

function formatCLPInput(v: string | number | null | undefined): string {
  if (v == null) return "";
  let s = String(v).trim();
  if (!s) return "";
  s = onlyDigitsComma(s);
  const [intRaw, fracRaw] = s.split(",");
  const intClean = (intRaw || "").replace(/[^\d]/g, "");
  if (!intClean) return "";
  const intFmt = Number(intClean).toLocaleString("es-CL");
  return fracRaw ? `${intFmt},${fracRaw.replace(/[^\d]/g, "")}` : intFmt;
}
function parseCLP(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const s = String(v).replace(/\./g, "").replace(/\s+/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : 0;
}
function num(v: any): number {
  if (typeof v === "string") return parseCLP(v);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/* =============== Estado local =============== */
type Local = {
  inversionInicial?: string;
  capitalTrabajo?: string;

  // Ventas dual
  ventaMensual?: string;
  ventaAnio1?: string;

  ticket?: string; // $ por cliente

  // Campos visibles (se recalculan por plantilla al guardar/auto)
  gastosFijosMensuales?: string;
  presupuestoMarketing?: string;
  costoVarUnit?: string;

  // Extras
  conversionPct?: number | string;
  frecuenciaCompraMeses?: number | string;
  mesesPE?: number | string;
};

export default function Step6Page() {
  const router = useRouter();
  const { data, setStep6 } = useWizardStore();

  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Prefill coherente
  const anualPrev = data.step6?.ventaAnio1 ?? 0;
  const mensualPrev = anualPrev ? Math.round(anualPrev / 12) : 0;

  const [local, setLocal] = useState<Local>({
    inversionInicial: formatCLPInput(data.step6?.inversionInicial ?? 0),
    capitalTrabajo: formatCLPInput(data.step6?.capitalTrabajo ?? 0),

    ventaMensual: formatCLPInput(mensualPrev),
    ventaAnio1: formatCLPInput(anualPrev),

    ticket: formatCLPInput(data.step6?.ticket ?? 0),

    gastosFijosMensuales: formatCLPInput(data.step6?.gastosFijosMensuales ?? 0),
    presupuestoMarketing: formatCLPInput(data.step6?.presupuestoMarketing ?? 0),
    costoVarUnit: formatCLPInput(data.step6?.costoVarUnit ?? 0),

    conversionPct: data.step6?.conversionPct ?? 0,
    frecuenciaCompraMeses: data.step6?.frecuenciaCompraMeses ?? 6,
    mesesPE: data.step6?.mesesPE ?? 6,
  });

  /* =============== Sector / Plantilla =============== */
  const sector: SectorId =
    (data.step2?.sectorId as SectorId) ?? ("retail_local" as SectorId);
  const tpl = getTemplateForSector(sector);
  const sectorInfo  = SECTORS.find(s => s.id === sector);
  const sectorLabel = sectorInfo?.label ?? sector;       // “Construcción / Inmobiliaria”
  const sectorHint  = sectorInfo?.hint  ?? sectorLabel;  // descripción en español

  /* =============== Derivados para la tabla y resumen =============== */
  const derived = useMemo(() => {
    const ventaMensual =
      num(local.ventaMensual) > 0
        ? num(local.ventaMensual)
        : Math.round(num(local.ventaAnio1) / 12);

    const ventaAnual =
      num(local.ventaAnio1) > 0 ? num(local.ventaAnio1) : ventaMensual * 12;

    const ticketNum = num(local.ticket);
    const clientesAnuales = ticketNum > 0 ? Math.round(ventaAnual / ticketNum) : 0;
    const clientesMensuales = Math.round(clientesAnuales / 12);

    // Distribución por plantilla (anual)
    const cvMat = Math.round(ventaAnual * tpl.cv_materiales);
    const cvPer = Math.round(ventaAnual * tpl.cv_personal);
    const margen = Math.round(ventaAnual * tpl.margen_contrib);

    const gfTot = Math.round(ventaAnual * tpl.gf_tot);
    const gfArr = Math.round(ventaAnual * tpl.gf_arriendo);
    const gfAdm = Math.round(ventaAnual * tpl.gf_sueldosAdm);
    const gfDuo = Math.round(ventaAnual * tpl.gf_sueldoDueno);
    const gfOtr = Math.round(ventaAnual * tpl.gf_otros);

    const mkt = Math.round(ventaAnual * tpl.marketing);
    const resAI = Math.round(ventaAnual * tpl.resultado);

    // Impuestos 2% y neta
    const impuestosPct = 0.02;
    const impuestos = Math.round(ventaAnual * impuestosPct);
    const rentaNeta = Math.max(0, resAI - impuestos);
    const rentaNetaPct = ventaAnual > 0 ? rentaNeta / ventaAnual : 0;

    // Para inputs/visores
    const costoVarUnitario =
      clientesAnuales > 0 ? Math.round((cvMat + cvPer) / clientesAnuales) : 0;

    return {
      ventaMensual,
      ventaAnual,

      clientesAnuales,
      clientesMensuales,

      cvMat,
      cvPer,
      margen,

      gfTot,
      gfArr,
      gfAdm,
      gfDuo,
      gfOtr,

      mkt,
      resAI,
      impuestos,
      rentaNeta,
      rentaNetaPct,

      costoVarUnitario,
    };
  }, [local, tpl]);

  /* ========== Autorelleno visible según plantilla ========== */
  useEffect(() => {
    const ventaAnual = derived.ventaAnual;
    const ticketNum = num(local.ticket);
    if (!ventaAnual || !ticketNum) return;

    const gfMensual = Math.round((ventaAnual * tpl.gf_tot) / 12);
    const mktMensual = Math.round((ventaAnual * tpl.marketing) / 12);

    const clientesAnuales = Math.round(ventaAnual / ticketNum);
    const costoVarUnit =
      clientesAnuales > 0
        ? Math.round((derived.cvMat + derived.cvPer) / clientesAnuales)
        : 0;

    const next = {
      gastosFijosMensuales: formatCLPInput(gfMensual),
      presupuestoMarketing: formatCLPInput(mktMensual),
      costoVarUnit: formatCLPInput(costoVarUnit),
    };

    setLocal((p) => {
      const ch1 = (p.gastosFijosMensuales ?? "") !== next.gastosFijosMensuales;
      const ch2 = (p.presupuestoMarketing ?? "") !== next.presupuestoMarketing;
      const ch3 = (p.costoVarUnit ?? "") !== next.costoVarUnit;
      if (!ch1 && !ch2 && !ch3) return p;
      return { ...p, ...next };
    });
  }, [derived.ventaAnual, derived.cvMat, derived.cvPer, local.ticket, tpl]);

  /* =============== Dual inputs Ventas =============== */
  function onChangeVentaMensual(v: string) {
    const mensFmt = formatCLPInput(v);
    const mensNum = parseCLP(mensFmt);
    const anualNum = mensNum > 0 ? mensNum * 12 : 0;
    setLocal((p) => ({
      ...p,
      ventaMensual: mensFmt,
      ventaAnio1: anualNum ? formatCLPInput(anualNum) : "",
    }));
  }
  function onChangeVentaAnual(v: string) {
    const anualFmt = formatCLPInput(v);
    const anualNum = parseCLP(anualFmt);
    const mensNum = anualNum > 0 ? Math.round(anualNum / 12) : 0;
    setLocal((p) => ({
      ...p,
      ventaAnio1: anualFmt,
      ventaMensual: mensNum ? formatCLPInput(mensNum) : "",
    }));
  }

  /* =============== Guardar y avanzar =============== */
  async function onNext() {
    if (busy) return;
    try {
      setBusy(true);
      setErr(null);

      const inversionInicial = parseCLP(local.inversionInicial);
      const capitalTrabajo = parseCLP(local.capitalTrabajo);

      const ventaAnual =
        num(local.ventaAnio1) > 0 ? num(local.ventaAnio1) : num(local.ventaMensual) * 12;

      const ticketNum = parseCLP(local.ticket);
      const conv = Math.max(0, Math.min(100, num(local.conversionPct)));

      // Totales que alimentan el Form
      const gfMensual = Math.round((ventaAnual * tpl.gf_tot) / 12);
      const mktMensual = Math.round((ventaAnual * tpl.marketing) / 12);
      const clientesAnuales = ticketNum > 0 ? ventaAnual / ticketNum : 0;
      const cvTot = Math.round(ventaAnual * (tpl.cv_materiales + tpl.cv_personal));
      const costoVarUnit = clientesAnuales > 0 ? Math.round(cvTot / clientesAnuales) : 0;

      const s6 = {
        inversionInicial,
        capitalTrabajo,
        ventaAnio1: ventaAnual,
        ticket: ticketNum,
        conversionPct: conv,

        gastosFijosMensuales: gfMensual,
        presupuestoMarketing: mktMensual,
        costoVarUnit,

        // compat
        costoVarPct: 0,
        traficoMensual: 0,
        clientesMensuales: 0,
        modoInversion: "presupuesto" as const,
        cpl: 0,
        cac: 0,
        frecuenciaCompraMeses: num(local.frecuenciaCompraMeses) || 6,
        mesesPE: num(local.mesesPE) || 6,
      };

      const parsed = Step6Schema.safeParse(s6);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        throw new Error(first?.message || "Revisa los campos");
      }

      setStep6(s6 as any);

      // bridge preview
      const legacy = toLegacyForm({ ...data, step6: s6 } as any);
      localStorage.setItem("arete:legacyForm", JSON.stringify(legacy));

      router.push("/wizard/step-5"); // siguiente según tu flujo
    } catch (e: any) {
      setErr(e?.message ?? "Error al guardar");
    } finally {
      setBusy(false);
    }
  }

  /* =============== UI =============== */

  const Row = ({
    label,
    value,
    percent,
    strong,
    indent,
    cost, // pinta en rojo costos/gastos
  }: {
    label: string;
    value: number;
    percent?: number;
    strong?: boolean;
    indent?: boolean;
    cost?: boolean;
  }) => (
    <div className="grid grid-cols-12 items-center py-2 border-b last:border-b-0">
      <div className={`col-span-6 text-sm ${indent ? "pl-4" : ""} ${strong ? "font-semibold" : ""}`}>
        {label}
      </div>
      <div
        className={`col-span-4 text-right text-sm ${
          cost ? "text-red-600 font-semibold" : strong ? "font-semibold" : ""
        }`}
      >
        ${fmtCL(value)}
      </div>
      <div className="col-span-2 text-right text-xs text-slate-500">
        {percent != null ? pct(percent) : ""}
      </div>
    </div>
  );

  const templateLetter =
    ((): "A" | "B" | "C" | "D" | "E" => {
      return "A" as any; // si quieres mostrar la letra real, puedes exponerla desde getTemplateForSector
    })();

  return (
    <main className="mx-auto max-w-7xl px-0.1 py-8">
      <EconomicHeader
  sectorLabel={sectorLabel}
  // usamos tus valores ya calculados para mostrar el chip "Clientes/mes"
  // si alguno es 0, pasamos null para ocultar el chip y evitar ruido visual
  ventaMensual={derived.ventaMensual > 0 ? derived.ventaMensual : null}
  ticket={num(local.ticket) > 0 ? num(local.ticket) : null}
/>

<p className="text-xs text-slate-600 mt-2 mb-6">
  Rubro: <span className="font-medium">{sectorLabel}</span> · Plantilla:{" "}
  <span className="font-medium">{templateLetter}</span>
</p>


      {/* Layout de 2 columnas: Izq = A y B (apilados). Der = Estado de Resultado + nota */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Columna IZQ: A y B apilados */}
        <div className="space-y-6">
          {/* === A. Datos mínimos === */}
          <div className="rounded-xl border-2 p-4">
            <h2 className="font-semibold mb-2">A.- Datos mínimos</h2>
            <p className="text-sm text-slate-600 mb-4">
              Ingresa estos datos para una aproximación a tu estado de resultado. Puedes escribir{" "}
              <strong>venta mensual</strong> o <strong>venta anual</strong>; el otro se completa solo.
            </p>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium">Capital inicial disponible($)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={local.inversionInicial ?? ""}
                  onChange={(e) =>
                    setLocal((p) => ({ ...p, inversionInicial: formatCLPInput(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium">Venta Mensual – $</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={local.ventaMensual ?? ""}
                    onChange={(e) => onChangeVentaMensual(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Venta Anual – $</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={local.ventaAnio1 ?? ""}
                    onChange={(e) => onChangeVentaAnual(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium">Ticket / Ingreso promedio por cliente ($)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={local.ticket ?? ""}
                  onChange={(e) => setLocal((p) => ({ ...p, ticket: formatCLPInput(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </label>
            </div>
          </div>

          {/* === B. Aplicaremos patrones del rubro === */}
          <div className="rounded-xl border-2 p-4">
            <h2 className="font-semibold mb-2">B. Aplicaremos patrones del rubro</h2>
            <p className="text-sm text-slate-600 mb-4">
              Estos valores se calculan automáticamente con tu rubro para alimentar el formulario.
              Puedes sobreescribirlos si tienes datos reales.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium">Gastos fijos mensuales ($)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={local.gastosFijosMensuales ?? ""}
                  onChange={(e) =>
                    setLocal((p) => ({ ...p, gastosFijosMensuales: formatCLPInput(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </label>
             
              <label className="block">
                <span className="text-sm font-medium">Gastos de Marketing mensual ($)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={local.presupuestoMarketing ?? ""}
                  onChange={(e) =>
                    setLocal((p) => ({ ...p, presupuestoMarketing: formatCLPInput(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </label>
            </div>

            {/* KPIs que moviste a B */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border px-3 py-2">
                <div className="text-slate-500">Clientes anuales</div>
                <div className="font-semibold">{fmtCL(derived.clientesAnuales)}</div>
              </div>
              <div className="rounded-md border px-3 py-2">
                <div className="text-slate-500">Clientes mensuales</div>
                <div className="font-semibold">{fmtCL(derived.clientesMensuales)}</div>
              </div>
              <div className="rounded-md border px-3 py-2">
                <div className="text-slate-500">Costo variable unitario</div>
                <div className="font-semibold">${fmtCL(derived.costoVarUnitario)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna DER: Estado de resultado + Nota */}
        <div className="rounded-xl border-8 p-1">
          <h3 className="text-sm font-semibold mb-1">
            Con esta guía puedes elaborar tu primer presupuesto
          </h3>
          <p className="text-xs text-slate-600 mb-4">
            Te muestro los grandes gastos que suelen intervenir en tu rubro. Si tu presupuesto real es mejor
            en algún ítems mejoraras tu rentabilidad.
          </p>

          {/* Tabla: Estado de Resultado Inicial (Guía) RESUMIDO EN OTRO ARCHIVO */}
         <EERRAnual ventaAnual={derived.ventaAnual} tpl={tpl} />
            <p className="mt-4 text-xs text-slate-700 italic">
            Nota: Porque buscamos el 8% mínimo  por que representa un mes de venta 100% 12(meses)=8%,
            entonces así sabes que estas ganando un mes de ventas con rentabilidad neta.
          </p>
        </div>
      </section>

      {/* === C. Datos adicionales (full width) === */}
      <section className="rounded-xl border-2 p-4 mb-6">
        <h2 className="font-semibold mb-2">C. Datos adicionales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">Frecuencia de compra (meses)</span>
            <input
              type="text"
              inputMode="numeric"
              value={local.frecuenciaCompraMeses ?? ""}
              onChange={(e) =>
                setLocal((p) => ({ ...p, frecuenciaCompraMeses: e.target.value.replace(/[^\d]/g, "") }))
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Meses para punto de equilibrio (estimado)</span>
            <input
              type="text"
              inputMode="numeric"
              value={local.mesesPE ?? ""}
              onChange={(e) =>
                setLocal((p) => ({ ...p, mesesPE: e.target.value.replace(/[^\d]/g, "") }))
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
        </div>

        <p className="mt-4 text-xs text-slate-600">
          Nota: es una guía inicial basada en patrones del rubro. Si tienes datos reales, puedes escribir encima.
        </p>
        <p className="text-xs text-slate-600">
          Disclaimer: deberás corroborar los números con tu negocio particular.
        </p>
      </section>

      {err && <p className="text-sm text-red-600 mb-3">{err}</p>}

      <div className="mt-2 flex items-center justify-between">
        <PrevButton href="/wizard/step-3" />
        <NextButton onClick={onNext} />
      </div>
    </main>
  );
}
