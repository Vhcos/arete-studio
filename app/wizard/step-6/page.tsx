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
import UpsellBanner from "@/components/wizard/UpsellBanner";
import BotIcon from "@/components/icons/BotIcon";

/* ================= Helpers ================= */
const onlyDigitsComma = (s: string) => s.replace(/[^\d,]/g, "");
const onlyDigits = (s: string) => s.replace(/[^\d]/g, "");
const fmtCL = (n: number) => n.toLocaleString("es-CL");

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
function toInt(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = Number(String(v).replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
}
function safeDiv(n: number, d: number): number {
  if (!(Number.isFinite(n) && Number.isFinite(d))) return 0;
  if (d <= 0) return 0;
  const r = n / d;
  return Number.isFinite(r) ? Math.round(r) : 0;
}

/* ====== UI helpers (inline, sin dependencias) ====== */
function InfoDot({ title }: { title: string }) {
  return (
    <span
      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-sky-100 text-sky-700 text-[10px] font-semibold align-middle"
      title={title}
      aria-label={title}
    >
      i
    </span>
  );
}
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-900/5">
      {children}
    </span>
  );
}
function LabelSmall({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-slate-700">{children}</span>;
}

/* ====== Candado ====== */
function LockToggle({
  locked,
  onToggle,
  label,
}: {
  locked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`ml-2 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] ${
        locked
          ? "border-sky-300 bg-sky-50 text-sky-700"
          : "border-slate-200 bg-white text-slate-500"
      }`}
      title={locked ? `${label} bloqueado` : `Bloquear ${label}`}
      aria-pressed={locked}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        className={locked ? "text-sky-600" : "text-slate-400"}
      >
        {locked ? (
          <path
            d="M7 10V8a5 5 0 1 1 10 0v2M6 10h12v10H6V10Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M17 10V8a5 5 0 1 0-10 0v2M6 10h12v10H6V10Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
      {locked ? "Bloqueado" : "Bloquear"}
    </button>
  );
}

/* ================= Estado local ================= */
type Local = {
  inversionInicial?: string;
  capitalTrabajo?: string;

  ventaMensual?: string; // CLP
  ventaAnual?: string;   // CLP (alineado a schema)
  ticket?: string;       // CLP por cliente
  clientesMensuales?: string; // SOLO LOCAL

  gastosFijosMensuales?: string;
  presupuestoMarketing?: string;
  costoVarUnit?: string;

  conversionPct?: number | string;
  frecuenciaCompraMeses?: number | string;
  mesesPE?: number | string;
};

type EditedKey = "ventaMensual" | "ventaAnual" | "ticket" | "clientesMensuales" | null;
type TypedFlags = { M: boolean; A: boolean; T: boolean; C: boolean };

export default function Step6Page() {
  const router = useRouter();
  const { data, setStep6 } = useWizardStore();

  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastEdited, setLastEdited] = useState<EditedKey>(null);
  const [userTyped, setUserTyped] = useState<TypedFlags>({ M: false, A: false, T: false, C: false });

  // Locks persistentes (imitan “el usuario escribió” aunque no teclee en esta sesión)
  const [lockT, setLockT] = useState(false);
  const [lockC, setLockC] = useState(false);

  // Prefill (lee ventaAnual o compat ventaAnio1)
  const anualPrev =
    (data as any)?.step6?.ventaAnual ??
    (data as any)?.step6?.ventaAnio1 ??
    0;
  const mensualPrev = anualPrev ? Math.round(anualPrev / 12) : 0;

  const [local, setLocal] = useState<Local>({
    inversionInicial: formatCLPInput((data as any)?.step6?.inversionInicial ?? 0),
    capitalTrabajo: formatCLPInput((data as any)?.step6?.capitalTrabajo ?? 0),

    ventaMensual: formatCLPInput(mensualPrev),
    ventaAnual: formatCLPInput(anualPrev),

    ticket: formatCLPInput((data as any)?.step6?.ticket ?? 0),
    clientesMensuales: "", // no persistimos

    gastosFijosMensuales: formatCLPInput((data as any)?.step6?.gastosFijosMensuales ?? 0),
    presupuestoMarketing: formatCLPInput((data as any)?.step6?.presupuestoMarketing ?? 0),
    costoVarUnit: formatCLPInput((data as any)?.step6?.costoVarUnit ?? 0),

    conversionPct: (data as any)?.step6?.conversionPct ?? 0,
    frecuenciaCompraMeses: (data as any)?.step6?.frecuenciaCompraMeses ?? 6,
    mesesPE: (data as any)?.step6?.mesesPE ?? 6,
  });

  /* ============ Sector / Plantilla ============ */
  const sector: SectorId =
    ((data as any)?.step2?.sectorId as SectorId) ?? ("retail_local" as SectorId);
  const tpl = getTemplateForSector(sector);
  const sectorInfo = SECTORS.find((s) => s.id === sector);
  const sectorLabel = sectorInfo?.label ?? sector;

  /* ============ Derivados (KPIs) ============ */
  const derived = useMemo(() => {
    const M =
      num(local.ventaMensual) > 0
        ? num(local.ventaMensual)
        : Math.round(num(local.ventaAnual) / 12);

    const A = num(local.ventaAnual) > 0 ? num(local.ventaAnual) : M * 12;

    const T = num(local.ticket);
    const C_input = toInt(local.clientesMensuales);

    const C = C_input > 0 ? C_input : T > 0 ? safeDiv(M, T) : 0;
    const C_year = C * 12;

    // Distribución por plantilla (anual)
    const cvMat = Math.round(A * tpl.cv_materiales);
    const cvPer = Math.round(A * tpl.cv_personal);

    const costoVarUnitario = C_year > 0 ? Math.round((cvMat + cvPer) / C_year) : 0;

    return {
      ventaMensual: M,
      ventaAnual: A,
      clientesMensuales: C,
      clientesAnuales: C_year,
      cvMat,
      cvPer,
      costoVarUnitario,
    };
  }, [local, tpl]);

  /* ======== Solver: respeta último editado + locks + si el usuario escribió ======== */
  function solveAndSet(
    source: EditedKey,
    values: Partial<{ M: number; A: number; T: number; C: number }>,
    typedNow?: Partial<TypedFlags>
  ) {
    // typed “efectivo” = lo escrito por el usuario OR lock activo
    const typed: TypedFlags = {
      ...userTyped,
      ...(typedNow || {}),
      T: (userTyped.T || lockT || typedNow?.T) ?? false,
      C: (userTyped.C || lockC || typedNow?.C) ?? false,
    };

    let M0 = parseCLP(local.ventaMensual);
    let A0 = parseCLP(local.ventaAnual);
    let T0 = parseCLP(local.ticket);
    let C0 = toInt(local.clientesMensuales);

    if (values.M != null) M0 = Math.max(0, Math.round(values.M));
    if (values.A != null) A0 = Math.max(0, Math.round(values.A));
    if (values.T != null) T0 = Math.max(0, Math.round(values.T));
    if (values.C != null) C0 = Math.max(0, Math.round(values.C));

    const applySet = (M: number, A: number, T: number, C: number) => {
      setLocal((p) => ({
        ...p,
        ventaMensual: M > 0 ? formatCLPInput(M) : "",
        ventaAnual: A > 0 ? formatCLPInput(A) : "",
        ticket: T > 0 ? formatCLPInput(T) : p.ticket ?? "",
        clientesMensuales: C > 0 ? String(C) : p.clientesMensuales ?? "",
      }));
      setLastEdited(source);
      setUserTyped(typed);
    };

    switch (source) {
      case "ventaMensual": {
        const M = M0;
        const A = M > 0 ? M * 12 : 0;
        let T = T0;
        let C = C0;

        if (typed.T && !typed.C && T > 0) {
          C = safeDiv(M, T);
        } else if (typed.C && !typed.T && C > 0) {
          T = safeDiv(M, C);
        } else {
          if (T > 0 && C <= 0) C = safeDiv(M, T);
          else if (C > 0 && T <= 0) T = safeDiv(M, C);
        }

        return applySet(M, A, T, C);
      }
      case "ventaAnual": {
        const A = A0;
        const M = A > 0 ? Math.round(A / 12) : 0;
        let T = T0, C = C0;

        if (typed.T && !typed.C && T > 0) {
          C = safeDiv(M, T);
        } else if (typed.C && !typed.T && C > 0) {
          T = safeDiv(M, C);
        } else {
          if (T > 0 && C <= 0) C = safeDiv(M, T);
          else if (C > 0 && T <= 0) T = safeDiv(M, C);
        }

        return applySet(M, A, T, C);
      }
      case "ticket": {
        const T = T0;
        let C = C0, M = M0, A = A0;

        if (typed.C) {
          M = Math.max(0, T * C);
        } else {
          if (M > 0) C = safeDiv(M, T);
          else if (A > 0) {
            M = Math.round(A / 12);
            C = safeDiv(M, T);
          }
        }
        A = M * 12;

        return applySet(M, A, T, C);
      }
      case "clientesMensuales": {
        const C = C0;
        let T = T0, M = M0, A = A0;

        if (typed.T) {
          M = Math.max(0, T * C);
        } else {
          if (M > 0) T = safeDiv(M, C);
          else if (A > 0) {
            M = Math.round(A / 12);
            T = safeDiv(M, C);
          }
        }
        A = M * 12;

        return applySet(M, A, T, C);
      }
      default:
        return;
    }
  }

  /* ===== Autorelleno visible según plantilla (gastos/mkt/cvu) ===== */
  useEffect(() => {
    const A = derived.ventaAnual;
    const T = num(local.ticket);
    if (!A || !T) return;

    const gfMensual = Math.round((A * tpl.gf_tot) / 12);
    const mktMensual = Math.round((A * tpl.marketing) / 12);

    const C_year = derived.clientesMensuales > 0 ? derived.clientesMensuales * 12 : 0;
    const costoVarUnit =
      C_year > 0 ? Math.round((derived.cvMat + derived.cvPer) / C_year) : 0;

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
  }, [derived.ventaAnual, derived.cvMat, derived.cvPer, derived.clientesMensuales, local.ticket, tpl]);

  /* =============== Guardar y avanzar (compat ventaAnual/ventaAnio1) =============== */
  const completedCount = useMemo(() => {
    let c = 0;
    if (parseCLP(local.ventaMensual) > 0) c++;
    if (parseCLP(local.ventaAnual) > 0) c++;
    if (parseCLP(local.ticket) > 0) c++;
    if (toInt(local.clientesMensuales) > 0) c++;
    return c;
  }, [local]);

  const canContinue = completedCount >= 2;

  async function onNext() {
    if (!canContinue) {
      setErr("Completa al menos 2 de los 4 campos (Venta mensual, Venta anual, Ticket o Clientes).");
      return;
    }
    if (busy) return;
    try {
      setBusy(true);
      setErr(null);

      const inversionInicial = parseCLP(local.inversionInicial);
      const capitalTrabajo   = parseCLP(local.capitalTrabajo);

      const ventaMensualNum  = parseCLP(local.ventaMensual);
      const ventaAnualNum    = num(local.ventaAnual) > 0 ? num(local.ventaAnual) : ventaMensualNum * 12;

      const ticketNum        = parseCLP(local.ticket);
      const conv             = Math.max(0, Math.min(100, num(local.conversionPct)));

      const gfMensual        = Math.round((ventaAnualNum * tpl.gf_tot) / 12);
      const mktMensual       = Math.round((ventaAnualNum * tpl.marketing) / 12);
      const cvTot            = Math.round(ventaAnualNum * (tpl.cv_materiales + tpl.cv_personal));

      const C_local          =
        toInt(local.clientesMensuales) ||
        (ticketNum > 0 ? safeDiv(ventaMensualNum, ticketNum) : 0);
      const clientesAnuales  = C_local * 12;
      const costoVarUnit     = clientesAnuales > 0 ? Math.round(cvTot / clientesAnuales) : 0;

      const s6ForValidation = {
        inversionInicial,
        capitalTrabajo,
        ventaAnual: ventaAnualNum,
        ticket: ticketNum,
        conversionPct: conv,
        costoVarPct: 0,
        costoVarUnit,
        gastosFijosMensuales: gfMensual,
        traficoMensual: 0,
        presupuestoMarketing: mktMensual,
        marketingMensual: mktMensual,
        frecuenciaCompraMeses: num(local.frecuenciaCompraMeses) || 6,
        mesesPE: num(local.mesesPE) || 6,
      };

      const parsed = Step6Schema.safeParse(s6ForValidation);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        throw new Error(first?.message || "Revisa los campos");
      }

      const s6ToStore = {
        ...s6ForValidation,
        ventaAnio1: ventaAnualNum, // compat para vistas que aún usan la clave legacy
      };

      setStep6(s6ToStore as any);

      const legacy = toLegacyForm({ ...data, step6: s6ToStore } as any);
      localStorage.setItem("arete:legacyForm", JSON.stringify(legacy));

      router.push("/wizard/step-7");
    } catch (e: any) {
      setErr(e?.message ?? "Error al guardar");
    } finally {
      setBusy(false);
    }
  }

  /* ================= Handlers ================= */
  const onChangeVentaMensual = (raw: string) => {
    const typedNow: TypedFlags = { ...userTyped, M: raw !== "" };
    solveAndSet("ventaMensual", { M: parseCLP(raw) }, typedNow);
  };
  const onChangeVentaAnual = (raw: string) => {
    const typedNow: TypedFlags = { ...userTyped, A: raw !== "" };
    solveAndSet("ventaAnual", { A: parseCLP(raw) }, typedNow);
  };
  const onChangeTicket = (raw: string) => {
    const typedNow: TypedFlags = { ...userTyped, T: raw !== "" };
    solveAndSet("ticket", { T: parseCLP(raw) }, typedNow);
  };
  const onChangeClientes = (raw: string) => {
    const clean = onlyDigits(raw);
    const typedNow: TypedFlags = { ...userTyped, C: clean !== "" };
    solveAndSet("clientesMensuales", { C: toInt(clean) }, typedNow);
  };

  /* ================= UI ================= */
  return (
    <main className="mx-auto max-w-7xl px-3 py-8">
      <EconomicHeader
        title="Paso 6: Tu punto de partida: capital y ventas"
        sectorLabel={sectorLabel}
      />

      {/* === Marco 1: Capital === */}
      <section className="relative mx-auto mt-8 max-w-2xl rounded-xl border-2 border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5 p-6 text-center">
        <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
          ¿Cuánto dinero dispones para tu idea?
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Con este monto estimaremos tu <span className="font-medium">capital de trabajo</span> para operar
          y el restante será tu <span className="font-medium">inversión inicial</span>.
        </p>

        <div className="mt-5 flex justify-center">
          <input
            type="text"
            inputMode="numeric"
            aria-label="Monto disponible"
            placeholder="$"
            value={local.inversionInicial ?? ""}
            onChange={(e) =>
              setLocal((p) => ({ ...p, inversionInicial: formatCLPInput(e.target.value) }))
            }
            className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-lg tracking-wide shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </div>
      </section>

      {/* === Marco 2: Ventas === */}
      <section className="relative mx-auto mt-6 max-w-3xl rounded-xl border-2 border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5 p-6">
        {/* Badge contador */}
        <div className="absolute right-3 top-3" aria-live="polite">
          <Badge>{completedCount}/4 listos ✓</Badge>
        </div>

        <h2 className="text-lg md:text-xl font-semibold text-slate-900 text-center">
          Aquí necesitamos tus ventas
        </h2>
        <p className="mt-2 text-sm text-slate-600 text-center">
          Completa cualquier <span className="font-medium">2 de 4</span> y el resto lo calculamos con{" "}
          <span className="inline-flex items-center gap-1 font-medium">
            <BotIcon className="w-3.5 h-3.5" variant="t3" /> IA Aret3
          </span>.
        </p>

        {/* ¿Cómo lo calculamos? */}
        <div className="mt-3 text-center">
          <details className="inline-block">
            <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700">
              ¿Cómo lo calculamos?
            </summary>
            <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <ul className="list-disc pl-4 space-y-1 text-left">
                <li>Venta mensual (M) = <strong>Ticket (T)</strong> × <strong>Clientes/mes (C)</strong></li>
                <li>Venta anual (A) = <strong>12 × M</strong></li>
                <li>Ticket: ingreso promedio por compra de un cliente<InfoDot title="Promedio que gasta un cliente por compra." /></li>
                <li>Clientes mensuales: personas atendidas en un mes<InfoDot title="No son visitas: son clientes que compran." /></li>
              </ul>
            </div>
          </details>
        </div>

        {/* Inputs */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Venta mensual */}
          <label className="block">
            <LabelSmall>Venta Mensual</LabelSmall>
            <div className="mt-1 flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-sky-300">
              <span className="mr-2 text-slate-400">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={local.ventaMensual ?? ""}
                onChange={(e) => onChangeVentaMensual(e.target.value)}
                className="w-full bg-transparent outline-none"
                aria-describedby="venta-m-help"
              />
              <span className="ml-2 text-slate-400 text-xs">/mes</span>
            </div>
            <p id="venta-m-help" className="mt-1 text-[11px] text-slate-500">
              Puedes estimarla con la calculadora inferior si no la conoces.
            </p>

            {/* Calculadora “No lo sé” */}
            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] text-sky-700 hover:underline">
                No lo sé, ayúdame a estimarlo
              </summary>
              <VentaMensualEstimator
                ticketStr={local.ticket ?? ""}
                clientesStr={local.clientesMensuales ?? ""}
                onApply={(M) => onChangeVentaMensual(String(M))}
              />
            </details>
          </label>

          {/* Venta anual */}
          <label className="block">
            <LabelSmall>Venta Anual</LabelSmall>
            <div className="mt-1 flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-sky-300">
              <span className="mr-2 text-slate-400">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={local.ventaAnual ?? ""}
                onChange={(e) => onChangeVentaAnual(e.target.value)}
                className="w-full bg-transparent outline-none"
                aria-describedby="venta-a-help"
              />
              <span className="ml-2 text-slate-400 text-xs">/año</span>
            </div>
            <p id="venta-a-help" className="mt-1 text-[11px] text-slate-500">
              Si conoces la venta anual, la mensual se completa sola.
            </p>

            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] text-sky-700 hover:underline">
                No lo sé, ayúdame a estimarlo
              </summary>
              <VentaAnualEstimator
                ventaMensualStr={local.ventaMensual ?? ""}
                onApply={(A) => onChangeVentaAnual(String(A))}
              />
            </details>
          </label>

          {/* Ticket */}
          <label className="block">
            <div className="flex items-center">
              <LabelSmall>Ticket / Ingreso promedio por cliente</LabelSmall>
              <InfoDot title="Promedio que gasta un cliente por compra." />
              <LockToggle
                locked={lockT}
                onToggle={() => setLockT((v) => !v)}
                label="Ticket"
              />
            </div>
            <div className="mt-1 flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-sky-300">
              <span className="mr-2 text-slate-400">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={local.ticket ?? ""}
                onChange={(e) => onChangeTicket(e.target.value)}
                className="w-full bg-transparent outline-none"
              />
            </div>

            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] text-sky-700 hover:underline">
                No lo sé, ayúdame a estimarlo
              </summary>
              <TicketEstimator
                onApply={(T) => onChangeTicket(String(T))}
              />
            </details>
          </label>

          {/* Clientes */}
          <label className="block">
            <div className="flex items-center">
              <LabelSmall>Clientes mensuales (cantidad)</LabelSmall>
              <InfoDot title="Personas que compran en un mes." />
              <LockToggle
                locked={lockC}
                onToggle={() => setLockC((v) => !v)}
                label="Clientes"
              />
            </div>
            <div className="mt-1 flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-sky-300">
              <input
                type="text"
                inputMode="numeric"
                value={local.clientesMensuales ?? ""}
                onChange={(e) => onChangeClientes(e.target.value)}
                className="w-full bg-transparent outline-none"
                placeholder="Ej: 2000"
              />
              <span className="ml-2 text-slate-400 text-xs">personas/mes</span>
            </div>

            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] text-sky-700 hover:underline">
                No lo sé, ayúdame a estimarlo
              </summary>
              <ClientesEstimator
                onApply={(C) => onChangeClientes(String(C))}
              />
            </details>
          </label>
        </div>

        {/* KPIs rápidos */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-slate-200 bg-white shadow px-3 py-2 text-center">
            <div className="text-slate-500">Clientes anuales</div>
            <div className="font-semibold">{fmtCL(derived.clientesAnuales)}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white shadow px-3 py-2 text-center">
            <div className="text-slate-500">Clientes mensuales</div>
            <div className="font-semibold">{fmtCL(derived.clientesMensuales)}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white shadow px-3 py-2 text-center">
            <div className="text-slate-500">Costo variable unitario</div>
            <div className="font-semibold">${fmtCL(derived.costoVarUnitario)}</div>
          </div>
        </div>
      </section>

      {err && <p className="text-sm text-red-600 mt-4 text-center">{err}</p>}

      <div className="mt-6 flex items-center justify-between max-w-3xl mx-auto">
        <PrevButton href="/wizard/step-5" />
       {/* Wrapper para aspecto de deshabilitado sin pasar 'disabled' al NextButton */}
      <div className={canContinue ? "opacity-100" : "opacity-50 pointer-events-none"}>
        <NextButton onClick={onNext} />
      </div>
     </div>

      <div className="max-w-3xl mx-auto">
        <UpsellBanner />
      </div>

      <p className="mt-4 text-xs text-slate-500 text-center">
              Nota: la generación con{" "}
              <span className="inline-flex items-center gap-1 font-medium">
                <BotIcon className="w-3.5 h-3.5" variant="t3" /> IA Aret3
              </span>{" "}
              se hará al final, en el Informe.
            </p>
    </main>
  );
}

