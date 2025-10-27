// app/wizard/step-10/page.tsx
"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/state/wizard-store";
import EconomicHeader from "@/components/wizard/EconomicHeader";
import UpsellBanner from "@/components/wizard/UpsellBanner";
import { PrevButton, NextButton } from "@/components/wizard/WizardNav";
import BotIcon from "@/components/icons/BotIcon";
import { getTemplateForSector } from "@/lib/model/step6-distributions";
import { SECTORS } from "@/lib/model/sectors";
import type { SectorId } from "@/lib/model/sectors";

/* ========= Utils (alineado a Step-6/7/9) ========= */
const formatCLP = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Math.round(n || 0));
const ceil = (x: number) => (x > 0 ? Math.ceil(x) : 0);

function deriveCostoUnit(ticket: number, costoVarPct?: number, costoVarUnit?: number) {
  if (typeof costoVarUnit === "number" && costoVarUnit > 0) return Math.min(costoVarUnit, ticket);
  if (typeof costoVarPct === "number" && costoVarPct > 0) return Math.min((ticket * costoVarPct) / 100, ticket);
  return 0;
}
const calcMcUnit = (ticket: number, costoUnit: number) => Math.max(ticket - costoUnit, 0);

// 👇 Pon esto junto a tus otros helpers, arriba del componente
const pickNumber = (...vals: any[]) => {
  for (const v of vals) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return Math.round(n);
  }
  return 0;
};


/* ========= Proyección 12m (para KPIs y curva P.E. – se mantiene) ========= */
function proyectar12Meses(opts: {
  ticket: number;
  costoUnit: number;
  gastosFijosMensuales: number;
  marketingMensual: number;
  clientesPE: number;
  mesesPE: number;            // 3/6/9/12
  clientesObjetivoMes?: number;
  cajaInicial?: number;
}) {
  const { ticket, costoUnit, gastosFijosMensuales, marketingMensual, clientesPE, mesesPE, clientesObjetivoMes = 0, cajaInicial = 0 } = opts;

  type Row = {
    mes: number;
    pctPE: number;
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
    const factor = mesesPE > 0 ? m / mesesPE : 1;      // peldaños iguales
    const basePE = ceil(clientesPE * factor);
    const clientes = clientesObjetivoMes > 0 ? Math.min(basePE, Math.round(clientesObjetivoMes)) : basePE;

    const ingresos = clientes * ticket;
    const costoVar = clientes * costoUnit;
    const mc = Math.max(0, ingresos - costoVar);
    const gastos = Math.max(0, gastosFijosMensuales) + Math.max(0, marketingMensual);
    const resultado = mc - gastos;

    caja += resultado;
    if (caja < minCaja) {
      minCaja = caja;
      minCajaMes = m;
    }

    rows.push({
      mes: m,
      pctPE: Math.min(1, factor) * 100,
      clientes,
      ingresos,
      costoVar,
      mc,
      gastos,
      resultado,
      cajaAcum: caja,
    });
  }

  const capitalTrabajo = rows.filter(r => r.resultado < 0).reduce((a, r) => a + Math.abs(r.resultado), 0);

  return {
    rows,
    capitalTrabajo,
    minCaja,
    minCajaMes,
    capitalTrabajoNecesario: Math.max(0, Math.round(0 - minCaja)),
  };
}

/* ========= Normalizador Step-5 (1–3) ========= */
type K5 =
  | "urgencia"
  | "accesibilidad"
  | "competencia"
  | "experiencia"
  | "pasion"
  | "planesAlternativos"
  | "toleranciaRiesgo"
  | "testeoPrevio"
  | "redApoyo";

const EMO_FIELDS: { key: K5; label: string }[] = [
  { key: "urgencia", label: "Problema" },
  { key: "experiencia", label: "Experiencia" },
  { key: "competencia", label: "Competencia" },
  { key: "accesibilidad", label: "Acceso cliente" },
  { key: "toleranciaRiesgo", label: "Riesgo" },
  { key: "pasion", label: "Pasión" },
  { key: "testeoPrevio", label: "Testeo" },
  { key: "redApoyo", label: "Red apoyo" },
  { key: "planesAlternativos", label: "Plan B" },
];

function toScale3(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n <= 1) return 1;
  if (n <= 2) return 2;
  return 3;
}

function normalizeS5(raw: any): Record<K5, number> {
  const out = {} as Record<K5, number>;
  EMO_FIELDS.forEach(({ key }) => (out[key] = toScale3(raw?.[key])));
  return out;
}

