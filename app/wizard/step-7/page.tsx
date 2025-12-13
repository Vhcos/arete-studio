"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/state/wizard-store";
import { PrevButton, NextButton } from "@/components/wizard/WizardNav";
import UpsellBanner from "@/components/wizard/UpsellBanner";
import EconomicHeader from "@/components/wizard/EconomicHeader";
import BotIcon from "@/components/icons/BotIcon";
import { patchLegacyFromWizard } from "@/lib/bridge/patch-legacy-from-wizard";
import { calcBreakEven } from "@/lib/economics/break-even";

/* =============== Helpers números/CLP (idénticos a Step-6) =============== */
const onlyDigitsComma = (s: string) => s.replace(/[^\d,]/g, "");
const fmtCL = (n: number) => n.toLocaleString("es-CL");
const fmtNum = (n: number) =>
  new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  );

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

/* Capital de trabajo con subida por "peldaños iguales" (incluye marketing)
   - Parte desde Clientes para P.E. (punto de equilibrio)
   - Incrementa m/mesesPE (sin clamp), igual que Step-9
   - Opcional: tope en clientes objetivo (si existe)
*/
function capitalTrabajoDesdePE(opts: {
  gastosMensuales: number; // gastos fijos + marketing
  mcUnit: number;
  clientesPE: number;
  mesesPE: number; // 3/6/9/12
  clientesObjetivoMes?: number;
}) {
  const { gastosMensuales, mcUnit, clientesPE, mesesPE, clientesObjetivoMes } =
    opts;

  let total = 0;

  for (let m = 1; m <= 12; m++) {
    const factor = mesesPE > 0 ? m / mesesPE : 1;
    const basePE = Math.max(0, Math.ceil(clientesPE * factor));
    const clientes =
      clientesObjetivoMes && clientesObjetivoMes > 0
        ? Math.min(basePE, Math.round(clientesObjetivoMes))
        : basePE;

    const mcTotal = clientes * Math.max(0, mcUnit);
    const resultado = mcTotal - Math.max(0, gastosMensuales);

    if (resultado < 0) total += -resultado;
  }

  return Math.round(total);
}

const CONVERSION_PCT_FIJA = 10; // ✅ fijo, sin selector