/* =================== Mini-calculadoras =================== */

// Ticket = precio promedio * (1 - descuento%)
function TicketEstimator({ onApply }: { onApply: (ticketCLP: number) => void }) {
  const [precio, setPrecio] = useState<string>("");
  const [desc, setDesc] = useState<string>("0");

  const calc = () => {
    const p = parseCLP(precio);
    const d = Math.min(100, Math.max(0, Number(desc) || 0));
    const t = Math.round(p * (1 - d / 100));
    onApply(t);
  };

  return (
    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
      <div>
        <div className="text-slate-600 mb-1">Precio promedio</div>
        <input
          value={precio}
          onChange={(e) => setPrecio(formatCLPInput(e.target.value))}
          className="w-full rounded border border-slate-300 px-2 py-1"
          placeholder="$"
        />
      </div>
      <div>
        <div className="text-slate-600 mb-1">% descuento medio</div>
        <input
          value={desc}
          onChange={(e) => setDesc(onlyDigits(e.target.value))}
          className="w-full rounded border border-slate-300 px-2 py-1"
          placeholder="0"
        />
      </div>
      <div className="col-span-2">
        <button
          type="button"
          onClick={calc}
          className="mt-2 w-full rounded bg-sky-600 px-3 py-1.5 text-white text-[11px] hover:bg-sky-700"
        >
          Aplicar como Ticket
        </button>
      </div>
    </div>
  );
}