function scoreS5(values: Record<K5, number>) {
  const answered = Object.values(values).filter((v) => v >= 1 && v <= 3);
  const sum = answered.reduce((a, b) => a + b, 0);
  const max = (answered.length || 1) * 3;
  const idx = Math.round((sum / max) * 100);
  return { sum, idx, answered: answered.length };
}

/* ========= Radar SVG mini (responsivo y tipografía mayor) ========= */
function EmotionRadar({ values }: { values: Record<K5, number> }) {
  // Usamos viewBox fijo y el tamaño lo controla el contenedor con Tailwind
  const BOX = 320;
  const cx = BOX / 2;
  const cy = BOX / 2;
  const rMax = 120; // radio máximo dentro del BOX
  const n = EMO_FIELDS.length;

  const toXY = (i: number, v: number) => {
    const angle = ((-90 + (360 / n) * i) * Math.PI) / 180; // inicia arriba
    const r = (Math.max(0, Math.min(3, v)) / 3) * rMax;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  const rings = [1, 2, 3].map((lvl) => {
    const pts = EMO_FIELDS.map((_, i) => {
      const [x, y] = toXY(i, lvl);
      return `${x},${y}`;
    }).join(" ");
    return <polygon key={lvl} points={pts} fill="none" stroke="#e5e7eb" strokeDasharray="4 4" />;
  });

  const polyPts = EMO_FIELDS.map((_, i) => {
    const [x, y] = toXY(i, values[EMO_FIELDS[i].key] || 0);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="mx-auto w-[210px] sm:w-[240px] md:w-[320px] aspect-square">
      <svg
        viewBox={`0 0 ${BOX} ${BOX}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        className="block"
      >
        <g>
          {rings}
          {/* ejes */}
          {EMO_FIELDS.map((_, i) => {
            const [x, y] = toXY(i, 3);
            return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e5e7eb" />;
          })}
          {/* polígono de valor */}
          <polygon points={polyPts} fill="rgba(56,189,248,0.25)" stroke="#38bdf8" strokeWidth="2" />
          {/* etiquetas con tipografía mayor y responsiva */}
          {EMO_FIELDS.map((f, i) => {
            const [x, y] = toXY(i, 3.35); // un poco afuera
            return (
              <text
                key={f.key}
                x={x}
                y={y}
                textAnchor="middle"
                className="fill-slate-700 text-[11px] sm:text-[12px] md:text-[13px]"
              >
                {f.label}
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
}



/* ===== Semáforo del veredicto (ROJO/ÁMBAR/VERDE) ===== */
function SemaforoVerdicto({ idx }: { idx: number }) {
  let verdict = "ÁMBAR";
  let color = "bg-amber-500";
  if (idx < 40) {
    verdict = "ROJO";
    color = "bg-red-600";
  } else if (idx >= 70) {
    verdict = "VERDE";
    color = "bg-green-600";
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 md:gap-2 text-[10px] md:text-[11px]"
      aria-label={`Semáforo: ${verdict} (${idx}%)`}
    >
      <span className="rounded-md px-1.5 py-0.5 md:px-2 text-white bg-red-600">ROJO &lt; 40</span>
      <span className="rounded-md px-1.5 py-0.5 md:px-2 text-white bg-amber-500">ÁMBAR 40–69</span>
      <span className="rounded-md px-1.5 py-0.5 md:px-2 text-white bg-green-600">VERDE ≥ 70</span>
      <span className={`md:ml-2 rounded-md px-1.5 py-0.5 md:px-2 font-semibold text-white ${color}`}>
        VEREDICTO: {verdict} · {idx}%
      </span>
    </div>
  );
}
/* ========= Página ========= */
export default function Step10Page() {
  const router = useRouter();
  const { data } = useWizardStore();
  const s6 = (data?.step6 ?? {}) as any;

  // === Datos base para KPIs y curva P.E. (se mantienen) ===
  const ticket = Math.max(0, Number(s6.ticket ?? 0));
  const ventaAnual = Math.max(0, Number(s6.ventaAnual ?? s6.ventaAnio1 ?? 0));
  const ventaMensual = ventaAnual > 0 ? ventaAnual / 12 : 0;

  // Rubro / plantilla (igual que en Step-8)
const sector: SectorId =
  (data?.step2?.sectorId as SectorId) ?? ("retail_local" as SectorId);
const tpl = getTemplateForSector(sector);

// Sueldo del dueño (ANUAL):
// 1) usa cualquier override que exista en el store
// 2) si no hay, calcula por plantilla: ventaAnual * % gf_sueldoDueno
const sueldoDueno = pickNumber(
  (data as any)?.step8?.sueldoDueno, // si alguna vez lo guardas aquí
  (data as any)?.step6?.sueldoDueno,
  (data as any)?.sueldoDueno,
  Math.round((ventaAnual || 0) * (tpl?.gf_sueldoDueno || 0)) // fallback por plantilla
);


  const gastosFijosMensuales = Math.max(0, Number(s6.gastosFijosMensuales ?? 0));
  const marketingMensual = Math.max(0, Number(s6.presupuestoMarketing ?? s6.marketingMensual ?? 0));
  const mesesPE = Math.max(1, Math.round(Number(s6.mesesPE ?? 6)));

  const costoUnit = deriveCostoUnit(ticket, Number(s6.costoVarPct ?? 0), Number(s6.costoVarUnit ?? 0));
  const mcUnit = calcMcUnit(ticket, costoUnit);
  const clientesPE = mcUnit > 0 && gastosFijosMensuales > 0 ? Math.ceil(gastosFijosMensuales / mcUnit) : 0;
  

  const clientesObjetivoMes =
    Number(s6.clientesMensuales ?? 0) > 0
      ? Math.round(Number(s6.clientesMensuales))
      : ticket > 0
      ? Math.round((ventaMensual || 0) / ticket)
      : 0;

  const snapshot = useMemo(
    () =>
      proyectar12Meses({
        ticket,
        costoUnit,
        gastosFijosMensuales,
        marketingMensual,
        clientesPE,
        mesesPE,
        clientesObjetivoMes,
        cajaInicial: 0,
      }),
    [ticket, costoUnit, gastosFijosMensuales, marketingMensual, clientesPE, mesesPE, clientesObjetivoMes]
  );
// === Derivados para tarjetas ===
const ventasPE = Math.max(0, clientesPE * ticket);

const CAC_estimado =
  marketingMensual > 0 && clientesObjetivoMes > 0
    ? Math.round(marketingMensual / clientesObjetivoMes)
    : NaN;

// EERR anual (antes de impuestos)
const clientesAnualesCalc = ticket > 0 ? Math.round(ventaAnual / ticket) : 0;
const costoVarAnual =
  Number(s6.costoVarUnit ?? 0) > 0
    ? Math.round(clientesAnualesCalc * Number(s6.costoVarUnit))
    : Number(s6.costoVarPct ?? 0) > 0
    ? Math.round((ventaAnual * Number(s6.costoVarPct)) / 100)
    : 0;

const rentabAntesImp = Math.round(
  ventaAnual - costoVarAnual - (gastosFijosMensuales + marketingMensual) * 12
);


  // === Emocional (Step-5) ===
  const s5 = normalizeS5((data?.step5 ?? {}) as any);
  const s5score = scoreS5(s5);

  const showWarn = ticket <= 0 || mcUnit <= 0;

  return (
    <main className="mx-auto max-w-7xl px-3 py-8">
      <EconomicHeader
        title="Paso 10 · Panel de Navegación"
        subtitle={
          <>
            Resumen simple y accionable de tu idea: ventas, costos, <b>punto de equilibrio</b>,{" "}
            <b>capital de trabajo</b> y tu perfil emocional. Lo que cambies en los pasos anteriores se refleja aquí.
          </>
        }
      />

      {showWarn && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <b>Revisa el Paso 6:</b> el ticket o el margen por unidad es 0. Ajusta precio/costo para calcular.
        </div>
      )}

      {/* KPIs principales (finanzas) */}
      <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* 1) Objetivos unitarios */}
  <div className="rounded-2xl border bg-white shadow-sm p-5">
    <h3 className="font-medium">Objetivos unitarios</h3>
    <ul className="mt-3 text-sm space-y-1">
      <li>Ticket promedio: <b>{formatCLP(ticket)}</b></li>
      <li>Costo variable unitario: <b>{formatCLP(costoUnit)}</b></li>
      <li>Margen por unidad: <b>{formatCLP(mcUnit)}</b></li>
      <li>
        CAC (estimado):{" "}
        <b>{Number.isFinite(CAC_estimado) ? formatCLP(CAC_estimado) : "—"}</b>
      </li>
      <li>Clientes para P.E. (mensual): <b>{clientesPE}</b></li>
    </ul>
  </div>

  {/* 2) Operación mensual */}
  <div className="rounded-2xl border bg-white shadow-sm p-5">
    <h3 className="font-medium">Operación mensual</h3>
    <ul className="mt-3 text-sm space-y-1">
      <li>Gastos fijos: <b>{formatCLP(gastosFijosMensuales)}</b></li>
      <li>Marketing: <b>{formatCLP(marketingMensual)}</b></li>
      <li>Meses para llegar al P.E.: <b>{mesesPE}</b></li>
      <li>Ventas para P.E. (mensual): <b>{formatCLP(ventasPE)}</b></li>
    </ul>
  </div>

  {/* 3) Grandes indicadores anuales */}
  <div className="rounded-2xl border bg-white shadow-sm p-5">
    <h3 className="font-medium">Grandes indicadores anuales</h3>
    <ul className="mt-3 text-sm space-y-1">
      <li>Venta anual: <b>{formatCLP(ventaAnual)}</b></li>
      <li>Rentabilidad antes de imp.: <b>{formatCLP(rentabAntesImp)}</b></li>
      <li>Capital de trabajo (déficits del año): <b>{formatCLP(snapshot.capitalTrabajo)}</b></li>
      <li>Sueldo del dueño: <b>{sueldoDueno > 0 ? formatCLP(sueldoDueno) : "—"}</b></li>
    </ul>
  </div>
</section>

      {/* Curva hacia el Punto de Equilibrio */}
      <section className="mt-6 rounded-2xl border bg-white shadow-sm p-5">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Curva hacia el Punto de Equilibrio (12 meses)</h3>
          <span className="text-xs text-slate-500">(barras = déficit mensual; línea = avance al P.E.)</span>
        </div>

        {/* Mini visual con CSS simple */}
        <div className="mt-4 grid grid-cols-12 gap-2 items-end">
          {snapshot.rows.map((r, _, all) => {
            const worst = Math.max(1, ...all.map(x => (x.resultado < 0 ? Math.abs(x.resultado) : 1)));
            const deficit = r.resultado < 0 ? Math.abs(r.resultado) : 0;
            const h = Math.round((deficit / worst) * 90);
            return (
              <div key={r.mes} className="relative">
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-sky-300"
                  style={{ height: `${Math.min(100, r.pctPE)}px`, opacity: 0.5 }}
                  title={`Avance P.E.: ${Math.round(r.pctPE)}%`}
                />
                <div
                  className={`mx-auto w-4 rounded ${deficit > 0 ? "bg-rose-300" : "bg-emerald-300"}`}
                  style={{ height: `${deficit > 0 ? h : 6}px` }}
                  title={`Resultado M${r.mes}: ${formatCLP(r.resultado)}`}
                />
                <div className="mt-1 text-[10px] text-center text-slate-500">M{r.mes}</div>
              </div>
            );
          })}
        </div>

        <details className="mt-3 text-sm text-slate-700">
          <summary className="cursor-pointer font-medium">¿Cómo se calcula?</summary>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><b>Clientes para P.E.</b> = Gastos fijos ÷ Margen por unidad (redondeado hacia arriba).</li>
            <li><b>Peldaños iguales</b>: si el plan es {mesesPE} meses, el mes 1 atiendes 1/{mesesPE} de esos clientes, el mes 2 2/{mesesPE}, y así hasta 12 meses o hasta tu meta de clientes.</li>
            <li>Ingresos = clientes × ticket; Costos variables = clientes × costo var. unitario; Resultado = margen − (gastos fijos + marketing).</li>
          </ul>
        </details>
      </section>

      {/* === NUEVO: Gráfico emocional (Step-5) === */}
      <section className="mt-6 rounded-2xl border bg-white shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  <div className="flex items-center gap-2">
    <h3 className="font-medium">Tu perfil para ejecutar la idea (emocional)</h3>
    <span className="text-xs text-slate-500">
      índice: <b>{s5score.idx}%</b> · escala 1–3
    </span>
  </div>
  <SemaforoVerdicto idx={s5score.idx} />
</div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EmotionRadar values={s5} />
          <ul className="text-sm text-slate-700 space-y-2">
            {EMO_FIELDS.map((f) => (
              <li key={f.key} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span>{f.label}</span>
                <span className="font-semibold">
                  {s5[f.key] ? `${s5[f.key]} / 3` : "—"}
                </span>
              </li>
            ))}
            <li className="text-xs text-slate-500">
              Tip: valores más altos indican mejor base para avanzar en cada aspecto.
            </li>
          </ul>
        </div>
      </section>

      {/* Navegación */}
      <div className="mt-6 flex items-center justify-between">
        <PrevButton href="/wizard/step-9" />
        <NextButton onClick={() => router.push("/wizard/step-11")} />
      </div>

      <UpsellBanner />

      <p className="mt-4 text-xs text-slate-500">
        Nota: esta vista usa las mismas reglas que el tablero.{" "}
        <span className="inline-flex items-center gap-1 font-medium">
          <BotIcon className="w-3.5 h-3.5" variant="t3" /> IA Aret3
        </span>{" "}
        las usará para el informe final.
      </p>
    </main>
  );
}
