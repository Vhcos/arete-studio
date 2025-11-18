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
import EconomicHeader from "@/components/wizard/EconomicHeader";
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

/* ====== UI helpers ====== */
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
function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
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
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={locked ? "text-sky-600" : "text-slate-400"}>
        {locked ? (
          <path d="M7 10V8a5 5 0 1 1 10 0v2M6 10h12v10H6V10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M17 10V8a5 5 0 1 0-10 0v2M6 10h12v10H6V10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
  ventaAnual?: string; // CLP
  ticket?: string; // CLP por cliente
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

  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [aiExplain, setAiExplain] = useState<string>("");
  const [aiSources, setAiSources] = useState<{ title?: string; url: string }[]>([]);
  const [flashIA, setFlashIA] = useState(false); // destello visual tras aplicar IA

  // Locks
  const [lockT, setLockT] = useState(false);
  const [lockC, setLockC] = useState(false);

  // Prefill venta anual/mensual
  const anualPrev = (data as any)?.step6?.ventaAnual ?? (data as any)?.step6?.ventaAnio1 ?? 0;
  const mensualPrev = anualPrev ? Math.round(anualPrev / 12) : 0;

  const [local, setLocal] = useState<Local>({
    inversionInicial: formatCLPInput((data as any)?.step6?.inversionInicial ?? 0),
    capitalTrabajo: formatCLPInput((data as any)?.step6?.capitalTrabajo ?? 0),
    ventaMensual: formatCLPInput(mensualPrev),
    ventaAnual: formatCLPInput(anualPrev),
    ticket: formatCLPInput((data as any)?.step6?.ticket ?? 0),
    clientesMensuales: "",
    gastosFijosMensuales: formatCLPInput((data as any)?.step6?.gastosFijosMensuales ?? 0),
    presupuestoMarketing: formatCLPInput((data as any)?.step6?.presupuestoMarketing ?? 0),
    costoVarUnit: formatCLPInput((data as any)?.step6?.costoVarUnit ?? 0),
    conversionPct: (data as any)?.step6?.conversionPct ?? 0,
    frecuenciaCompraMeses: (data as any)?.step6?.frecuenciaCompraMeses ?? 6,
    mesesPE: (data as any)?.step6?.mesesPE ?? 6,
  });

  /* ============ Sector / Plantilla ============ */
  const sector: SectorId = ((data as any)?.step2?.sectorId as SectorId) ?? ("retail_local" as SectorId);
  const tpl = getTemplateForSector(sector);
  const sectorInfo = SECTORS.find((s) => s.id === sector);
  const sectorLabel = sectorInfo?.label ?? sector;

  /* ============ Derivados (KPIs) ============ */
  const derived = useMemo(() => {
    const M = num(local.ventaMensual) > 0 ? num(local.ventaMensual) : Math.round(num(local.ventaAnual) / 12);
    const A = num(local.ventaAnual) > 0 ? num(local.ventaAnual) : M * 12;
    const T = num(local.ticket);
    const C_input = toInt(local.clientesMensuales);
    const C = C_input > 0 ? C_input : T > 0 ? safeDiv(M, T) : 0;
    const C_year = C * 12;

    const cvMat = Math.round(A * tpl.cv_materiales);
    const cvPer = Math.round(A * tpl.cv_personal);
    const costoVarUnitario = C_year > 0 ? Math.round((cvMat + cvPer) / C_year) : 0;

    return { ventaMensual: M, ventaAnual: A, clientesMensuales: C, clientesAnuales: C_year, cvMat, cvPer, costoVarUnitario };
  }, [local, tpl]);

  /* ======== Solver ======== */
  function solveAndSet(
    source: EditedKey,
    values: Partial<{ M: number; A: number; T: number; C: number }>,
    typedNow?: Partial<TypedFlags>
  ) {
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

        if (typed.T && !typed.C && T > 0) C = safeDiv(M, T);
        else if (typed.C && !typed.T && C > 0) T = safeDiv(M, C);
        else {
          if (T > 0 && C <= 0) C = safeDiv(M, T);
          else if (C > 0 && T <= 0) T = safeDiv(M, C);
        }
        return applySet(M, A, T, C);
      }
      case "ventaAnual": {
        const A = A0;
        const M = A > 0 ? Math.round(A / 12) : 0;
        let T = T0,
          C = C0;

        if (typed.T && !typed.C && T > 0) C = safeDiv(M, T);
        else if (typed.C && !typed.T && C > 0) T = safeDiv(M, C);
        else {
          if (T > 0 && C <= 0) C = safeDiv(M, T);
          else if (C > 0 && T <= 0) T = safeDiv(M, C);
        }
        return applySet(M, A, T, C);
      }
      case "ticket": {
        const T = T0;
        let C = C0,
          M = M0,
          A = A0;

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
        let T = T0,
          M = M0,
          A = A0;

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

  /* ===== Autorelleno por plantilla ===== */
  useEffect(() => {
    const A = derived.ventaAnual;
    const T = num(local.ticket);
    if (!A || !T) return;

    const gfMensual = Math.round((A * tpl.gf_tot) / 12);
    const mktMensual = Math.round((A * tpl.marketing) / 12);

    const C_year = derived.clientesMensuales > 0 ? derived.clientesMensuales * 12 : 0;
    const costoVarUnit = C_year > 0 ? Math.round((derived.cvMat + derived.cvPer) / C_year) : 0;

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

  /* =============== Guardar y avanzar =============== */
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
      const capitalTrabajo = parseCLP(local.capitalTrabajo);

      const ventaMensualNum = parseCLP(local.ventaMensual);
      const ventaAnualNum = num(local.ventaAnual) > 0 ? num(local.ventaAnual) : ventaMensualNum * 12;

      const ticketNum = parseCLP(local.ticket);
      const conv = Math.max(0, Math.min(100, num(local.conversionPct)));

      const gfMensual = Math.round((ventaAnualNum * tpl.gf_tot) / 12);
      const mktMensual = Math.round((ventaAnualNum * tpl.marketing) / 12);
      const cvTot = Math.round(ventaAnualNum * (tpl.cv_materiales + tpl.cv_personal));

      const C_local = toInt(local.clientesMensuales) || (ticketNum > 0 ? safeDiv(ventaMensualNum, ticketNum) : 0);
      const clientesAnuales = C_local * 12;
      const costoVarUnit = clientesAnuales > 0 ? Math.round(cvTot / clientesAnuales) : 0;

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
        ventaAnio1: ventaAnualNum,
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

  /* ====== Aplicar IA de forma atómica (T & C → M y A) ====== */
  function applyIAEstimate(ticketCLP?: number, clientesMes?: number) {
    const T = !lockT && ticketCLP && ticketCLP > 0 ? Math.round(ticketCLP) : parseCLP(local.ticket);
    const C = !lockC && clientesMes && clientesMes > 0 ? Math.round(clientesMes) : toInt(local.clientesMensuales);

    // Si tenemos ambos, calculamos M y A directamente
    const M = T > 0 && C > 0 ? T * C : parseCLP(local.ventaMensual) || Math.round(parseCLP(local.ventaAnual) / 12);
    const A = M > 0 ? M * 12 : parseCLP(local.ventaAnual);

    setLocal((p) => ({
      ...p,
      ticket: T > 0 ? formatCLPInput(T) : p.ticket ?? "",
      clientesMensuales: C > 0 ? String(C) : p.clientesMensuales ?? "",
      ventaMensual: M > 0 ? formatCLPInput(M) : p.ventaMensual ?? "",
      ventaAnual: A > 0 ? formatCLPInput(A) : p.ventaAnual ?? "",
    }));
    setUserTyped({ M: true, A: true, T: true, C: true });

    // destello breve en el recuadro de ventas
    setFlashIA(true);
    window.setTimeout(() => setFlashIA(false), 900);
  }

  /* ================= IA Suggest ================= */
  async function onSuggestIA() {
    if (aiBusy) return;
    setAiBusy(true);
    setAiErr(null);
    setAiExplain("");
    setAiSources([]);

    try {
      const idea =
        (data as any)?.step1?.idea ||
        (data as any)?.step2?.idea ||
        "";
      const ubicacion =
        (data as any)?.step1?.ubicacion ||
        (data as any)?.step3?.ubicacion ||
        "Chile";

      const r = await fetch("/api/ai/step6-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea,
          rubro: sectorLabel,
          ubicacion,
          country: "CL",
        }),
      });

      // <--- SOLO MENSAJE, SIN POPUP y SIN “IA:” dentro del estado
    if (!r.ok) {
      setAiErr(
        `Créditos insuficientes revisa nuestros planes y adquiere más créditos (${r.status})`
      );
      return;
    }

    const j = await r.json().catch(() => ({}));
    if (!j?.ok) {
      setAiErr(
        `Créditos insuficientes revisa nuestros planes y adquiere más créditos (500)`
      );
      return;
    }

      // Aplica T & C y calcula M y A
      applyIAEstimate(Number(j.ticket_clp) || 0, Number(j.clientes_mensuales) || 0);

      setAiExplain(j.explicacion || "");
      setAiSources(Array.isArray(j.fuentes) ? j.fuentes.slice(0, 3) : []);

      // 💳 MISMO PATRÓN QUE STEP-2/4: refresca créditos por "focus"
      try { window.dispatchEvent(new Event("focus")); } catch {}
    } catch (e: any) {
      setAiErr(e?.message || "No se pudo estimar con IA.");
    } finally {
      setAiBusy(false);
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
      <EconomicHeader title="Paso 6: Tu punto de partida: capital y ventas" sectorLabel={sectorLabel} />

      {/* === Marco 1: Capital === */}
      <section className="relative mx-auto mt-8 max-w-2xl rounded-xl border-2 border-slate-200 bg-white p-6 text-center shadow-xl ring-1 ring-slate-900/5">
        <h2 className="text-xl md:text-2xl font-semibold text-slate-900">¿Cuánto dinero dispones para tu idea?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Con este monto estimaremos tu <span className="font-medium">capital de trabajo</span> para operar y sabrás 
          el disponible para <span className="font-medium">inversión inicial</span>.
        </p>

        <div className="mt-5 flex justify-center">
          <input
            type="text"
            inputMode="numeric"
            aria-label="Monto disponible"
            placeholder="$"
            value={local.inversionInicial ?? ""}
            onChange={(e) => setLocal((p) => ({ ...p, inversionInicial: formatCLPInput(e.target.value) }))}
            className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-lg tracking-wide shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </div>
      </section>

      {/* === Marco 2: Ventas === */}
      <section
        className={[
          "relative mx-auto mt-6 max-w-3xl rounded-xl border-2 border-slate-200 bg-white p-6 shadow-xl ring-1 ring-slate-900/5 transition",
          "ring-2 ring-blue-300", // destello suave; puedes cambiar a amber si quieres dorado
          flashIA ? "animate-pulse" : "",
        ].join(" ")}
        aria-live="polite"
      >
        {/* Badge contador */}
        <div className="absolute right-3 top-3">
          <Badge>{completedCount}/4 listos ✓</Badge>
        </div>

        <h2 className="text-lg md:text-xl font-semibold text-slate-900 text-center">Sino  sabes tus ventas “Estimar Con IA”</h2>
        <p className="mt-2 text-sm text-slate-600 text-center">
          “¿No tienes tus ventas claras? Haz clic en <span className="font-medium">‘Estimar con IA’</span>y la aplicación las calcula por ti, en segundos.” sí necesitas ayuda aplica{" "}
          <span className="inline-flex items-center gap-1 font-medium">
            <BotIcon className="h-4 w-4" variant="t3"  glowHue="gold" /> 
          </span>.
        </p>

        {/* Controles superiores */}
        <div className="mt-3 flex flex-col items-center justify-center gap-2 sm:flex-row sm:justify-between">
          <details className="inline-block">
            <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700">¿Cómo lo calculamos las ventas con IA en Aret3?</summary>
            <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <ul className="list-disc space-y-1 pl-4 text-left">
                <li>
                  Así estima las ventas <strong>Aret3 con IA</strong>: toma tu idea, rubro y ubicación, busca referencias recientes
                   (precios promedio, aforos, rotación y casos de competidores). 
                   
                </li>
                <li>
                  Con esos datos infiere un <strong>ticket promedio (T) y clientes mensuales (C) </strong>
                   . Luego aplica la relación base Venta mensual (M) = T × C y Venta anual (A) = 12 × M. 
                </li>
                <li>
                  Ajusta con <strong>plantillas del sector </strong>(costos variables y fijos típicos) y señales locales (demanda, estacionalidad 
                   y tamaño de mercado) para entregar <strong>rangos plausibles</strong> y una breve explicación con fuentes. 
                  <InfoDot title="Promedio que gasta un cliente por compra." />
                </li>
                <li>
                  Los valores se redondean y sirven como punto de partida; debes validarlos con tus datos reales.
                  <InfoDot title="No son visitas: son clientes que compran." />
                </li>
              </ul>
            </div>
          </details>

          {/* Botón IA */}
          <button
            type="button"
            onClick={onSuggestIA}
            disabled={aiBusy}
            aria-busy={aiBusy}
            className={[
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm transition",
              "border-blue-300 bg-blue-100 text-blue-700 hover:border-blue-400 hover:bg-blue-200 hover:text-blue-800",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            ].join(" ")}
            title="Estimar Ticket y Clientes con IA (consume 1 crédito)"
          >
            {aiBusy ? <Spinner /> : <BotIcon className="h-8 w-8" variant="t3" glowHue="gold" />}
            Estimar con IA
          </button>
        </div>

        {/* Inputs */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <span className="ml-2 text-xs text-slate-400">/mes</span>
            </div>
            <p id="venta-m-help" className="mt-1 text-[11px] text-slate-500">
              Puedes estimarla con la calculadora inferior si no la conoces.
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] text-sky-700 hover:underline">No lo sé, ayúdame a estimarlo</summary>
              <VentaMensualEstimator ticketStr={local.ticket ?? ""} clientesStr={local.clientesMensuales ?? ""} onApply={(M) => onChangeVentaMensual(String(M))} />
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
              <span className="ml-2 text-xs text-slate-400">/año</span>
            </div>
            <p id="venta-a-help" className="mt-1 text-[11px] text-slate-500">Si conoces la venta anual, la mensual se completa sola.</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] text-sky-700 hover:underline">No lo sé, ayúdame a estimarlo</summary>
              <VentaAnualEstimator ventaMensualStr={local.ventaMensual ?? ""} onApply={(A) => onChangeVentaAnual(String(A))} />
            </details>
          </label>

          {/* Ticket */}
          <label className="block">
            <div className="flex items-center">
              <LabelSmall>Ticket / Ingreso promedio por cliente</LabelSmall>
              <InfoDot title="Promedio que gasta un cliente por compra." />
              <LockToggle locked={lockT} onToggle={() => setLockT((v) => !v)} label="Ticket" />
            </div>
            <div className="mt-1 flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-sky-300">
              <span className="mr-2 text-slate-400">$</span>
              <input type="text" inputMode="numeric" value={local.ticket ?? ""} onChange={(e) => onChangeTicket(e.target.value)} className="w-full bg-transparent outline-none" />
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] text-sky-700 hover:underline">No lo sé, ayúdame a estimarlo</summary>
              <TicketEstimator onApply={(T) => onChangeTicket(String(T))} />
            </details>
          </label>

          {/* Clientes */}
          <label className="block">
            <div className="flex items-center">
              <LabelSmall>Clientes mensuales (cantidad)</LabelSmall>
              <InfoDot title="Personas que compran en un mes." />
              <LockToggle locked={lockC} onToggle={() => setLockC((v) => !v)} label="Clientes" />
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
              <span className="ml-2 text-xs text-slate-400">personas/mes</span>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] text-sky-700 hover:underline">No lo sé, ayúdame a estimarlo</summary>
              <ClientesEstimator onApply={(C) => onChangeClientes(String(C))} />
            </details>
          </label>
        </div>

        {/* KPIs rápidos */}
        <div className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow">
            <div className="text-slate-500">Clientes anuales</div>
            <div className="font-semibold">{fmtCL(derived.clientesAnuales)}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow">
            <div className="text-slate-500">Clientes mensuales</div>
            <div className="font-semibold">{fmtCL(derived.clientesMensuales)}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow">
            <div className="text-slate-500">Costo variable unitario</div>
            <div className="font-semibold">${fmtCL(derived.costoVarUnitario)}</div>
          </div>
        </div>

        {/* Resultado IA / Fuentes + Disclaimer */}
        {(aiErr || aiSources.length > 0 || aiExplain) && (
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            {aiErr ? (
              <p className="text-rose-600">IA: {aiErr}</p>
            ) : (
              <>
                <p className="mb-2 text-[11px] text-slate-500">
                  <strong>Nota:</strong> esta es una <em>estimación orientativa</em> según fuentes públicas para {sectorLabel}. 
                  Debe ser corroborada con tus datos reales (precios, aforo, rotación y demanda local).
                </p>
                {aiExplain && <p className="mb-2">{aiExplain}</p>}
                {aiSources.length > 0 && (
                  <>
                    <div className="mb-1 font-medium text-slate-700">Fuentes</div>
                    <ul className="list-disc pl-5">
                      {aiSources.map((s, i) => (
                        <li key={i} className="truncate">
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline">
                            {s.title || s.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {err && <p className="mt-4 text-center text-sm text-rose-600">{err}</p>}

      <div className="mx-auto mt-6 flex max-w-3xl items-center justify-between">
        <PrevButton href="/wizard/step-5" />
        <div className={canContinue ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-50"}>
          <NextButton onClick={onNext} label="¡Vamos al siguiente paso!" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl">
        <UpsellBanner />
      </div>

      {/* Aviso de créditos, igual que Step-2/4 */}
      <p className="mt-4 text-xs text-slate-500 text-center">
        Nota: Aplicar{" "}
        <span className="inline-flex items-center gap-1 font-medium">
          <BotIcon className="w-3.5 h-3.5" variant="t3" glowHue="gold" /> IA Aret3
        </span>{" "}
         para las ventas resta 1 crédito.
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
    <div className="mt-2 grid grid-cols-2 gap-2 text:[11px]">
      <div>
        <div className="mb-1 text-slate-600">Precio promedio</div>
        <input value={precio} onChange={(e) => setPrecio(formatCLPInput(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1" placeholder="$" />
      </div>
      <div>
        <div className="mb-1 text-slate-600">% descuento medio</div>
        <input value={desc} onChange={(e) => setDesc(onlyDigits(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1" placeholder="0" />
      </div>
      <div className="col-span-2">
        <button type="button" onClick={calc} className="mt-2 w-full rounded bg-sky-600 px-3 py-1.5 text-[11px] text-white hover:bg-sky-700">
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
    const c = (Number(onlyDigits(aforo)) || 0) * (Number(onlyDigits(horas)) || 0) * (Number(onlyDigits(dias)) || 0);
    onApply(Math.max(0, Math.round(c)));
  };

  return (
    <div className="mt-2 grid grid-cols-3 gap-2 text:[11px]">
      <div>
        <div className="mb-1 text-slate-600">Aforo (personas)</div>
        <input value={aforo} onChange={(e) => setAforo(onlyDigits(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1" placeholder="Ej: 20" />
      </div>
      <div>
        <div className="mb-1 text-slate-600">Horas pico/día</div>
        <input value={horas} onChange={(e) => setHoras(onlyDigits(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1" placeholder="Ej: 4" />
      </div>
      <div>
        <div className="mb-1 text-slate-600">Días/mes</div>
        <input value={dias} onChange={(e) => setDias(onlyDigits(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1" placeholder="26" />
      </div>
      <div className="col-span-3">
        <button type="button" onClick={calc} className="mt-2 w-full rounded bg-sky-600 px-3 py-1.5 text-[11px] text-white hover:bg-sky-700">
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
        <div className="mb-1 text-slate-600">Ticket ($)</div>
        <input value={t} onChange={(e) => setT(formatCLPInput(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1" placeholder="$" />
      </div>
      <div>
        <div className="mb-1 text-slate-600">Clientes/mes</div>
        <input value={c} onChange={(e) => setC(onlyDigits(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1" placeholder="Ej: 2000" />
      </div>
      <div className="col-span-2">
        <button type="button" onClick={calc} className="mt-2 w-full rounded bg-sky-600 px-3 py-1.5 text-[11px] text-white hover:bg-sky-700">
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
        <div className="mb-1 text-slate-600">Venta mensual ($)</div>
        <input value={m} onChange={(e) => setM(formatCLPInput(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1" placeholder="$" />
      </div>
      <div>
        <div className="mb-1 text-slate-600">Meses operativos</div>
        <input value={meses} onChange={(e) => setMeses(onlyDigits(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1" placeholder="12" />
      </div>
      <div className="col-span-2">
        <button type="button" onClick={calc} className="mt-2 w-full rounded bg-sky-600 px-3 py-1.5 text-[11px] text-white hover:bg-sky-700">
          Aplicar como Venta anual
        </button>
      </div>
    </div>
  );
}
