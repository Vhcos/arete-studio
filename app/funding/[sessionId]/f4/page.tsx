//app/funding/[sessionId]/f4/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import BotIcon from "@/components/icons/BotIcon";

/**
 * F4 — Impacto y resultados esperados
 * - 4 indicadores fijos (económicos) por ahora (el 5° lo definimos después con investigación)
 * - Base desde legacyForm.plan (principal) + fallback a step6
 * - Meta 6 meses sugerida SIN inventar: basada en punto de equilibrio (break-even)
 * - Narrativa de impacto: botón IA (1 crédito)
 */

const AI_FUNDING_IMPACT_ENDPOINT =
  process.env.NEXT_PUBLIC_AI_FUNDING_IMPACT_ENDPOINT ??
  "/api/ai/funding-impact-improve";

/* ---------- Tipos amplios (no romper) ---------- */
type PlanPreview = {
  // lo que vimos real en tu localStorage:
  inversionInicial?: number;
  capitalTrabajo?: number;

  ventaAnual?: number;
  ventaMensual?: number;

  ticket?: number;

  // costo variable unitario (tu plan usa costoUnit)
  costoUnit?: number;
  costoVarUnit?: number;
  costoVarPct?: number;

  // gastos fijos (tu plan usa gastosFijos ANUAL)
  gastosFijos?: number;
  gastosFijosMensuales?: number;
  gastosFijosMensual?: number;

  // marketing (tu plan usa marketingMensual)
  marketingMensual?: number;
  presupuestoMarketing?: number;

  // opcionales
  clientesMensuales?: number;
  traficoMensual?: number;
  convPct?: number;
  mesesPE?: number;

  sectorId?: string;
  [key: string]: any;
};

type LegacyForm = {
  projectName?: string;
  idea?: string;
  ventajaTexto?: string;
  sectorId?: string;
  ubicacion?: string;
  plan?: PlanPreview | null;
  step6?: any;
  data?: any;
  [key: string]: any;
};

type AiContext = {
  projectName?: string;
  idea?: string;
  ventajaTexto?: string;
  sectorId?: string;
  ubicacion?: string;
  plan?: PlanPreview | null;
};

