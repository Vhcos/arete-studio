// app/wizard/step-7/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/state/wizard-store";
import { PrevButton, NextButton } from "@/components/wizard/WizardNav";
import UpsellBanner from "@/components/wizard/UpsellBanner";
import EconomicHeader from "@/components/wizard/EconomicHeader";
import BotIcon from "@/components/icons/BotIcon";


/* =============== Helpers números/CLP (idénticos a Step-6) =============== */
const onlyDigitsComma = (s: string) => s.replace(/[^\d,]/g, "");
const fmtCL = (n: number) => n.toLocaleString("es-CL");
const fmtNum = (n: number) =>
  new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(
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

/* Contribución unitaria aproximada */
function deriveMcUnit(ticket: number, costoUnit?: number, costoPct?: number) {
  const price = ticket || 0;
  const cost =
    (costoUnit && costoUnit > 0)
      ? Math.min(costoUnit, price)
      : (costoPct && costoPct > 0 && price > 0)
      ? Math.min((price * costoPct) / 100, price)
      : 0;
  return Math.max(0, Math.round(price - cost));
}

/* Rampa mensual lineal hasta mes P.E.: suma déficits de 12 meses */
function acumDeficit(
  gastosFijosMes: number,
  mcUnit: number,
  clientesPERounded: number,
  mesesPE: number
) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const stepUser = Math.round(100 / Math.max(1, mesesPE));
  let total = 0;
  for (const m of months) {
    const pct = Math.min(100, stepUser * m);
    const clientesMes = (clientesPERounded * pct) / 100;
    const mcTotal = clientesMes * mcUnit;
    const deficit = Math.max(0, gastosFijosMes - mcTotal);
    total += deficit;
  }
  return Math.round(total);
}