// Clientes = aforo × horas pico × días/mes
function ClientesEstimator({ onApply }: { onApply: (clientes: number) => void }) {
  const [aforo, setAforo] = useState<string>("");
  const [horas, setHoras] = useState<string>("");
  const [dias, setDias] = useState<string>("26");

  const calc = () => {
    const c =
      (Number(onlyDigits(aforo)) || 0) *
      (Number(onlyDigits(horas)) || 0) *
      (Number(onlyDigits(dias)) || 0);
    onApply(Math.max(0, Math.round(c)));
  };

  return (
    <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
      <div>
        <div className="text-slate-600 mb-1">Aforo (personas)</div>
        <input
          value={aforo}
          onChange={(e) => setAforo(onlyDigits(e.target.value))}
          className="w-full rounded border border-slate-300 px-2 py-1"
          placeholder="Ej: 20"
        />
      </div>
      <div>
        <div className="text-slate-600 mb-1">Horas pico/día</div>
        <input
          value={horas}
          onChange={(e) => setHoras(onlyDigits(e.target.value))}
          className="w-full rounded border border-slate-300 px-2 py-1"
          placeholder="Ej: 4"
        />
      </div>
      <div>
        <div className="text-slate-600 mb-1">Días/mes</div>
        <input
          value={dias}
          onChange={(e) => setDias(onlyDigits(e.target.value))}
          className="w-full rounded border border-slate-300 px-2 py-1"
          placeholder="26"
        />
      </div>
      <div className="col-span-3">
        <button
          type="button"
          onClick={calc}
          className="mt-2 w-full rounded bg-sky-600 px-3 py-1.5 text-white text-[11px] hover:bg-sky-700"
        >
          Aplicar como Clientes
        </button>
      </div>
    </div>
  );
}