/* ---------- Local storage helpers ---------- */
function readJSON<T = any>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
function writeJSON(key: string, value: any) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/* ---------- Parsing / formatting ---------- */
function toNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
function pickFirstNumber(...vals: any[]): number | null {
  for (const v of vals) {
    const n = toNumber(v);
    if (typeof n === "number" && Number.isFinite(n)) return n;
  }
  return null;
}
function parseMoneyInputToInt(value: string): number | null {
  const digitsOnly = (value ?? "").replace(/\D/g, "");
  if (!digitsOnly) return null;
  const num = parseInt(digitsOnly, 10);
  return Number.isNaN(num) ? null : num;
}
function fmtCLP(n: number | null | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "0";
  return Math.round(n).toLocaleString("es-CL");
}
function fmtPct(n: number | null | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "";
  const x = Math.round(n * 10) / 10;
  return String(x);
}
function ceilPos(x: number): number {
  if (!Number.isFinite(x) || x <= 0) return 0;
  return Math.ceil(x);
}
function clampPct(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

/* ---------- Spinner mínimo ---------- */
function Spinner({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/* ---------- Persistencia F4 ---------- */
type F4Draft = {
  metaVentasMensuales?: string; // $/mes
  metaClientesMensuales?: string; // clientes/mes
  metaMargenBrutoPct?: string; // %
  metaResultadoMensual?: string; // $/mes
  impactoNarrativa?: string;
  updatedAt?: number;
};

function f4StorageKey(sessionId: string) {
  return `aret3:funding:f4:${sessionId}`;
}

/* ---------- Derivación desde legacy (plan primero) ---------- */
type Derived = {
  projectName?: string;
  idea?: string;
  ubicacion?: string;
  sectorId?: string;

  ventaAnual: number;
  ventaMensual: number;

  ticket: number;
  costoVarUnit: number;

  // mensual (muy importante: mapear bien gastosFijos del plan que viene anual)
  gastosFijosMensuales: number;
  marketingMensual: number;

  clientesMensuales: number | null;

  margenBrutoPct: number | null;
  resultadoMensual: number | null;

  // break-even mensual (coherente con Step-9: mc - (fijos + marketing))
  beClientes: number | null;
  beVentas: number | null;

  // debug/extra
  mesesPE?: number | null;
  capitalTrabajo?: number | null;
  _sources?: Record<string, any>;
};

function deriveCostoUnit(ticket: number, costoVarPct?: number | null, costoVarUnit?: number | null) {
  const price = Math.max(0, ticket || 0);
  const u = typeof costoVarUnit === "number" && costoVarUnit > 0 ? Math.min(costoVarUnit, price) : null;
  if (u != null) return u;

  const p =
    typeof costoVarPct === "number" && costoVarPct > 0 && price > 0
      ? Math.min((price * costoVarPct) / 100, price)
      : 0;
  return p;
}
const calcMcUnit = (ticket: number, costoUnit: number) => Math.max(ticket - costoUnit, 0);

function deriveFromLegacy(legacy: LegacyForm | null): Derived | null {
  if (!legacy) return null;

  const plan: PlanPreview | null = legacy.plan ?? null;
  const s6: any = legacy.step6 ?? legacy.data?.step6 ?? {};

  // Ventas
  const ventaAnual =
    pickFirstNumber(
      plan?.ventaAnual,
      s6.ventaAnual,
      s6.ventaAnio1,
      s6.ventaAnio,
      s6.ventasAnuales
    ) ?? 0;

  const ventaMensual =
    pickFirstNumber(plan?.ventaMensual, s6.ventaMensual) ??
    (ventaAnual > 0 ? Math.round(ventaAnual / 12) : 0);

  // Ticket (plan.ticket es real en tu localStorage)
  const ticket =
    Math.max(
      0,
      pickFirstNumber(
        plan?.ticket,
        s6.ticket,
        s6.precioPromedio,
        s6.precioUnitario,
        s6.precio
      ) ?? 0
    );

  // Costo variable unitario: tu plan usa costoUnit (IMPORTANTE)
  const costoVarUnitRaw =
    pickFirstNumber(
      plan?.costoUnit,
      plan?.costoVarUnit,
      s6.costoVarUnit,
      s6.costoUnit,
      s6.costoVariableUnitario
    ) ?? 0;

  const costoVarPct =
    pickFirstNumber(
      plan?.costoVarPct,
      s6.costoVarPct,
      s6.costoVariablePct
    ) ?? 0;

  const costoVarUnit = Math.max(0, Math.round(deriveCostoUnit(ticket, costoVarPct, costoVarUnitRaw)));

  // Gastos fijos mensuales:
  // - si viene mensual, lo usamos
  // - si viene anual (plan.gastosFijos, como en tu caso), lo pasamos a mensual dividiendo por 12
  const gastosFijosMensuales =
    Math.max(
      0,
      Math.round(
        pickFirstNumber(
          s6.gastosFijosMensuales,
          plan?.gastosFijosMensuales,
          plan?.gastosFijosMensual
        ) ??
          (pickFirstNumber(plan?.gastosFijos, s6.gastosFijos) != null
            ? (pickFirstNumber(plan?.gastosFijos, s6.gastosFijos)! / 12)
            : 0)
      )
    );

  // Marketing mensual: plan.marketingMensual (en tu caso) o presupuestoMarketing
  const marketingMensual =
    Math.max(
      0,
      Math.round(
        pickFirstNumber(
          s6.presupuestoMarketing,
          plan?.presupuestoMarketing,
          s6.marketingMensual,
          plan?.marketingMensual,
          s6.presupuestoMkt
        ) ?? 0
      )
    );

  // Clientes/mes: si no viene explícito, derivamos ventaMensual / ticket (como Step-9)
  const clientesExpl =
    pickFirstNumber(
      plan?.clientesMensuales,
      s6.clientesMensuales,
      s6.clientesObjetivoMes,
      s6.clientesMes,
      s6.clientesPorMes
    );

  const clientesDeriv = ticket > 0 && ventaMensual > 0 ? Math.round(ventaMensual / ticket) : null;

  const clientesMensuales =
    clientesExpl != null && clientesExpl > 0
      ? Math.round(clientesExpl)
      : clientesDeriv != null && clientesDeriv > 0
      ? clientesDeriv
      : null;

  // Step-7/9 extras (si existen)
  const mesesPE = pickFirstNumber(s6.mesesPE, plan?.mesesPE);
  const capitalTrabajo = pickFirstNumber(s6.capitalTrabajo, plan?.capitalTrabajo);

  // Margen/resultado (operativo mensual, coherente con Step-9)
  const mcUnit = calcMcUnit(ticket, costoVarUnit);

  const margenBrutoPct =
    ticket > 0 ? clampPct((mcUnit / ticket) * 100) : null;

  const resultadoMensual =
    clientesMensuales != null && mcUnit >= 0
      ? Math.round(clientesMensuales * mcUnit - (gastosFijosMensuales + marketingMensual))
      : null;

  // Break-even (clientes necesarios para que resultado sea 0)
  const beClientes =
    mcUnit > 0
      ? ceilPos((gastosFijosMensuales + marketingMensual) / mcUnit)
      : null;

  const beVentas =
    beClientes && beClientes > 0 && ticket > 0 ? Math.round(beClientes * ticket) : null;

  return {
    projectName: legacy.projectName,
    idea: legacy.idea,
    ubicacion: legacy.ubicacion,
    sectorId: legacy.sectorId,

    ventaAnual: Math.round(ventaAnual),
    ventaMensual: Math.round(ventaMensual),

    ticket: Math.round(ticket),
    costoVarUnit,

    gastosFijosMensuales,
    marketingMensual,

    clientesMensuales,

    margenBrutoPct,
    resultadoMensual,

    beClientes,
    beVentas,

    mesesPE: mesesPE != null ? Math.round(mesesPE) : null,
    capitalTrabajo: capitalTrabajo != null ? Math.round(capitalTrabajo) : null,

    _sources: {
      ventaAnual_from: plan?.ventaAnual ?? s6.ventaAnual ?? s6.ventaAnio1,
      ticket_from: plan?.ticket ?? s6.ticket,
      costoUnit_from: plan?.costoUnit ?? plan?.costoVarUnit ?? s6.costoVarUnit ?? s6.costoUnit,
      gastosFijos_from: plan?.gastosFijos ?? plan?.gastosFijosMensuales ?? s6.gastosFijosMensuales,
      marketing_from: plan?.marketingMensual ?? plan?.presupuestoMarketing ?? s6.marketingMensual ?? s6.presupuestoMarketing,
      clientes_from: plan?.clientesMensuales ?? s6.clientesMensuales,
    },
  };
}

export default function FundingStep4Page() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string | undefined;

  const [aiContext, setAiContext] = useState<AiContext>({});
  const [derived, setDerived] = useState<Derived | null>(null);

  // metas (editable)
  const [metaVentasMensuales, setMetaVentasMensuales] = useState<string>("");
  const [metaClientesMensuales, setMetaClientesMensuales] = useState<string>("");
  const [metaMargenBrutoPct, setMetaMargenBrutoPct] = useState<string>("");
  const [metaResultadoMensual, setMetaResultadoMensual] = useState<string>("");
  const [impactoNarrativa, setImpactoNarrativa] = useState<string>("");

  // UI estado
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // IA
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // autosave refs
  const hydratedRef = useRef(false);
  const autosaveTimerRef = useRef<number | null>(null);
  const autosavingRef = useRef(false);

  async function saveF4ToApi(partial?: Partial<F4Draft>) {
    if (!sessionId) return;

    const payloadF4 = {
      step: "F4" as const,

      metaVentasMensuales: parseMoneyInputToInt((partial?.metaVentasMensuales ?? metaVentasMensuales) || ""),
      metaClientesMensuales: (partial?.metaClientesMensuales ?? metaClientesMensuales)
        ? parseInt(((partial?.metaClientesMensuales ?? metaClientesMensuales) || "").replace(/\D/g, ""), 10)
        : null,
      metaMargenBrutoPct: (partial?.metaMargenBrutoPct ?? metaMargenBrutoPct)
        ? Number((partial?.metaMargenBrutoPct ?? metaMargenBrutoPct).replace(",", "."))
        : null,
      metaResultadoMensual: parseMoneyInputToInt((partial?.metaResultadoMensual ?? metaResultadoMensual) || ""),

      impactoNarrativa: (partial?.impactoNarrativa ?? impactoNarrativa) || null,

      // compat: por ahora no mandamos KPI social (queda para después)
      metaBeneficiariosMensuales: null,
    };

    try {
      autosavingRef.current = true;
      const res = await fetch("/api/funding-session/save-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, data: payloadF4 }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.error("[F4] autosave error:", errJson);
        return;
      }
      setSavedMsg("Guardado.");
    } catch (e) {
      console.error("[F4] autosave network error:", e);
    } finally {
      autosavingRef.current = false;
    }
  }

  function persistLocal(next: Partial<F4Draft>) {
    if (!sessionId) return;
    const key = f4StorageKey(sessionId);
    const prev = readJSON<F4Draft>(key) ?? {};
    const merged: F4Draft = { ...prev, ...next, updatedAt: Date.now() };
    writeJSON(key, merged);
  }

  // 0) Restore inmediato desde localStorage
  useEffect(() => {
    if (!sessionId) return;
    const draft = readJSON<F4Draft>(f4StorageKey(sessionId));
    if (!draft) return;

    if (draft.metaVentasMensuales && !metaVentasMensuales) setMetaVentasMensuales(draft.metaVentasMensuales);
    if (draft.metaClientesMensuales && !metaClientesMensuales) setMetaClientesMensuales(draft.metaClientesMensuales);
    if (draft.metaMargenBrutoPct && !metaMargenBrutoPct) setMetaMargenBrutoPct(draft.metaMargenBrutoPct);
    if (draft.metaResultadoMensual && !metaResultadoMensual) setMetaResultadoMensual(draft.metaResultadoMensual);

    if (draft.impactoNarrativa && !impactoNarrativa) setImpactoNarrativa(draft.impactoNarrativa);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // 1) Hidratar desde legacyForm (plan primero)
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const global = (window as any).__arete;
      const legacyFromGlobal: LegacyForm | null = global?.form ?? null;

      const legacyFromStorage: LegacyForm | null =
        readJSON<LegacyForm>("arete:legacyForm") ?? readJSON<LegacyForm>("arete:form");

      const legacy: LegacyForm | null = legacyFromGlobal ?? legacyFromStorage;

      if (legacy) {
        setAiContext({
          projectName: legacy.projectName,
          idea: legacy.idea,
          ventajaTexto: legacy.ventajaTexto,
          sectorId: legacy.sectorId,
          ubicacion: legacy.ubicacion,
          plan: legacy.plan ?? null,
        });
      }

      const d = deriveFromLegacy(legacy);
      setDerived(d);

      // Sugerencias meta (6m) sin inventar:
      // - ventas/clientes: equilibrio (break-even)
      // - margen: el margen real actual (no inventamos “mejoras”)
      // - resultado: 0 (equilibrio)
      if (d) {
        const empty = (s: string) => !s || !s.trim();

        if (empty(metaVentasMensuales)) {
          const sugg = d.beVentas ?? d.ventaMensual ?? 0;
          setMetaVentasMensuales(sugg > 0 ? fmtCLP(sugg) : "");
        }
        if (empty(metaClientesMensuales)) {
          const sugg = d.beClientes ?? d.clientesMensuales ?? 0;
          setMetaClientesMensuales(sugg > 0 ? String(sugg) : "");
        }
        if (empty(metaMargenBrutoPct)) {
          setMetaMargenBrutoPct(d.margenBrutoPct != null ? fmtPct(d.margenBrutoPct) : "");
        }
        if (empty(metaResultadoMensual)) {
          setMetaResultadoMensual("0");
        }
      }
    } catch (e) {
      console.error("[F4] Error hidratando desde legacyForm:", e);
    } finally {
      hydratedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Autosave (local + DB) con debounce
  useEffect(() => {
    if (!sessionId) return;
    if (!hydratedRef.current) return;

    persistLocal({
      metaVentasMensuales,
      metaClientesMensuales,
      metaMargenBrutoPct,
      metaResultadoMensual,
      impactoNarrativa,
    });

    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => {
      if (autosavingRef.current) return;
      saveF4ToApi();
    }, 900);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    metaVentasMensuales,
    metaClientesMensuales,
    metaMargenBrutoPct,
    metaResultadoMensual,
    impactoNarrativa,
    sessionId,
  ]);

  if (!sessionId) {
    return (
      <main className="container max-w-3xl mx-auto py-8">
        <p className="text-sm text-red-600">No se encontró el ID de sesión de financiamiento.</p>
      </main>
    );
  }

  const handleBack = () => router.push(`/funding/${sessionId}/f3`);
  const handleContinue = async () => {
    setSaving(true);
    setSavedMsg(null);
    await saveF4ToApi();
    setSaving(false);
    router.push(`/funding/${sessionId}/f5`);
  };

  const base = useMemo(() => {
    if (!derived) return null;

    const clientes = derived.clientesMensuales ?? null;
    const mcUnit = Math.max(derived.ticket - derived.costoVarUnit, 0);
    const grossProfit = clientes != null ? mcUnit * clientes : null;

    return {
      ventasMensuales: derived.ventaMensual,
      clientesMensuales: clientes,
      margenBrutoPct: derived.margenBrutoPct,
      resultadoMensual: derived.resultadoMensual,
      grossProfit,
      gastosFijosMasMkt: derived.gastosFijosMensuales + derived.marketingMensual,
    };
  }, [derived]);

  const canExplainBreakEven = Boolean(
    derived &&
      derived.ticket > 0 &&
      derived.gastosFijosMensuales >= 0
  );

  /* ---------- Botón IA: narrativa de impacto ---------- */
  const handleImproveImpactWithAI = async () => {
    setAiError(null);
    setAiLoading(true);

    try {
      const res = await fetch(AI_FUNDING_IMPACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current: (impactoNarrativa ?? "").trim(),

          projectName: aiContext.projectName,
          idea: aiContext.idea,
          ventajaTexto: aiContext.ventajaTexto,
          sectorId: aiContext.sectorId,
          ubicacion: aiContext.ubicacion,
          plan: aiContext.plan,

          mesesPE: derived?.mesesPE ?? null,
          capitalTrabajo: derived?.capitalTrabajo ?? null,

          // Solo 4 indicadores (por ahora)
          indicadores: [
            {
              nombre: "Ventas mensuales",
              base: base?.ventasMensuales ?? null,
              meta6m: parseMoneyInputToInt(metaVentasMensuales),
              formula: "venta mensual ($/mes)",
            },
            {
              nombre: "Clientes mensuales",
              base: base?.clientesMensuales ?? null,
              meta6m: metaClientesMensuales ? parseInt(metaClientesMensuales.replace(/\D/g, ""), 10) : null,
              formula: "clientes/mes = venta mensual / ticket",
            },
            {
              nombre: "Margen bruto",
              base: base?.margenBrutoPct ?? null,
              meta6m: metaMargenBrutoPct ? Number(metaMargenBrutoPct.replace(",", ".")) : null,
              formula: "% = (ticket - costo variable unitario) / ticket",
            },
            {
              nombre: "Resultado mensual (operativo)",
              base: base?.resultadoMensual ?? null,
              meta6m: parseMoneyInputToInt(metaResultadoMensual),
              formula: "$/mes = (clientes × margen unit) − (gastos fijos + marketing)",
            },
          ],
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg =
          errJson?.error ||
          (res.status === 402
            ? "Créditos insuficientes. Revisa tus planes y adquiere más créditos."
            : `Error IA (${res.status})`);
        throw new Error(msg);
      }

      const json = await res.json().catch(() => ({}));
      const improved = (json?.narrativa ?? json?.text ?? json?.content ?? "").toString().trim();
      if (!improved) throw new Error("Respuesta de IA vacía.");

      setImpactoNarrativa(improved);
      persistLocal({ impactoNarrativa: improved });
      await saveF4ToApi({ impactoNarrativa: improved });
    } catch (e: any) {
      setAiError(e?.message || "No se pudo generar la narrativa de impacto con IA.");
    } finally {
      setAiLoading(false);
    }
  };

  /* ---------- Inputs (formateo) ---------- */
  const onChangeMoney = (setter: (v: string) => void) => (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return setter("");
    const n = parseInt(digits, 10);
    if (Number.isNaN(n)) return setter("");
    setter(n.toLocaleString("es-CL"));
  };
  const onChangeInt = (setter: (v: string) => void) => (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return setter("");
    const n = parseInt(digits, 10);
    if (Number.isNaN(n)) return setter("");
    setter(String(n));
  };
  const onChangePct = (setter: (v: string) => void) => (raw: string) => {
    const cleaned = raw.replace(/[^\d,]/g, "");
    if (!cleaned) return setter("");
    const asNum = Number(cleaned.replace(",", "."));
    if (!Number.isFinite(asNum)) return setter(cleaned);
    setter(String(clampPct(asNum)).replace(".", ","));
  };

  return (
    <main className="container max-w-3xl mx-auto py-8 space-y-4">
      <header className="mb-4 text-center space-y-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Módulo de fondos</p>
        <h1 className="text-2xl font-semibold">Paso F4 – Impacto y resultados esperados</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-xl mx-auto">
          Definimos 4 indicadores fijos (por ahora) y una narrativa corta. La base sale de tu plan
          (principalmente <code>legacyForm.plan</code>) y la meta a 6 meses se sugiere usando tu punto de equilibrio
          (break-even), sin inventar números.
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px]">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
            F4 de F8 · Indicadores
          </span>
          <span className="text-slate-400">
            ID sesión:{" "}
            <code className="font-mono text-[10px] bg-slate-50 px-1.5 py-0.5 rounded">{sessionId}</code>
          </span>
        </div>

        {(aiContext.projectName || aiContext.ubicacion) && (
          <div className="mt-2 text-[12px] text-slate-600">
            <span className="font-medium">{aiContext.projectName || "Proyecto"}</span>
            {aiContext.ubicacion ? <> · {aiContext.ubicacion}</> : null}
          </div>
        )}
      </header>

      <Card>
        <CardHeader className="pb-3 space-y-2">
          <p className="text-sm font-medium">Indicadores (4) con seguimiento mensual</p>
          <p className="text-[11px] text-slate-500">
            Son siempre los mismos. Tú ajustas la <span className="font-medium">meta a 6 meses</span>. La{" "}
            <span className="font-medium">base</span> sale de tus datos del wizard.
          </p>

          {canExplainBreakEven && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] text-sky-700 hover:underline">
                ¿Por qué la meta sugerida es el “punto de equilibrio”?
              </summary>
              <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">
                <p>El punto de equilibrio (break-even) es cuando tu margen mensual cubre tus gastos del mes.</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><span className="font-medium">Margen unitario</span> = ticket − costo variable unitario.</li>
                  <li><span className="font-medium">Gasto mensual</span> = gastos fijos mensuales + marketing mensual.</li>
                  <li><span className="font-medium">Clientes equilibrio</span> = gasto mensual / margen unitario.</li>
                </ul>
                <p className="mt-2">
                  Nota: este “resultado mensual” es <span className="font-medium">operativo</span> (antes de impuestos),
                  para ser consistente con tu Step-9.
                </p>
              </div>
            </details>
          )}

          {derived?._sources && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[11px] text-slate-500 hover:underline">
                Debug: ¿de qué campos estoy sacando los números?
              </summary>
              <pre className="mt-2 rounded-md border bg-slate-50 p-3 text-[11px] overflow-x-auto">
{JSON.stringify(derived._sources, null, 2)}
              </pre>
            </details>
          )}
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          {!derived || !base ? (
            <div className="rounded-lg border bg-slate-50 px-3 py-3 text-[12px] text-slate-600">
              No pudimos leer tu plan desde <code>arete:legacyForm</code>. Vuelve a correr el wizard y reintenta.
            </div>
          ) : (
            <>
              {/* 1: Ventas */}
              <div className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">Ventas mensuales</div>
                    <div className="text-[11px] text-slate-500">Fórmula: venta mensual ($/mes).</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">Base</div>
                    <div className="font-semibold">${fmtCLP(base.ventasMensuales)}</div>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-[11px] font-medium">Meta a 6 meses (sugerida por equilibrio)</span>
                    <div className="flex items-center rounded-md border px-2 py-1.5">
                      <span className="text-slate-400 mr-1">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="w-full text-sm outline-none bg-transparent"
                        placeholder="Ej: 12.000.000"
                        value={metaVentasMensuales}
                        onChange={(e) => onChangeMoney(setMetaVentasMensuales)(e.target.value)}
                      />
                      <span className="text-slate-400 ml-2 text-[11px]">/mes</span>
                    </div>
                  </label>

                  <div className="rounded-md border bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                    <div className="font-medium">Dato aret3 que lo alimenta</div>
                    <div>Plan: ventaAnual → ventaMensual = ventaAnual / 12</div>
                  </div>
                </div>
              </div>

              {/* 2: Clientes */}
              <div className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">Clientes mensuales</div>
                    <div className="text-[11px] text-slate-500">Fórmula: clientes/mes = venta mensual / ticket.</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">Base</div>
                    <div className="font-semibold">
                      {base.clientesMensuales == null ? "No disponible" : fmtCLP(base.clientesMensuales)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-[11px] font-medium">Meta a 6 meses (sugerida por equilibrio)</span>
                    <div className="flex items-center rounded-md border px-2 py-1.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="w-full text-sm outline-none bg-transparent"
                        placeholder="Ej: 108"
                        value={metaClientesMensuales}
                        onChange={(e) => onChangeInt(setMetaClientesMensuales)(e.target.value)}
                      />
                      <span className="text-slate-400 ml-2 text-[11px]">clientes/mes</span>
                    </div>
                  </label>

                  <div className="rounded-md border bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                    <div className="font-medium">Dato aret3 que lo alimenta</div>
                    <div>Derivado: venta mensual y ticket (modelo Step-9)</div>
                  </div>
                </div>
              </div>

              {/* 3: Margen */}
              <div className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">Margen bruto</div>
                    <div className="text-[11px] text-slate-500">(ticket − costo variable unitario) / ticket.</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">Base</div>
                    <div className="font-semibold">
                      {base.margenBrutoPct == null ? "No disponible" : `${fmtPct(base.margenBrutoPct)}%`}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-[11px] font-medium">Meta a 6 meses</span>
                    <div className="flex items-center rounded-md border px-2 py-1.5">
                      <input
                        type="text"
                        inputMode="decimal"
                        className="w-full text-sm outline-none bg-transparent"
                        placeholder="Ej: 35"
                        value={metaMargenBrutoPct}
                        onChange={(e) => onChangePct(setMetaMargenBrutoPct)(e.target.value)}
                      />
                      <span className="text-slate-400 ml-2 text-[11px]">%</span>
                    </div>
                  </label>

                  <div className="rounded-md border bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                    <div className="font-medium">Dato aret3 que lo alimenta</div>
                    <div>Plan: ticket + costoUnit (o step6 costoVarUnit)</div>
                  </div>
                </div>
              </div>

              {/* 4: Resultado */}
              <div className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">Resultado mensual (operativo)</div>
                    <div className="text-[11px] text-slate-500">(clientes × margen unit) − (gastos fijos + marketing).</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">Base</div>
                    <div className="font-semibold">
                      {base.resultadoMensual == null ? "No disponible" : `$${fmtCLP(base.resultadoMensual)}`}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-[11px] font-medium">Meta a 6 meses</span>
                    <div className="flex items-center rounded-md border px-2 py-1.5">
                      <span className="text-slate-400 mr-1">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="w-full text-sm outline-none bg-transparent"
                        placeholder="Ej: 0"
                        value={metaResultadoMensual}
                        onChange={(e) => onChangeMoney(setMetaResultadoMensual)(e.target.value)}
                      />
                      <span className="text-slate-400 ml-2 text-[11px]">/mes</span>
                    </div>
                    <p className="text-[13px] text-slate-500">
                      Sugerencia sin inventar: <span className="font-medium">0</span> esto corresponde a estar en punto de equilibrio has dejado de perder dinero.
                    </p>
                  </label>

                  <div className="rounded-md border bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                    <div className="font-medium">Dato aret3 que lo alimenta</div>
                    <div>Modelo Step-9: mc − (fijos + marketing)</div>
                  </div>
                </div>
              </div>

              {/* Resumen BE */}
              {derived.beClientes && derived.beVentas ? (
                <div className="rounded-lg border bg-slate-50 px-3 py-3 text-[11px] text-slate-700">
                  <div className="font-medium">Resumen (equilibrio sugerido)</div>
                  <div className="mt-1">
                    Para cubrir gastos del mes (gastos fijos + marketing ={" "}
                    <span className="font-semibold">${fmtCLP(base.gastosFijosMasMkt)}</span>) necesitas aprox.{" "}
                    <span className="font-semibold">{fmtCLP(derived.beClientes)}</span> clientes/mes, equivalente a{" "}
                    <span className="font-semibold">${fmtCLP(derived.beVentas)}</span> en ventas mensuales.
                  </div>
                </div>
              ) : null}
            </>
          )}

          {/* Narrativa + IA */}
          <div className="pt-2 space-y-2">
            <p className="text-sm font-medium">Narrativa de impacto (para pegar en formularios)</p>
            <p className="text-[11px] text-slate-500">
              En 6–10 líneas. Debe basarse en estos 4 indicadores (sin inventar).
            </p>

            <div className="flex gap-3 items-stretch">
              <textarea
                className="w-full min-h-[140px] rounded-md border px-2 py-1.5 text-sm"
                placeholder={`Ej:\nEn 6 meses esperamos alcanzar el punto de equilibrio...\nEsto se medirá con ventas/mes, clientes/mes, margen y resultado...\n...`}
                value={impactoNarrativa}
                onChange={(e) => {
                  const v = e.target.value;
                  setImpactoNarrativa(v);
                  persistLocal({ impactoNarrativa: v });
                }}
              />

              <button
                type="button"
                onClick={handleImproveImpactWithAI}
                disabled={aiLoading}
                title="Mejorar narrativa de impacto con IA aret3 (consume 1 crédito)"
                aria-busy={aiLoading}
                className={[
                  "shrink-0 w-[64px] rounded-xl border px-3 py-2 mt-0.5",
                  "flex flex-col items-center justify-center",
                  "transition-colors duration-150",
                  "bg-blue-100 border-blue-300 text-blue-700",
                  "hover:bg-blue-200 hover:border-blue-400 hover:text-blue-800",
                  "active:bg-blue-300 active:border-blue-500",
                  "shadow-sm hover:shadow",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                {aiLoading ? <Spinner className="w-5 h-5" /> : <BotIcon className="h-8 w-8" variant="t3" glowHue="gold" />}
                <span className="mt-1 text-[10px] leading-none text-center">
                  Impacto
                  <br />
                  con IA
                </span>
              </button>
            </div>

            {aiError && <p className="mt-1 text-xs text-red-600">IA: {aiError}</p>}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center gap-2">
          <Button variant="outline" onClick={handleBack} disabled={saving}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Volver a F3
          </Button>

          <div className="flex flex-col items-end gap-1">
            {savedMsg && <p className="text-[11px] text-muted-foreground max-w-xs text-right">{savedMsg}</p>}
            <Button
              onClick={handleContinue}
              disabled={saving}
              className={`
                inline-flex flex-col items-center justify-center gap-0.5
                rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-slate-900
                px-3.5 py-2 text-[11px] font-medium text-white shadow-md
                transition-all duration-300
                hover:from-emerald-500 hover:to-emerald-700
                active:scale-[0.98]
                sm:flex-row sm:gap-2
              `}
            >
              <div className="flex items-center gap-1.5">
                <img
                  src="/aret3-logo.svg"
                  alt="aret3"
                  className="h-6 w-6 rounded-full shadow-[0_0_6px_rgba(56,189,248,0.9)]"
                  loading="lazy"
                />
                <span className="whitespace-nowrap">{saving ? "Guardando..." : "Guardar y continuar"}</span>
              </div>
            </Button>
          </div>
        </CardFooter>
      </Card>
      {/* Nota créditos */}
              <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-slate-500">
                Nota: mejorar con{" "}
                <span className="inline-flex items-center gap-1 font-medium">
                  <BotIcon className="h-3.5 w-3.5" variant="t3" /> IA Aret3
                </span>{" "}
                resta 1 crédito.
              </p>
    </main>
  );
}
