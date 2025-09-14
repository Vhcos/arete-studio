"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { Step6Schema } from "@/lib/validation/wizard-extra";
import { toLegacyForm } from "@/lib/bridge/wizard-to-legacy";
import { PrevButton, NextButton } from "@/components/wizard/WizardNav";

/* ===== Helpers CLP y num ===== */
const digits = (s: string) => s.replace(/[^\d,]/g, ""); // permitimos coma decimal
function formatCLPInput(v: string | number | undefined | null): string {
  if (v === null || v === undefined) return "";
  let s = String(v).trim();
  if (!s) return "";
  s = digits(s); // solo dígitos y coma
  const [intRaw, fracRaw] = s.split(",");
  const intClean = (intRaw || "").replace(/[^\d]/g, "");
  if (!intClean) return "";
  const intFmt = Number(intClean).toLocaleString("es-CL");
  return fracRaw ? `${intFmt},${fracRaw.replace(/[^\d]/g, "")}` : intFmt;
}
function parseCLP(v: string | number | undefined | null): number {
  if (v === null || v === undefined) return 0;
  const s = String(v).replace(/\./g, "").replace(/\s+/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : 0;
}
function num(v: any): number {
  if (typeof v === "string") return parseCLP(v);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/* ===== Estado local ===== */
type Local = {
  // $ CLP (formateados en el input)
  inversionInicial?: string;
  capitalTrabajo?: string;

  // Ventas (dual)
  ventaAnio1?: string;   // anual
  ventaMensual?: string; // mensual

  ticket?: string;
  gastosFijosMensuales?: string;
  costoVarUnit?: string;
  presupuestoMarketing?: string;

  // num “puros”
  conversionPct?: number | string;
  // 👇 Quitados: costoVarPct, traficoMensual, clientesMensuales (se calculan en Form)
  frecuenciaCompraMeses?: number | string;
  mesesPE?: number | string;
};

export default function Step6Page() {
  const router = useRouter();
  const { data, setStep6 } = useWizardStore();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Prefill coherente: si hay anual -> mensual = anual/12
  const anualInicial = data.step6?.ventaAnio1 ?? 0;
  const mensualInicial = Math.round((anualInicial || 0) / 12);

  const [local, setLocal] = useState<Local>({
    inversionInicial: formatCLPInput(data.step6?.inversionInicial ?? 0),
    capitalTrabajo: formatCLPInput(data.step6?.capitalTrabajo ?? 0),

    ventaAnio1: formatCLPInput(anualInicial),
    ventaMensual: formatCLPInput(mensualInicial),

    ticket: formatCLPInput(data.step6?.ticket ?? 0),
    conversionPct: data.step6?.conversionPct ?? 0,
    gastosFijosMensuales: formatCLPInput(data.step6?.gastosFijosMensuales ?? 0),
    costoVarUnit: formatCLPInput(data.step6?.costoVarUnit ?? 0),
    presupuestoMarketing: formatCLPInput(data.step6?.presupuestoMarketing ?? 0),

    frecuenciaCompraMeses: data.step6?.frecuenciaCompraMeses ?? 6,
    mesesPE: data.step6?.mesesPE ?? 6,
  });

  /* ===== Derivados para el mini resumen ===== */
  const derived = useMemo(() => {
    // Si hay mensual explícito, úsalo; si no, deriva desde anual
    const ventaMensual =
      num(local.ventaMensual) > 0
        ? num(local.ventaMensual)
        : Math.round(num(local.ventaAnio1) / 12);

    // Asegura anual coherente para cálculos que dependen de anual
    const ventaAnual =
      num(local.ventaAnio1) > 0
        ? num(local.ventaAnio1)
        : Math.round(ventaMensual * 12);

    const clientesAnuales =
      num(local.ticket) > 0 ? Math.round(ventaAnual / num(local.ticket)) : 0;

    const clientesMensualesCalc = Math.round(clientesAnuales / 12);

    const costoVarUnitario = num(local.costoVarUnit); // usamos unitario, no %.
    const margenUnit = Math.max(0, num(local.ticket) - costoVarUnitario);
    const gastosFijosAnio = Math.round(num(local.gastosFijosMensuales) * 12);

    return {
      ventaMensual,
      clientesAnuales,
      clientesMensualesCalc,
      costoVarUnitario,
      margenUnit,
      gastosFijosAnio,
    };
  }, [local]);

  /* ===== Inputs reutilizables ===== */
  function FieldMoney<K extends keyof Local>(
    key: K,
    label: string,
    placeholder?: string,
    help?: string
  ) {
    return (
      <label className="block">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <input
          type="text"
          inputMode="numeric"
          value={local[key] ?? ""}
          onChange={(e) =>
            setLocal((p) => ({ ...p, [key]: formatCLPInput(e.target.value) }))
          }
          placeholder={placeholder}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
        {help ? <p className="mt-1 text-xs text-slate-500">{help}</p> : null}
      </label>
    );
  }

  function FieldInt<K extends keyof Local>(
    key: K,
    label: string,
    placeholder?: string,
    help?: string
  ) {
    return (
      <label className="block">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <input
          type="text"
          inputMode="numeric"
          value={local[key] ?? ""}
          onChange={(e) => {
            const d = e.target.value.replace(/[^\d]/g, "");
            setLocal((p) => ({ ...p, [key]: d }));
          }}
          placeholder={placeholder}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
        {help ? <p className="mt-1 text-xs text-slate-500">{help}</p> : null}
      </label>
    );
  }

  /* ===== Dual binding para Ventas ===== */
  function onChangeVentaAnual(v: string) {
    const anualFmt = formatCLPInput(v);
    const anualNum = parseCLP(anualFmt);
    const mensualNum = anualNum > 0 ? Math.round(anualNum / 12) : 0;
    setLocal((p) => ({
      ...p,
      ventaAnio1: anualFmt,
      ventaMensual: mensualNum ? formatCLPInput(mensualNum) : "",
    }));
  }
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

  /* ===== Guardar y avanzar a Step-5 ===== */
  async function onNext() {
    if (busy) return;
    try {
      setBusy(true);
      setErr(null);

      const conv = Math.max(0, Math.min(100, num(local.conversionPct)));

      // Resuelve anual desde cualquiera de los dos
      const ventaAnualNum =
        num(local.ventaAnio1) > 0
          ? num(local.ventaAnio1)
          : Math.round(num(local.ventaMensual) * 12);

      // Campos que se calculan en el Form: costoVarPct, traficoMensual, clientesMensuales
      const s6 = {
        inversionInicial: parseCLP(local.inversionInicial),
        capitalTrabajo: parseCLP(local.capitalTrabajo),
        ventaAnio1: ventaAnualNum,
        ticket: parseCLP(local.ticket),
        conversionPct: conv,
        gastosFijosMensuales: parseCLP(local.gastosFijosMensuales),
        costoVarPct: 0, // mantenemos contrato del schema sin pedir el % aquí
        costoVarUnit: parseCLP(local.costoVarUnit),
        traficoMensual: 0,
        clientesMensuales: 0,
        modoInversion: "presupuesto" as const,
        presupuestoMarketing: parseCLP(local.presupuestoMarketing),
        cpl: 0,
        cac: 0,
        frecuenciaCompraMeses: num(local.frecuenciaCompraMeses),
        mesesPE: num(local.mesesPE),
      };

      const parsed = Step6Schema.safeParse(s6);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        throw new Error(first?.message || "Revisa los campos del Paso 6");
      }

      setStep6(s6 as any);

      const legacy = toLegacyForm({ ...data, step6: s6 } as any);
      localStorage.setItem("arete:legacyForm", JSON.stringify(legacy));

      // preview IA (no bloquea). costoUnit desde unitario si existe; si no, 0.
      const costoUnit =
        s6.costoVarUnit || Math.round((s6.ticket * (s6.costoVarPct || 0)) / 100);

      fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectName: data.step1?.projectName || "Proyecto",
          sectorId: data.step2?.sectorId || "tech_saas",
          input: {
            ticket: s6.ticket,
            costoUnit,
            ingresosMeta: s6.ventaAnio1,
            gastosFijos: s6.gastosFijosMensuales,
            marketingMensual: s6.presupuestoMarketing,
            costoPct: s6.costoVarPct,
          },
        }),
      })
        .then((r) => r.json())
        .then((j) => localStorage.setItem("arete:planPreview", JSON.stringify(j)))
        .catch(() => {});

      router.push("/wizard/step-5");
    } catch (e: any) {
      setErr(e?.message ?? "Error al finalizar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-lg font-semibold tracking-tight">Paso 6 · Económico</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-8">
        {FieldMoney("inversionInicial", "Inversión inicial ($)", "", "Gastos antes de abrir tu negocio a los clientes.")}
        {FieldMoney("capitalTrabajo", "Capital de trabajo disponible ($)", "", "Capital disponible hasta el punto de equilibrio.")}
      </div>

      {/* Ventas dual: anual y mensual */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Venta primer año (12 meses) – $</span>
          <input
            type="text"
            inputMode="numeric"
            value={local.ventaAnio1 ?? ""}
            onChange={(e) => onChangeVentaAnual(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Venta mensual – $</span>
          <input
            type="text"
            inputMode="numeric"
            value={local.ventaMensual ?? ""}
            onChange={(e) => onChangeVentaMensual(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
        </label>

        {FieldMoney("ticket", "Ticket / tarifa promedio por cliente – $")}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
        {FieldInt("conversionPct", "Anota % de conversión (0–100)", "Ej. 3", "Porcentaje de visitas/leads que se convierten en clientes.")}
        {FieldMoney("gastosFijosMensuales", "Gastos fijos mensuales ($)")}
        {FieldMoney("costoVarUnit", "Costo variable unitario ($)")}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
        {FieldMoney("presupuestoMarketing", "Presupuesto de marketing mensual ($)")}
        {FieldInt("frecuenciaCompraMeses", "Frecuencia de compra (meses)")}
        {FieldInt("mesesPE", "Meses para punto de equilibrio (estimado)")}
      </div>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Resumen (calculado)</h2>
        <ul className="text-sm text-slate-700 grid md:grid-cols-3 gap-y-2 gap-x-6">
          <li><span className="text-slate-500">Venta mensual:</span> <strong>${derived.ventaMensual.toLocaleString("es-CL")}</strong></li>
          <li><span className="text-slate-500">Clientes anuales:</span> <strong>{derived.clientesAnuales.toLocaleString("es-CL")}</strong></li>
          <li><span className="text-slate-500">Clientes mensuales (calc):</span> <strong>{derived.clientesMensualesCalc.toLocaleString("es-CL")}</strong></li>
          <li><span className="text-slate-500">Costo variable unitario:</span> <strong>${derived.costoVarUnitario.toLocaleString("es-CL")}</strong></li>
          <li><span className="text-slate-500">Margen unitario:</span> <strong>${derived.margenUnit.toLocaleString("es-CL")}</strong></li>
          <li><span className="text-slate-500">Gastos fijos año:</span> <strong>${derived.gastosFijosAnio.toLocaleString("es-CL")}</strong></li>
        </ul>
      </section>

      {err && <p className="mt-3 text-xs text-red-600">{err}</p>}

      <div className="mt-6 flex items-center justify-between">
        <PrevButton href="/wizard/step-3" />
        <NextButton onClick={onNext} />
      </div>
    </main>
  );
}
