// app/wizard/step-9/page.tsx
"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/state/wizard-store";
import { PrevButton, NextButton } from "@/components/wizard/WizardNav";
import UpsellBanner from "@/components/wizard/UpsellBanner";
import EconomicHeader from "@/components/wizard/EconomicHeader";
import BotIcon from "@/components/icons/BotIcon";

// === Utils (alineado con otros pasos) ===
const formatCLP = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })
    .format(Math.round(n || 0));
const ceil = (x: number) => (x > 0 ? Math.ceil(x) : 0);

function deriveCostoUnit(ticket: number, costoVarPct?: number, costoVarUnit?: number) {
  if (typeof costoVarUnit === "number" && costoVarUnit > 0) return Math.min(costoVarUnit, ticket);
  if (typeof costoVarPct === "number" && costoVarPct > 0) return Math.min((ticket * costoVarPct) / 100, ticket);
  return 0;
}
const calcMcUnit = (ticket: number, costoUnit: number) => Math.max(ticket - costoUnit, 0);

export default function Step9Page() {
  const router = useRouter();
  const { data } = useWizardStore();
  const s6 = (data?.step6 ?? {}) as any;

  // ===== Lectura desde store (Step-6/7) =====
  const ticket = Math.max(0, Number(s6.ticket ?? 0));
  const ventaAnual = Math.max(0, Number(s6.ventaAnual ?? s6.ventaAnio1 ?? 0));
  const marketingMensual = Math.max(0, Number(s6.marketingMensual ?? s6.presupuestoMarketing ?? 0));
  const gastosFijosMensuales = Math.max(0, Number(s6.gastosFijosMensuales ?? 0));
  const mesesPE = Math.max(1, Math.round(Number(s6.mesesPE ?? 6)));

  const costoUnit = deriveCostoUnit(ticket, Number(s6.costoVarPct ?? 0), Number(s6.costoVarUnit ?? 0));
  const mcUnit = calcMcUnit(ticket, costoUnit);

  // Clientes para Punto de Equilibrio (idéntico criterio Step-7)
  const clientesPE =
    mcUnit > 0 && gastosFijosMensuales > 0 ? Math.ceil(gastosFijosMensuales / mcUnit) : 0;

  // Clientes objetivo (mes) para tope de crecimiento si existe
  const clientesObjetivoMes =
    Number(s6.clientesMensuales ?? 0) > 0
      ? Math.round(Number(s6.clientesMensuales))
      : ticket > 0
      ? Math.round((ventaAnual / 12) / ticket)
      : 0;

  // Caja inicial editable; "caja mínima deseada" se calcula luego
  const [cajaInicial, setCajaInicial] = React.useState<number>(
    Math.round(Number(s6.inversionInicial ?? 0))
  );

  // ===== Proyección 12 meses: “peldaños iguales” =====
  type Row = {
    mes: number;
    factor: number;    // puede ser >1 cuando mesesPE < 12 (se mantiene la pendiente)
    clientes: number;
    ingresos: number;
    costoVar: number;
    mc: number;
    gastos: number;
    resultado: number;
    cajaAcum: number;
  };

  const rows: Row[] = [];
  let caja = Math.round(cajaInicial);
  let minCaja = caja;
  let minCajaMes = 0;

  for (let m = 1; m <= 12; m++) {
    // Peldaños iguales: 1/mesesPE, 2/mesesPE, ..., m/mesesPE
    // Si mesesPE < 12, la pendiente continúa después del P.E.
    const factor = mesesPE > 0 ? m / mesesPE : 1; // NO se limita a 1 para mantener pendiente
    const basePE = ceil(clientesPE * factor);

    // Tope opcional: si existe una meta de clientes, no superarla
    const clientes = clientesObjetivoMes > 0 ? Math.min(basePE, clientesObjetivoMes) : basePE;

    const ingresos = clientes * ticket;
    const costoVar = clientes * costoUnit;
    const mc = Math.max(0, ingresos - costoVar);
    const gastos = gastosFijosMensuales + marketingMensual;
    const resultado = mc - gastos;
    caja += resultado;

    if (caja < minCaja) {
      minCaja = caja;
      minCajaMes = m;
    }

    rows.push({ mes: m, factor, clientes, ingresos, costoVar, mc, gastos, resultado, cajaAcum: caja });
  }

  // Capital de trabajo = suma de déficits mensuales
  const capitalTrabajo = rows.filter(r => r.resultado < 0).reduce((acc, r) => acc + Math.abs(r.resultado), 0);

  // Caja mínima deseada (sugerida) = Caja inicial − Mínimo de caja observado (si negativa, 0)
  const cajaMinimaDeseada = Math.max(0, Math.round(cajaInicial - minCaja));

  const showWarning = ticket <= 0 || mcUnit <= 0;

  return (
    <main className="mx-auto max-w-4xl px-2 py-8">
      <EconomicHeader
        title="Paso 9 · Flujo de caja (12 meses)"
        subtitle={
          <>
            Proyectamos tu caja suponiendo que subes por <b>peldaños iguales</b> hasta
            alcanzar los <b>clientes para tu Punto de Equilibrio</b> y, si te quedan meses,
            sigues subiendo con la misma pendiente hasta el mes 12 o hasta tu meta de clientes
            (lo que ocurra primero).
            <details className="mt-2">
              <summary>¿Cómo calculamos tu proyección de flujo de caja?</summary>
              <ol className="mt-2 list-decimal pl-5 space-y-1 text-sm text-slate-700">
                <li><b>Clientes para P.E. (mensual)</b>: dividimos tus <em>gastos fijos</em> por el <em>margen por unidad</em> y redondeamos hacia arriba.</li>
                <li><b>Peldaños iguales</b>: si eliges {mesesPE} meses para llegar al P.E., el mes 1 atiendes aprox. <b>1/{mesesPE}</b> de ese número, el mes 2 <b>2/{mesesPE}</b>, el mes 3 <b>3/{mesesPE}</b>, y así sucesivamente.</li>
                <li>Si <b>mesesPE &lt; 12</b>, seguimos subiendo con la misma pendiente después de alcanzar el P.E. hasta el mes 12, salvo que antes llegues a tu <b>meta de clientes</b> (entonces nos detenemos ahí).</li>
                <li><b>Ingresos</b> = clientes × ticket. <b>Costos variables</b> = clientes × costo unitario. El <em>margen de contribución</em> es la diferencia.</li>
                <li>Restamos <b>gastos fijos + marketing</b> para obtener el resultado de cada mes y vamos sumando/ajustando la <b>caja</b>.</li>
                <li>La <b>caja mínima observada</b> es el peor saldo del año. Tu <b>caja mínima deseada</b> es el colchón para no bajar del saldo inicial.</li>
              </ol>
            </details>
          </>
        }
      />

      {showWarning && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <b>Revisa el Paso 6:</b> el ticket o el margen por unidad es 0. Ajusta precio/costo para calcular el flujo.
        </div>
      )}

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-white shadow-sm p-5">
          <h3 className="font-medium">Supuestos</h3>
          <ul className="mt-3 text-sm text-slate-700 space-y-1">
            <li>Ticket: <strong>{formatCLP(ticket)}</strong></li>
            <li>Costo variable unitario: <strong>{formatCLP(costoUnit)}</strong></li>
            <li>Margen por unidad: <strong>{formatCLP(mcUnit)}</strong></li>
            <li>Clientes para P.E. (mensual): <strong>{clientesPE}</strong></li>
            <li>Meses para llegar al P.E.: <strong>{mesesPE}</strong></li>
            <li>Clientes objetivo (tope): <strong>{clientesObjetivoMes || "—"}</strong></li>
            <li>Gastos fijos mensuales: <strong>{formatCLP(gastosFijosMensuales)}</strong></li>
            <li>Marketing mensual: <strong>{formatCLP(marketingMensual)}</strong></li>
          </ul>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <label className="text-sm">
              <span className="block mb-1 font-medium">Caja inicial (CLP)</span>
              <input
                type="number"
                className="w-full rounded-xl border px-3 py-2"
                value={cajaInicial}
                onChange={(e) => setCajaInicial(Number(e.target.value || 0))}
              />
            </label>
            <div className="text-sm rounded-xl border px-3 py-2 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="font-medium">Caja mínima deseada (sugerida)</span>
                <strong>{formatCLP(cajaMinimaDeseada)}</strong>
              </div>
              <div className="mt-1 text-[11px] text-slate-600">
                Fórmula: <em>Caja inicial − Mínimo de caja observado</em>. Es tu “colchón” para no caer bajo el saldo de inicio.
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm p-5">
          <h3 className="font-medium">Resultados clave</h3>
          <div className="mt-3 grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Capital de trabajo (déficits del año)</span>
              <strong>{formatCLP(capitalTrabajo)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Mínimo de caja observado {minCajaMes ? `(mes ${minCajaMes})` : ""}</span>
              <strong>{formatCLP(minCaja)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Caja mínima deseada (sugerida)</span>
              <strong>{formatCLP(cajaMinimaDeseada)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border bg-white shadow-sm p-5 overflow-x-auto">
        <h3 className="font-medium">Tabla de flujo de caja (12 meses)</h3>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-slate-600">
            <tr>
              <th className="py-2 pr-3">Mes</th>
              <th className="py-2 pr-3">Clientes</th>
              <th className="py-2 pr-3">Ingresos</th>
              <th className="py-2 pr-3">Costo variable</th>
              <th className="py-2 pr-3">Margen contrib.</th>
              <th className="py-2 pr-3">Gastos</th>
              <th className="py-2 pr-3">Resultado</th>
              <th className="py-2 pr-3">Caja acumulada</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.mes} className="border-t">
                <td className="py-2 pr-3">M{r.mes}</td>
                <td className="py-2 pr-3">{r.clientes}</td>
                <td className="py-2 pr-3">{formatCLP(r.ingresos)}</td>
                <td className="py-2 pr-3">{formatCLP(r.costoVar)}</td>
                <td className="py-2 pr-3">{formatCLP(r.mc)}</td>
                <td className="py-2 pr-3">{formatCLP(r.gastos)}</td>
                <td className="py-2 pr-3">{formatCLP(r.resultado)}</td>
                <td className="py-2 pr-3">{formatCLP(r.cajaAcum)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Navegación (mismo molde) */}
      <div className="mt-6 flex items-center justify-between">
        <PrevButton href="/wizard/step-8" />
        <NextButton onClick={() => router.push("/wizard/step-10")} />
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