// Venta mensual = ticket × clientes
function VentaMensualEstimator({
  ticketStr,
  clientesStr,
  onApply,
}: {
  ticketStr: string;
  clientesStr: string;
  onApply: (ventaMensual: number) => void;
}) {
  const [t, setT] = useState<string>(ticketStr || "");
  const [c, setC] = useState<string>(clientesStr || "");

  const calc = () => {
    const M = parseCLP(t) * (Number(onlyDigits(c)) || 0);
    onApply(Math.max(0, Math.round(M)));
  };

  return (
    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
      <div>
        <div className="text-slate-600 mb-1">Ticket ($)</div>
        <input
          value={t}
          onChange={(e) => setT(formatCLPInput(e.target.value))}
          className="w-full rounded border border-slate-300 px-2 py-1"
          placeholder="$"
        />
      </div>
      <div>
        <div className="text-slate-600 mb-1">Clientes/mes</div>
        <input
          value={c}
          onChange={(e) => setC(onlyDigits(e.target.value))}
          className="w-full rounded border border-slate-300 px-2 py-1"
          placeholder="Ej: 2000"
        />
      </div>
      <div className="col-span-2">
        <button
          type="button"
          onClick={calc}
          className="mt-2 w-full rounded bg-sky-600 px-3 py-1.5 text-white text-[11px] hover:bg-sky-700"
        >
          Aplicar como Venta mensual
        </button>
      </div>
    </div>
  );
}