/* =============== Página =============== */
export default function Step7Page() {
  const router = useRouter();
  const { data, setStep6 } = useWizardStore();
  const s6 = (data.step6 ?? {}) as { mesesPE?: number; [key: string]: any };

  // Estado editable
  const [mesesPE, setMesesPE] = useState<number>(Number(s6.mesesPE ?? 6));
  const [conversionPct, setConversionPct] = useState<number>(
    Number.isFinite(s6.conversionPct) && (s6.conversionPct ?? 0) > 0
      ? Number(s6.conversionPct)
      : 0
  );
  const [marketingMensual, setMarketingMensual] = useState<string>(
    s6.presupuestoMarketing ? formatCLPInput(String(s6.presupuestoMarketing)) : ""
  );

  // Derivadas básicas
  const ticket = Number(s6.ticket ?? 0);
  const ventaAnual = Number((s6 as any).ventaAnual ?? (s6 as any).ventaAnio1 ?? 0);
  const ventaMensual = ventaAnual > 0 ? ventaAnual / 12 : 0;

  const clientesMensuales =
    Number((s6 as any).clientesMensuales ?? 0) > 0
      ? Number((s6 as any).clientesMensuales)
      : ticket > 0
      ? ventaMensual / ticket
      : 0;

  const gastosFijos = Number(s6.gastosFijosMensuales ?? 0);
  const mcUnit = deriveMcUnit(ticket, Number(s6.costoVarUnit ?? 0), Number(s6.costoVarPct ?? 0));

  // Punto de equilibrio “duro” → redondeo hacia arriba (siguiente entero)
  const clientesPE_raw =
    mcUnit > 0 && gastosFijos > 0 ? gastosFijos / mcUnit : Number.POSITIVE_INFINITY;
  const clientesPERounded = Number.isFinite(clientesPE_raw)
    ? Math.ceil(clientesPE_raw)
    : clientesPE_raw;
  const ventasPERounded = Number.isFinite(clientesPERounded)
    ? clientesPERounded * ticket
    : 0;

  // Capital de trabajo estimado con rampa hasta P.E. (usa clientes PE redondeados)
  const capitalTrabajoNecesario = useMemo(
    () => acumDeficit(gastosFijos, mcUnit, clientesPERounded, mesesPE),
    [gastosFijos, mcUnit, clientesPERounded, mesesPE]
  );

  // Conversión → ratio
  const convRatio =
    Number.isFinite(conversionPct) && conversionPct > 0
      ? conversionPct / 100
      : NaN;

  // Tráfico sugerido
  const traficoSugerido =
    Number.isFinite(clientesMensuales) && Number.isFinite(convRatio) && convRatio > 0
      ? Math.ceil(clientesMensuales / convRatio)
      : NaN;

  // CAC estimado = Presupuesto / Clientes objetivo (si hay ambas cosas)
  const PresupuestoNum = parseCLP(marketingMensual);
  const CAC_estimado =
    PresupuestoNum > 0 && clientesMensuales > 0
      ? Math.round(PresupuestoNum / clientesMensuales)
      : NaN;

  /* -------- Persistencia -------- */
  function onNext() {
    const conv = Math.max(0, Math.min(100, Math.round(conversionPct)));
    const traf = Number.isFinite(traficoSugerido) ? traficoSugerido : undefined;
    const mkt = parseCLP(marketingMensual);

    setStep6({
      ...(data.step6 ?? {}),
      mesesPE,
      conversionPct: conv,
      traficoMensual: traf,
      presupuestoMarketing: mkt > 0 ? mkt : undefined,
      marketingMensual: mkt > 0 ? mkt : undefined, // alias compat
    } as any);

    router.push("/wizard/step-8");
  }

  /* =============== UI =============== */
  return (
    <main className="mx-auto max-w-4xl px-2 py-8">
      <EconomicHeader
        title="Paso 7 · Conoce a tus clientes y tu punto de equilibrio"
        subtitle={
          <>
            En simple, el <b>punto de equilibrio</b> es cuando tus ventas mensuales
            alcanzan para pagar tus costos fijos. Aquí lo estimamos con números fáciles.
          </>
        }
      />

      {/* Bloque 1: Punto de equilibrio */}
      <section className="rounded-2xl border bg-white shadow-sm p-5 mb-6">
        <h2 className="text-base font-semibold">
          ¿En cuántos meses te gustaría llegar a cubrir tus costos fijos?
        </h2>
        <p className="text-sm text-slate-600">
          Usamos una rampa simple hasta el mes que elijas para estimar tu capital de trabajo.
        </p>

        {/* selector 3/6/9/12 */}
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

        {/* KPIs + “¿Te explico más?” */}
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
                suben hasta el punto de equilibrio, evitando quedarte sin caja.
              </p>
            </details>
          </div>

          <div className="rounded-xl border p-3">
            <div className="text-xs text-slate-500">Ventas para P.E. (mensual)</div>
            <div className="text-lg font-semibold">${fmtCL(ventasPERounded)}</div>
            <details className="mt-2 text-xs text-slate-600">
              <summary className="cursor-pointer font-medium text-slate-700">
                ¿Qué significa?
              </summary>
              <p className="mt-1">
                Es la venta mensual necesaria para cubrir tus costos fijos. Desde ahí,
                cada venta adicional deja utilidad (después de costos variables).
              </p>
            </details>
          </div>

          <div className="rounded-xl border p-3">
            <div className="text-xs text-slate-500">Clientes para P.E. (mensual)</div>
            <div className="text-lg font-semibold">{fmtNum(clientesPERounded)}</div>
            <details className="mt-2 text-xs text-slate-600">
              <summary className="cursor-pointer font-medium text-slate-700">
                ¿Qué significa?
              </summary>
              <p className="mt-1">
                Es la cantidad de clientes que necesitas en un mes para cubrir tus costos fijos,
                considerando el margen por cliente.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Bloque 2: Conoce a tu cliente */}
      <section className="rounded-2xl border bg-white shadow-sm p-5">
        <h2 className="text-base font-semibold">
          Conoce a tu cliente <span className="text-slate-500 font-normal">(solo debes mover el Porcentaje de conversión)</span>
        </h2>
        <p className="text-sm text-slate-600">
          Con dos datos simples proyectamos cuántas visitas necesitas para alcanzar tus clientes meta.
        </p>

        {/* fila: conversión + clientes meta + tráfico */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-sm font-medium">Porcentaje de conversión</span>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2 bg-rose-50 border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-600"
              value={String(conversionPct)}
              onChange={(e) => setConversionPct(Number(e.target.value))}
            >
              <option value="0">Selecciona…</option>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <details className="mt-2 text-xs text-slate-600">
              <summary className="cursor-pointer font-medium text-slate-700">
                ¿Qué es la conversión?
              </summary>
              <p className="mt-1">
                Es el porcentaje de tus visitas que termina comprando. Si no tienes datos:
                1–4 (e-commerce), 3–10 (tienda), 10–30 (servicios).
              </p>
            </details>
          </label>

          <div className="rounded-lg border p-3">
            <div className="text-xs text-slate-500">Clientes objetivo (mes)</div>
            <div className="text-lg font-semibold">{fmtNum(clientesMensuales)}</div>
            <div className="text-[11px] text-slate-500 mt-1">
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
                Es la cantidad de personas que deben visitar tu canal cada mes para lograr los
                clientes objetivo, dado tu porcentaje de conversión.
              </p>
            </details>
          </div>
        </div>

        {/* inversión simple: presupuesto + CAC estimado */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">Presupuesto mensual de marketing ($)</span>
            <input
              type="text"
              inputMode="numeric"
              value={marketingMensual}
              onChange={(e) => setMarketingMensual(formatCLPInput(e.target.value))}
              placeholder="p. ej. 750.000"
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
            <details className="mt-2 text-xs text-slate-600">
              <summary className="cursor-pointer font-medium text-slate-700">
                ¿Para qué sirve?
              </summary>
              <p className="mt-1">
                Es lo que estás dispuesto a invertir cada mes para generar ese tráfico y clientes.
              </p>
            </details>
          </label>

          <div className="rounded-md border p-3">
            <div className="text-xs text-slate-500">CAC (estimado)</div>
            <div className="text-lg font-semibold">
              {Number.isFinite(CAC_estimado) ? `$${fmtCL(CAC_estimado)}` : "—"}
            </div>
            <details className="mt-2 text-xs text-slate-600">
              <summary className="cursor-pointer font-medium text-slate-700">
                ¿Qué es CAC?
              </summary>
              <p className="mt-1">
                Costo de Adquisición de Cliente. Aquí lo calculamos como{" "}
                <b>Presupuesto mensual de marketing ÷ Clientes objetivo (mes)</b>.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* navegación */}
      <div className="mt-6 flex items-center justify-between">
        <PrevButton href="/wizard/step-6" />
        <NextButton onClick={onNext} />
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
