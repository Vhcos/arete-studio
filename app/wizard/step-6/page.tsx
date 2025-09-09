"use client";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { Step6Schema } from "@/lib/validation/wizard-extra";

// Cambia esto si tu tablero real está en otra ruta:
const NEXT_AFTER_STEP6 = "/"; // TODO: /tablero ó /informe

function num(v: any) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

export default function Step6Page() {
  const router = useRouter();
  const { data, setStep6 } = useWizardStore();

  const [local, setLocal] = useState({
    inversionInicial: data.step6?.inversionInicial ?? 0,
    capitalTrabajo: data.step6?.capitalTrabajo ?? 0,

    ventaAnio1: data.step6?.ventaAnio1 ?? 0,
    ticket: data.step6?.ticket ?? 0,
    conversionPct: data.step6?.conversionPct ?? 3, // % típico ecommerce 1–5

    gastosFijosMensuales: data.step6?.gastosFijosMensuales ?? 0,
    costoVarPct: data.step6?.costoVarPct ?? 0,
    costoVarUnit: data.step6?.costoVarUnit ?? 0,

    traficoMensual: data.step6?.traficoMensual ?? 0,
    ltv: data.step6?.ltv ?? 0,

    modoInversion: data.step6?.modoInversion ?? "presupuesto",
    presupuestoMarketing: data.step6?.presupuestoMarketing ?? 0,
    cpl: data.step6?.cpl ?? 0,
    cac: data.step6?.cac ?? 0,

    frecuenciaCompraMeses: data.step6?.frecuenciaCompraMeses ?? 6,
    mesesPE: data.step6?.mesesPE ?? 6,
  });

  // ===== Derivados para mostrar (read-only) =====
  const derived = useMemo(() => {
    const ventaMensual = num(local.ventaAnio1) / 12;

    const clientesAnuales = local.ticket > 0 ? Math.round(num(local.ventaAnio1) / num(local.ticket)) : 0;
    const clientesMensualesCalc = Math.round(clientesAnuales / 12);

    // costo variable unitario: si hay unitario úsalo; si no, aplica % del ticket
    const costoVarUnitario = local.costoVarUnit && local.costoVarUnit > 0
      ? num(local.costoVarUnit)
      : (num(local.ticket) * num(local.costoVarPct) / 100);

    const margenUnit = Math.max(0, num(local.ticket) - costoVarUnitario);
    const gastosFijosAnio = num(local.gastosFijosMensuales) * 12;

    return {
      ventaMensual,
      clientesAnuales,
      clientesMensualesCalc,
      costoVarUnitario,
      margenUnit,
      gastosFijosAnio,
    };
  }, [local]);

  const [err, setErr] = useState<string | null>(null);

  function onChange<K extends keyof typeof local>(k: K, v: any) {
    setLocal((s) => ({ ...s, [k]: typeof v === "number" ? v : Number(v) }));
  }

  function Field(
    name: keyof typeof local,
    label: string,
    hint?: string,
    extra?: React.ReactNode
  ) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium">{label}</label>
        <input
          type="number"
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={Number(local[name] ?? 0)}
          onChange={(e) => onChange(name, e.target.value)}
        />
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
        {extra}
      </div>
    );
  }

  function Read(label: string, value: number, hint?: string) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium">{label}</label>
        <div className="mt-1 w-full rounded-lg border bg-slate-50 px-3 py-2 text-slate-700">
          ${Intl.NumberFormat().format(Math.round(value))}
        </div>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }

  function onNext() {
    const parsed = Step6Schema.safeParse(local);
    if (!parsed.success) {
      setErr("Revisa los valores económicos.");
      return;
    }
    setStep6(parsed.data);
    router.push(NEXT_AFTER_STEP6);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Paso 6 · Económico</h1>
      <p className="text-sm text-slate-600 mb-6">Completa tus supuestos. Calculamos algunos datos automáticamente.</p>

      {/* Bloque 1: inversión y capital */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {Field("inversionInicial","Inversión inicial ($)","Gastos antes de abrir / setup.")}
        {Field("capitalTrabajo","Capital de trabajo disponible ($)","Capital para operar los primeros meses.")}
      </div>

      {/* Bloque 2: ventas, ticket, conversión */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Field("ventaAnio1","Venta primer año (12 meses) — $")}
        {Field("ticket","Ticket / tarifa promedio por cliente — $")}
        {Field("conversionPct","Anota % de conversión de visitas → clientes (%)","Ej: 1–4% e-commerce, 3–10% tienda, 10–30% servicios.")}
      </div>

      {/* Derivados: venta mensual, clientes anuales/mensuales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Read("Venta mensual (calculado)", derived.ventaMensual)}
        {Read("Clientes anuales (calculado)", derived.clientesAnuales)}
        <div>
          <label className="block text-sm font-medium">Clientes mensuales (calculado)</label>
          <div className="mt-1 w-full rounded-lg border bg-slate-50 px-3 py-2 text-slate-700">
            {Intl.NumberFormat().format(derived.clientesMensualesCalc)}
          </div>
          <p className="mt-1 text-xs text-slate-500">Puedes ajustar manualmente usando la conversión y el tráfico.</p>
        </div>
      </div>

      {/* Bloque 3: costos variables y fijos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Field("gastosFijosMensuales","Gastos fijos mensuales ($)")}
        {Field("costoVarPct","Costo variable (% del precio, opcional)","Si no conoces costo unitario exacto, ingresa un % y calculamos.")}
        {Field("costoVarUnit","Costo variable unitario ($)")}
      </div>

      {/* Derivados: margen unitario y GF anuales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {Read("Margen de contribución unitario (calculado)", derived.margenUnit, "Se calcula como Ticket − Costo Variable.")}
        {Read("Gastos fijos año (12 meses)", derived.gastosFijosAnio)}
      </div>

      {/* Bloque 4: tráfico y unit economics */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        {Field("traficoMensual","Tráfico mensual (visitas / leads)","Recuerda llenar conversión.")}
        {Field("ltv","LTV (aprox)","Opcional, para unit economics.")}
        <div className="rounded-lg border p-3">
          <p className="text-sm font-medium mb-2">Modo de inversión (elige uno):</p>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={local.modoInversion === "presupuesto"}
                onChange={() => onChange("modoInversion","presupuesto")}
              />
              <span className="text-sm">1) Tengo presupuesto mensual de marketing</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={local.modoInversion === "cac"}
                onChange={() => onChange("modoInversion","cac")}
              />
              <span className="text-sm">2) Conozco mi CAC (costo por cliente)</span>
            </label>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            {Field("presupuestoMarketing","Presupuesto estimado mensual ($)")}
            {Field("cpl","CPL (costo por visita/lead)")}
            {Field("cac","CAC (costo adquisición por cliente)")}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            CPL/CAC ayudan a proyectar la captación y eficiencia. Si no los conoces, puedes dejarlos en 0.
          </p>
        </div>
      </div>

      {/* Bloque 5: frecuencia y punto de equilibrio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {Field("frecuenciaCompraMeses","Frecuencia de compra (meses)","Cada cuántos meses recompra un cliente.")}
        {Field("mesesPE","Meses para punto de equilibrio (estimado)","Se usará para gráficos en el Tablero.")}
      </div>

      {err && <p className="mt-3 text-xs text-red-600">{err}</p>}

      <div className="mt-6 flex items-center gap-3">
        <button onClick={() => router.push("/wizard/step-5")} className="rounded-lg border px-4 py-2">Atrás</button>
        <button onClick={onNext} className="rounded-lg bg-blue-600 text-white px-4 py-2">Guardar y continuar</button>
      </div>
    </div>
  );
}