export default function Step7Page() {
  const router = useRouter();
  const { data, setStep6 } = useWizardStore();
  const s6 = (data.step6 ?? {}) as { mesesPE?: number; [key: string]: any };

  // Estado editable
  const [mesesPE, setMesesPE] = useState<number>(Number(s6.mesesPE ?? 6));
  const [marketingMensual, setMarketingMensual] = useState<string>(
    s6.presupuestoMarketing ? formatCLPInput(String(s6.presupuestoMarketing)) : ""
  );

  const [showDebug, setShowDebug] = useState(false);

  // Derivadas básicas
  const ticket = Number(s6.ticket ?? 0);

  const ventaAnual = Number(
    (s6 as any).ventaAnual ?? (s6 as any).ventaAnio1 ?? 0
  );
  const ventaMensual = ventaAnual > 0 ? ventaAnual / 12 : 0;

  // “Clientes objetivo (mes)” -> idealmente entero (lo que se muestra al usuario)
  const clientesObjetivoMes = (() => {
    const fromS6 = Number((s6 as any).clientesMensuales ?? 0);
    if (Number.isFinite(fromS6) && fromS6 > 0) return Math.round(fromS6);

    if (ticket > 0 && ventaMensual > 0) return Math.round(ventaMensual / ticket);
    return 0;
  })();

  const gastosFijosMensuales = Math.max(0, Number(s6.gastosFijosMensuales ?? 0));

  // Marketing efectivo: si el usuario escribió algo aquí, manda eso; si no, cae a lo guardado
  const marketingGuardado = Math.max(
    0,
    Number(s6.presupuestoMarketing ?? s6.marketingMensual ?? 0)
  );
  const marketingInput = parseCLP(marketingMensual);
  const marketingEfectivo = marketingInput > 0 ? marketingInput : marketingGuardado;

  // ✅ Fuente única de P.E. (punto de equilibrio): incluye gastos fijos + marketing
  const be = calcBreakEven({
    ticket,
    costoVarUnit: Number(s6.costoVarUnit ?? 0),
    costoVarPct: Number(s6.costoVarPct ?? 0),
    gastosFijosMensuales,
    marketingMensual: marketingEfectivo,
  });

  const clientesPERounded = be.clientesPE;
  const ventasPERounded = be.ventasPE;

  // Tráfico sugerido (basado en clientes objetivo y conversión fija)
  const convRatio = CONVERSION_PCT_FIJA / 100;
  const traficoSugerido =
    clientesObjetivoMes > 0 && convRatio > 0
      ? Math.ceil(clientesObjetivoMes / convRatio)
      : NaN;

  // CAC (costo de adquisición de cliente): Presupuesto mensual ÷ Clientes objetivo (mes)
  const CAC_estimado =
    marketingEfectivo > 0 && clientesObjetivoMes > 0
      ? Math.round(marketingEfectivo / clientesObjetivoMes)
      : NaN;

  const capitalTrabajoNecesario = capitalTrabajoDesdePE({
    gastosMensuales: be.gastosMensuales,
    mcUnit: be.mcUnit,
    clientesPE: be.clientesPE,
    mesesPE,
    clientesObjetivoMes,
  });

  function onNext() {
    const traf = Number.isFinite(traficoSugerido) ? traficoSugerido : undefined;

    const nextStep6 = {
      ...(data.step6 ?? {}),
      // ✅ Datos clave consistentes con Step-9
      mesesPE,
      marketingMensual: marketingEfectivo > 0 ? marketingEfectivo : undefined, // alias compat
      presupuestoMarketing: marketingEfectivo > 0 ? marketingEfectivo : undefined,

      clientesPE: be.clientesPE,
      ventasPE: be.ventasPE,
      margenUnitario: be.mcUnit,
      gastosMensuales: be.gastosMensuales,

      // ✅ Capital de trabajo (con marketing incluido)
      capitalTrabajo: capitalTrabajoNecesario,

      // ✅ Se fija conversión y tráfico (sin UI)
      conversionPct: CONVERSION_PCT_FIJA,
      traficoMensual: traf,
    } as any;

    setStep6(nextStep6);

    try {
      patchLegacyFromWizard({
        wizardData: { ...data, step6: nextStep6 },
      });
    } catch (e) {
      console.error("[Step7] patchLegacyFromWizard error:", e);
    }

    router.push("/wizard/step-8");
  }

  return (
    <main className="mx-auto max-w-4xl px-2 py-8">
      <EconomicHeader
        title="Paso 7 · Conoce a tus clientes y tu punto de equilibrio"
        subtitle={
          <>
            En simple, el <b>P.E. (punto de equilibrio)</b> es cuando tu margen mensual
            alcanza para pagar tus <b>gastos fijos + marketing</b>.
          </>
        }
      />

      {/* ========= Bloque P.E. ========= */}
      <section className="rounded-2xl border bg-white shadow-sm p-5 mb-6">
        <h2 className="text-base font-semibold">
          ¿En cuántos meses te gustaría llegar a cubrir tus gastos mensuales?
        </h2>
        <p className="text-sm text-slate-600">
          Usamos una rampa simple hasta el mes que elijas para estimar tu capital de trabajo.
        </p>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {[3, 6, 9, 12].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMesesPE(m)}
              className={[
                "rounded-xl border px-3 py-2 text-center",
                mesesPE === m
                  ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                  : "bg-white hover:bg-blue-50",
              ].join(" ")}
              aria-pressed={mesesPE === m}
            >
              {m} meses
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border p-3">
            <div className="text-xs text-slate-500">
              Capital de trabajo necesario (plan {mesesPE}m)
            </div>
            <div className="text-lg font-semibold">${fmtCL(capitalTrabajoNecesario)}</div>
            <details className="mt-2 text-xs text-slate-600">
              <summary className="cursor-pointer font-medium text-slate-700">
                ¿Te explico más?
              </summary>
              <p className="mt-1">
                Es el dinero que necesitarás para pagar tus gastos mientras tus ventas
                suben hasta el P.E., evitando quedarte sin caja.
              </p>
            </details>
          </div>

          <div className="rounded-xl border p-3">
            <div className="text-xs text-slate-500">
              Ventas para P.E. (mensual)
            </div>
            <div className="text-lg font-semibold">${fmtCL(ventasPERounded)}</div>
            <details className="mt-2 text-xs text-slate-600">
              <summary className="cursor-pointer font-medium text-slate-700">
                ¿Qué significa?
              </summary>
              <p className="mt-1">
                Es la venta mensual necesaria para cubrir gastos fijos + marketing.
              </p>
            </details>
          </div>

          <div className="rounded-xl border p-3">
            <div className="text-xs text-slate-500">
              Clientes para P.E. (mensual)
            </div>
            <div className="text-lg font-semibold">{fmtNum(clientesPERounded)}</div>
            <details className="mt-2 text-xs text-slate-600">
              <summary className="cursor-pointer font-medium text-slate-700">
                ¿Qué significa?
              </summary>
              <p className="mt-1">
                Clientes/mes necesarios para cubrir gastos fijos + marketing (según tu margen por cliente).
              </p>
            </details>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            id="dbg-step7"
            type="checkbox"
            checked={showDebug}
            onChange={(e) => setShowDebug(e.target.checked)}
          />
          <label htmlFor="dbg-step7" className="text-xs text-slate-600 cursor-pointer">
            Mostrar debug del cálculo
          </label>
        </div>

        {showDebug && (
          <div className="mt-3 rounded-xl border bg-slate-50 p-3 text-xs text-slate-700">
            <div className="font-semibold mb-2">Inputs usados</div>
            <ul className="space-y-1">
              <li>Ticket: <b>${fmtCL(be.ticket)}</b></li>
              <li>Costo variable unitario: <b>${fmtCL(be.costoUnit)}</b></li>
              <li>Margen unitario: <b>${fmtCL(be.mcUnit)}</b></li>
              <li>Gastos fijos mensuales: <b>${fmtCL(be.gastosFijosMensuales)}</b></li>
              <li>Marketing mensual: <b>${fmtCL(be.marketingMensual)}</b></li>
              <li>Gastos mensuales (fijos + marketing): <b>${fmtCL(be.gastosMensuales)}</b></li>
            </ul>
          </div>
        )}
      </section>

      {/* ========= Conoce a tu cliente ========= */}
      <section className="rounded-2xl border bg-white shadow-sm p-5">
        <h2 className="text-base font-semibold">
          Conoce a tu cliente{" "}
          <span className="text-slate-500 font-normal">
            (mientras más grande el número, menos visitas)
          </span>
        </h2>
        <p className="text-sm text-slate-600">
          A cuántos clientes debes llegar con tus campañas de marketing (redes sociales, publicidad tradicional, etc.). Con dos datos simples proyectamos tu gasto en marketing por cliente.
        </p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Conversión fija */}
          <div className="rounded-lg border p-3">
            <div className="text-sm font-medium">Porcentaje de conversión</div>
            <div className="mt-1 inline-flex items-center gap-2">
              <div className="rounded-lg border bg-rose-50 border-red-500 px-3 py-2 font-semibold">
                {CONVERSION_PCT_FIJA}%
              </div>
              <span className="text-xs text-slate-500">Razonable</span>
            </div>

            <details className="mt-2 text-xs text-slate-600">
              <summary className="cursor-pointer font-medium text-slate-700">
                ¿Qué es la conversión?
              </summary>
              <p className="mt-1">
                Es el porcentaje de tus visitas que terminan comprando. a modo de referencia, tasas típicas son:
                4% (e-commerce), 10% (la mayoria de los rubros), 30% (servicios). Mientras más grande el número, menos visitas necesitas.
              </p>
            </details>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs text-slate-500">Clientes objetivo (mes)</div>
            <div className="text-lg font-semibold">
              {clientesObjetivoMes > 0 ? fmtNum(clientesObjetivoMes) : "—"}
            </div>
            <div className="mt-1 text-xs text-slate-600">
              Calculado desde tu venta anual y ticket (ajústalo en el Paso 6 si necesitas).
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs text-slate-500">Tráfico mensual sugerido</div>
            <div className="text-lg font-semibold">
              {Number.isFinite(traficoSugerido) ? fmtNum(traficoSugerido) : "—"}
            </div>
            <details className="mt-2 text-xs text-slate-600">
              <summary className="cursor-pointer font-medium text-slate-700">
                ¿Qué es el tráfico?
              </summary>
              <p className="mt-1">
                Es la cantidad de personas que deben visitar tu canal cada mes para lograr los clientes objetivo,
                dado tu porcentaje de conversión.
              </p>
            </details>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <label className="block">
              <span className="text-sm font-medium">
                Presupuesto mensual de marketing ($)
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={marketingMensual}
                onChange={(e) => setMarketingMensual(formatCLPInput(e.target.value))}
                placeholder="p. ej. 480.000"
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>

            <details className="mt-2 text-xs text-slate-600">
              <summary className="cursor-pointer font-medium text-slate-700">
                ¿Para qué sirve?
              </summary>
              <p className="mt-1">
                Es lo que estás dispuesto a invertir cada mes para generar ese tráfico y clientes.
              </p>
            </details>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs text-slate-500">CAC (costo de adquisición de cliente) estimado</div>
            <div className="text-lg font-semibold">
              {Number.isFinite(CAC_estimado) ? `$${fmtCL(CAC_estimado)}` : "—"}
            </div>

            <details className="mt-2 text-xs text-slate-600">
              <summary className="cursor-pointer font-medium text-slate-700">
                ¿Qué es CAC?
              </summary>
              <p className="mt-1">
                CAC (costo de adquisición de cliente). Aquí lo calculamos como{" "}
                <b>Presupuesto mensual de marketing ÷ Clientes objetivo (mes)</b>.
              </p>
            </details>
          </div>
        </div>
      </section>

      <div className="mt-6 flex items-center justify-between">
        <PrevButton href="/wizard/step-6" />
        <NextButton onClick={onNext} />
      </div>

      <UpsellBanner />

      <p className="mt-4 text-xs text-slate-500">
        Nota: estos números son orientativos. La{" "}
        <span className="inline-flex items-center gap-1 font-medium">
          <BotIcon className="w-3.5 h-3.5" /> IA (inteligencia artificial) Aret3
        </span>{" "}
        los usará para ajustar tu tablero e informe final.
      </p>
    </main>
  );
}
