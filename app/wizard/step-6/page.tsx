// app/wizard/step-6/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { Step6Schema } from "@/lib/validation/wizard-extra";
import { toLegacyForm } from "@/lib/bridge/wizard-to-legacy";

// helper numérico seguro (undefined/"" -> 0)
function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

type Local = {
  inversionInicial?: number;
  capitalTrabajo?: number;
  ventaAnio1?: number;
  ticket?: number;
  conversionPct?: number;
  clientesMensuales?: number; // override manual
  gastosFijosMensuales?: number;
  costoVarPct?: number;
  costoVarUnit?: number;
  traficoMensual?: number;
  modoInversion?: "presupuesto" | "cac";
  presupuestoMarketing?: number;
  cpl?: number;
  cac?: number;
  frecuenciaCompraMeses?: number;
  mesesPE?: number;
};

export default function Step6Page() {
  const router = useRouter();
  const { data, setStep6 } = useWizardStore();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // estado local (prellenado desde el store si existe)
  const [local, setLocal] = useState<Local>({
    inversionInicial: data.step6?.inversionInicial ?? 0,
    capitalTrabajo: data.step6?.capitalTrabajo ?? 0,
    ventaAnio1: data.step6?.ventaAnio1 ?? 0,
    ticket: data.step6?.ticket ?? 0,
    conversionPct: data.step6?.conversionPct ?? 0,
    clientesMensuales: data.step6?.clientesMensuales ?? 0,
    gastosFijosMensuales: data.step6?.gastosFijosMensuales ?? 0,
    costoVarPct: data.step6?.costoVarPct ?? 0,
    costoVarUnit: data.step6?.costoVarUnit ?? 0,
    traficoMensual: data.step6?.traficoMensual ?? 0,
    modoInversion:
      (data.step6?.modoInversion as Local["modoInversion"]) ?? "presupuesto",
    presupuestoMarketing: data.step6?.presupuestoMarketing ?? 0,
    cpl: data.step6?.cpl ?? 0,
    cac: data.step6?.cac ?? 0,
    frecuenciaCompraMeses: data.step6?.frecuenciaCompraMeses ?? 6,
    mesesPE: data.step6?.mesesPE ?? 6,
  });

  // derivados para el mini resumen
  const derived = useMemo(() => {
    const ventaMensual = Math.round(num(local.ventaAnio1) / 12);
    const clientesAnuales =
      num(local.ticket) > 0 ? Math.round(num(local.ventaAnio1) / num(local.ticket)) : 0;
    const clientesMensualesCalc =
      num(local.clientesMensuales) > 0
        ? num(local.clientesMensuales)
        : Math.round(clientesAnuales / 12);
    const costoVarUnitario =
      num(local.costoVarUnit) > 0
        ? num(local.costoVarUnit)
        : Math.round((num(local.ticket) * num(local.costoVarPct)) / 100);
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

  // input numérico reutilizable
  function FieldNumber<K extends keyof Local>(
    key: K,
    label: string,
    placeholder?: string,
    help?: string
  ) {
    return (
      <label className="block">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <input
          type="number"
          inputMode="decimal"
          value={local[key] ?? ""}
          onChange={(e) =>
            setLocal((p) => ({
              ...p,
              [key]:
                e.target.value === "" ? undefined : Number(e.target.value),
            }))
          }
          placeholder={placeholder}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
        {help ? <p className="mt-1 text-xs text-slate-500">{help}</p> : null}
      </label>
    );
  }

  const onFinish = async () => {
    try {
      setBusy(true);
      setErr(null);

      // Normaliza + clamp de conversión 0–100
      const conv = Math.max(0, Math.min(100, num(local.conversionPct)));

      // payload paso 6 validable con Zod
      const s6 = {
        inversionInicial: num(local.inversionInicial),
        capitalTrabajo: num(local.capitalTrabajo),
        ventaAnio1: num(local.ventaAnio1),
        ticket: num(local.ticket),
        conversionPct: conv,
        clientesMensuales: num(local.clientesMensuales), // override
        gastosFijosMensuales: num(local.gastosFijosMensuales),
        costoVarPct: num(local.costoVarPct),
        costoVarUnit: num(local.costoVarUnit),
        traficoMensual: num(local.traficoMensual),
        modoInversion: (local.modoInversion ?? "presupuesto") as
          | "presupuesto"
          | "cac",
        presupuestoMarketing: num(local.presupuestoMarketing),
        cpl: num(local.cpl),
        cac: num(local.cac),
        frecuenciaCompraMeses: num(local.frecuenciaCompraMeses),
        mesesPE: num(local.mesesPE),
      };

      // Valida contra tu esquema
      const parsed = Step6Schema.safeParse(s6);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        throw new Error(first?.message || "Revisa los campos del Paso 6");
      }

      // 1) Guarda en el store del wizard
      setStep6(s6 as any);

      // 2) Bridge -> formato legacy (Formulario/Tablero/Informe) y guarda en localStorage
      const legacy = toLegacyForm({ ...data, step6: s6 } as any);
      localStorage.setItem("arete:legacyForm", JSON.stringify(legacy));

      // 3) Preview IA (no bloquea flujo)
      fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectName: data.step1?.projectName || "Proyecto",
          sectorId: data.step2?.sectorId || "tech_saas",
          input: {
            ticket: s6.ticket,
            costoUnit:
              s6.costoVarUnit || Math.round((s6.ticket * s6.costoVarPct) / 100),
            ingresosMeta: s6.ventaAnio1,
            gastosFijos: s6.gastosFijosMensuales,
            marketingMensual: s6.presupuestoMarketing,
            costoPct: s6.costoVarPct,
          },
        }),
      })
        .then((r) => r.json())
        .then((j) =>
          localStorage.setItem("arete:planPreview", JSON.stringify(j))
        )
        .catch(() => {});

      // 4) Volver al Home para que el Formulario/Tablero se hidraten
      router.push("/?from=wizard=1");
    } catch (e: any) {
      setErr(e?.message ?? "Error al finalizar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-lg font-semibold tracking-tight">
        Paso 6 · Económico
      </h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-8">
        {FieldNumber(
          "inversionInicial",
          "Inversión inicial ($)",
          "",
          "Gastos antes de abrir tu negocio a los clientes."
        )}
        {FieldNumber(
          "capitalTrabajo",
          "Capital de trabajo disponible ($)",
          "",
          "Capital disponible hasta el punto de equilibrio."
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
        {FieldNumber("ventaAnio1", "Venta primer año (12 meses) – $")}
        {FieldNumber("ticket", "Ticket / tarifa promedio por cliente – $")}
        {FieldNumber(
          "conversionPct",
          "Anota % de conversión (0–100)",
          "Ej. 3",
          "Porcentaje de visitas/leads que se convierten en clientes."
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
        {FieldNumber("gastosFijosMensuales", "Gastos fijos mensuales ($)")}
        {FieldNumber(
          "costoVarPct",
          "Costo variable (% del precio)",
          "",
          "Si no conoces costo unitario exacto, ingresa % del precio."
        )}
        {FieldNumber("costoVarUnit", "Costo variable unitario ($)")}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
        {FieldNumber("traficoMensual", "Tráfico mensual (visitas / leads)")}
        {FieldNumber(
          "clientesMensuales",
          "Clientes mensuales (override)",
          "",
          "Si lo dejas vacío, se calcula automáticamente."
        )}
        {FieldNumber(
          "presupuestoMarketing",
          "Presupuesto de marketing mensual ($)"
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-10">
        {FieldNumber(
          "frecuenciaCompraMeses",
          "Frecuencia de compra (meses)",
          "",
          "Cada cuántos meses recompra un cliente."
        )}
        {FieldNumber(
          "mesesPE",
          "Meses para punto de equilibrio (estimado)",
          "",
          "Se usará para gráficos en el Tablero."
        )}
      </div>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Resumen (calculado)
        </h2>
        <ul className="text-sm text-slate-700 grid md:grid-cols-3 gap-y-2 gap-x-6">
          <li>
            <span className="text-slate-500">Venta mensual:</span>{" "}
            <strong>${derived.ventaMensual.toLocaleString("es-CL")}</strong>
          </li>
          <li>
            <span className="text-slate-500">Clientes anuales:</span>{" "}
            <strong>{derived.clientesAnuales.toLocaleString("es-CL")}</strong>
          </li>
          <li>
            <span className="text-slate-500">Clientes mensuales (calc):</span>{" "}
            <strong>
              {derived.clientesMensualesCalc.toLocaleString("es-CL")}
            </strong>
          </li>
          <li>
            <span className="text-slate-500">Costo variable unitario:</span>{" "}
            <strong>${derived.costoVarUnitario.toLocaleString("es-CL")}</strong>
          </li>
          <li>
            <span className="text-slate-500">Margen unitario:</span>{" "}
            <strong>${derived.margenUnit.toLocaleString("es-CL")}</strong>
          </li>
          <li>
            <span className="text-slate-500">Gastos fijos año:</span>{" "}
            <strong>${derived.gastosFijosAnio.toLocaleString("es-CL")}</strong>
          </li>
        </ul>
      </section>

      {err && <p className="mt-3 text-xs text-red-600">{err}</p>}

      <div className="mt-6 flex justify-end">
        <button
          onClick={onFinish}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-50"
        >
          {busy ? "Guardando…" : "Guardar y continuar"}
        </button>
      </div>
    </main>
  );
}