// Venta anual = venta mensual × meses operativos
function VentaAnualEstimator({
  ventaMensualStr,
  onApply,
}: {
  ventaMensualStr: string;
  onApply: (ventaAnual: number) => void;
}) {
  const [m, setM] = useState<string>(ventaMensualStr || "");
  const [meses, setMeses] = useState<string>("12");

  const calc = () => {
    const A = parseCLP(m) * (Number(onlyDigits(meses)) || 0);
    onApply(Math.max(0, Math.round(A)));
  };

  return (
    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
      <div>
        <div className="text-slate-600 mb-1">Venta mensual ($)</div>
        <input
          value={m}
          onChange={(e) => setM(formatCLPInput(e.target.value))}
          className="w-full rounded border border-slate-300 px-2 py-1"
          placeholder="$"
        />
      </div>
      <div>
        <div className="text-slate-600 mb-1">Meses operativos</div>
        <input
          value={meses}
          onChange={(e) => setMeses(onlyDigits(e.target.value))}
          className="w-full rounded border border-slate-300 px-2 py-1"
          placeholder="12"
        />
      </div>
      <div className="col-span-2">
        <button
          type="button"
          onClick={calc}
          className="mt-2 w-full rounded bg-sky-600 px-3 py-1.5 text-white text-[11px] hover:bg-sky-700"
        >
          Aplicar como Venta anual
        </button>
      </div>
    </div>
  );
}
