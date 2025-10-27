// app/wizard/step-9/page.tsx
"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/state/wizard-store";
import { PrevButton, NextButton } from "@/components/wizard/WizardNav";
import UpsellBanner from "@/components/wizard/UpsellBanner";
import EconomicHeader from "@/components/wizard/EconomicHeader";
import BotIcon from "@/components/icons/BotIcon";

/* ============== Utils ============== */
const formatCLP = (n: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));

const ceil = (x: number) => (x > 0 ? Math.ceil(x) : 0);

function deriveCostoUnit(ticket: number, costoVarPct?: number, costoVarUnit?: number) {
  if (typeof costoVarUnit === "number" && costoVarUnit > 0) return Math.min(costoVarUnit, ticket);
  if (typeof costoVarPct === "number" && costoVarPct > 0) return Math.min((ticket * costoVarPct) / 100, ticket);
  return 0;
}
const calcMcUnit = (ticket: number, costoUnit: number) => Math.max(ticket - costoUnit, 0);

/* ============== Page ============== */
export default function Step9Page() {
  const router = useRouter();
  const { data } = useWizardStore();
  const s6 = (data?.step6 ?? {}) as any;

  // ---- Base (Step-6/7) ----
  const ticket = Math.max(0, Number(s6.ticket ?? 0));
  const ventaAnual = Math.max(0, Number(s6.ventaAnual ?? s6.ventaAnio1 ?? 0));
  const marketingMensual = Math.max(0, Number(s6.marketingMensual ?? s6.presupuestoMarketing ?? 0));
  const gastosFijosMensuales = Math.max(0, Number(s6.gastosFijosMensuales ?? 0));
  const mesesPE = Math.max(1, Math.round(Number(s6.mesesPE ?? 6)));

  const costoUnit = deriveCostoUnit(ticket, Number(s6.costoVarPct ?? 0), Number(s6.costoVarUnit ?? 0));
  const mcUnit = calcMcUnit(ticket, costoUnit);

  const clientesPE = mcUnit > 0 && gastosFijosMensuales > 0 ? Math.ceil(gastosFijosMensuales / mcUnit) : 0;

  const clientesObjetivoMes =
    Number(s6.clientesMensuales ?? 0) > 0
      ? Math.round(Number(s6.clientesMensuales))
      : ticket > 0
      ? Math.round((ventaAnual / 12) / ticket)
      : 0;

  // Caja inicial editable (se hidrata del Step-6; el usuario puede ajustar aquí)
  const [cajaInicial, setCajaInicial] = React.useState<number>(Math.round(Number(s6.inversionInicial ?? 0)));

  // ---- Créditos (para habilitar CSV) ----
  const [credits, setCredits] = React.useState<number | null>(null);
  React.useEffect(() => {
    try {
      const raw =
        localStorage.getItem("arete:credits_left") ??
        localStorage.getItem("arete:credits") ??
        localStorage.getItem("arete:pro_credits");
      const n = raw ? Number(raw) : NaN;
      setCredits(Number.isFinite(n) ? n : 0);
    } catch {
      setCredits(0);
    }
  }, []);

  // ---- Proyección 12m (peldaños iguales) ----
  type Row = {
    mes: number;
    factor: number;
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
    const factor = mesesPE > 0 ? m / mesesPE : 1; // mantiene pendiente si mesesPE < 12
    const basePE = ceil(clientesPE * factor);
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

  // KPIs de flujo
  const capitalTrabajo = rows.filter(r => r.resultado < 0).reduce((acc, r) => acc + Math.abs(r.resultado), 0);
  const cajaMinimaDeseada = Math.max(0, Math.round(cajaInicial - minCaja));
  const restanteInversion = cajaInicial - capitalTrabajo;

  const breakevenMonth = (() => {
    const idx = rows.findIndex(r => r.clientes >= clientesPE && clientesPE > 0);
    return idx >= 0 ? rows[idx].mes : 0;
  })();

  const maxAbsResultado = Math.max(1, ...rows.map(r => Math.abs(r.resultado)));
  const showWarning = ticket <= 0 || mcUnit <= 0;

  // ---- Mes 0 (solo muestra la caja inicial en "Ingresos") ----
  const m0: Row = {
    mes: 0,
    factor: 0,
    clientes: 0,
    ingresos: Math.round(cajaInicial),
    costoVar: 0,
    mc: 0,
    gastos: 0,
    resultado: 0,
    cajaAcum: Math.round(cajaInicial),
  };
  const rowsWithM0 = [m0, ...rows];

  // Tabla: vista compacta = 6 meses (incluye M0)
  const [showAll, setShowAll] = React.useState(false);
  const displayRows = showAll ? rowsWithM0 : rowsWithM0.slice(0, 7); // M0..M6

  // Exportación CSV (solo si hay créditos > 0)
  function exportCSV() {
    if (!credits || credits <= 0) return;
    const header = ["Mes", "Clientes", "Ingresos", "Margen contrib.", "Gastos", "Resultado", "Caja acumulada"];
    const lines = rowsWithM0.map(r =>
      ["M" + r.mes, r.clientes, Math.round(r.ingresos), Math.round(r.mc), Math.round(r.gastos), Math.round(r.resultado), Math.round(r.cajaAcum)].join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flujo_caja_12m.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-4xl px-2 py-8">
      <EconomicHeader
        title="Paso 9 · Flujo de caja (12 meses)"
        subtitle={
          <>Proyectamos tu caja con <b>peldaños iguales</b> hasta tu <b>Punto de Equilibrio</b> y mantenemos la pendiente hasta 12 meses (o hasta tu meta de clientes).</>
        }
      />

      {/* Explicación técnica (fuera del <p> del header) */}
      <details className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
        <summary className="cursor-pointer font-medium text-slate-800">¿Cómo calculamos tu proyección de flujo de caja?</summary>
        <ol className="mt-2 list-decimal pl-5 space-y-1">
          <li><b>Clientes para P.E. (mensual)</b> = Gastos fijos ÷ Margen por unidad (redondeado hacia arriba).</li>
          <li><b>Peldaños iguales</b>: con {mesesPE} meses al P.E., avanzas 1/{mesesPE}, 2/{mesesPE}, 3/{mesesPE}…</li>
          <li>Si <b>mesesPE &lt; 12</b>, mantenemos la pendiente hasta el mes 12 (o hasta tu meta de clientes).</li>
          <li><b>Resultado</b> = Margen contribución − (Gastos fijos + Marketing). La <b>caja</b> se acumula mes a mes.</li>
        </ol>
      </details>

      {showWarning && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <b>Revisa el Paso 6:</b> el ticket o el margen por unidad es 0. Ajusta precio/costo para calcular el flujo.
        </div>
      )}

      {/* Tarjetas de hallazgos */}
      <section className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-emerald-50/70 text-emerald-900 p-3 text-sm">
          <div className="font-semibold">P.E. estimado</div>
          <div className="mt-1">Clientes/mes: <b>{clientesPE || "—"}</b></div>
          <div className="text-xs mt-0.5">Mes: <b>{breakevenMonth || "—"}</b></div>
        </div>
        <div className="rounded-xl border bg-sky-50/70 text-sky-900 p-3 text-sm">
          <div className="font-semibold">Capital de trabajo</div>
          <div className="mt-1"><b>{formatCLP(capitalTrabajo)}</b></div>
          <div className="text-xs mt-0.5">Suma de meses con pérdida</div>
        </div>
        <div className="rounded-xl border bg-amber-50/70 text-amber-900 p-3 text-sm">
          <div className="font-semibold">Caja mínima observada</div>
          <div className="mt-1"><b>{formatCLP(minCaja)}</b></div>
          <div className="text-xs mt-0.5">Colchón sugerido: <b>{formatCLP(cajaMinimaDeseada)}</b></div>
        </div>
      </section>

      {/* Supuestos + Ajustes + NUEVOS KPIs */}
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
                Fórmula: <em>Caja inicial − Mínimo de caja observada</em>.
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm p-5">
          <h3 className="font-medium">Resultados clave</h3>
          <div className="mt-3 grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Caja inicial (tu dinero disponible)</span>
              <strong>{formatCLP(cajaInicial)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Capital de trabajo (déficits del año)</span>
              <strong>{formatCLP(capitalTrabajo)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Disponible para inversión (caja inicial − capital de trabajo)</span>
              <strong className={restanteInversion < 0 ? "text-rose-700" : ""}>
                {formatCLP(restanteInversion)}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Mínimo de caja observado {minCajaMes ? `(mes ${minCajaMes})` : ""}</span>
              <strong>{formatCLP(minCaja)}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Tabla — con M0 y barra en Resultado (sin “Costo variable”) */}
      <section className="mt-6 rounded-2xl border bg-white shadow-sm p-5 overflow-x-auto">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium">Tabla de flujo de caja (12 meses)</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAll(s => !s)}
              className="rounded-lg border px-2.5 py-1.5 text-xs hover:bg-slate-50"
            >
              {showAll ? "Ver 6 meses" : "Ver 12 meses"}
            </button>
            <button
              onClick={exportCSV}
              disabled={credits === null || credits <= 0}
              title={credits === null ? "Cargando créditos…" : credits! <= 0 ? "Requiere créditos activos" : "Exportar CSV"}
              className={`rounded-lg border px-2.5 py-1.5 text-xs ${credits && credits > 0 ? "hover:bg-slate-50" : "opacity-50 cursor-not-allowed"}`}
            >
              Descargar CSV
            </button>
          </div>
        </div>

        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-slate-600">
            <tr>
              <th className="py-2 pr-3">Mes</th>
              <th className="py-2 pr-3">Clientes</th>
              <th className="py-2 pr-3">Ingresos</th>
              <th className="py-2 pr-3">Margen contrib.</th>
              <th className="py-2 pr-3">Gastos</th>
              <th className="py-2 pr-3">Resultado</th>
              <th className="py-2 pr-3">Caja acumulada</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((r) => {
              const isBE = r.mes !== 0 && breakevenMonth === r.mes && breakevenMonth > 0;
              const barBase = Math.max(1, maxAbsResultado); // evita NaN/0
              const barPct = r.mes === 0 ? 0 : Math.min(100, Math.round((Math.abs(r.resultado) / barBase) * 100));
              const positive = r.resultado >= 0;

              return (
                <tr key={r.mes} className={`border-t ${isBE ? "bg-emerald-50/60" : ""}`}>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <span>M{r.mes}</span>
                      {isBE && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[11px]">
                          ★ P.E.
                        </span>
                      )}
                      {r.mes === 0 && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-[11px]">
                          Caja inicial
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-3">{r.clientes}</td>
                  <td className="py-2 pr-3">{formatCLP(r.ingresos)}</td>
                  <td className="py-2 pr-3">{formatCLP(r.mc)}</td>
                  <td className="py-2 pr-3">{formatCLP(r.gastos)}</td>
                  <td className="py-2 pr-3">
                    {r.mes === 0 ? (
                      <span className="text-slate-500">—</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${positive ? "text-emerald-700" : "text-rose-700"}`}>
                          {formatCLP(r.resultado)}
                        </span>
                        <div className="h-2 w-24 rounded bg-slate-200">
                          <div
                            className={`h-2 rounded ${positive ? "bg-emerald-400" : "bg-rose-400"}`}
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                        <span className="text-xs" aria-hidden>{positive ? "🟢" : "🔴"}</span>
                      </div>
                    )}
                  </td>
                  <td className={`py-2 pr-3 ${r.cajaAcum < 0 ? "text-rose-700 font-medium" : ""}`}>
                    {formatCLP(r.cajaAcum)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p className="mt-3 text-xs text-slate-500">
          Inicial,  luego cada negocio tendra estacionalidad. En móvil puedes desplazar la tabla <b>horizontalmente</b> para ver todas las columnas.
        </p>
      </section>

      {/* Navegación */}
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
