//app/funding/[sessionId]/f3/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import BotIcon from "@/components/icons/BotIcon";
import { getTemplateForSector } from "@/lib/model/step6-distributions";
import type { SectorId } from "@/lib/model/sectors";
import { resolveCapitalTrabajo } from "@/lib/funding/resolveCapitalTrabajo";

const AI_FUNDING_USES_ENDPOINT =
  process.env.NEXT_PUBLIC_AI_FUNDING_USES_ENDPOINT ?? "/api/ai/funding-uses-improve";

// Spinner mínimo
function Spinner({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// Tipos amplios para no romper nada
type PlanPreview = {
  inversionInicial?: number;
  capitalTrabajo?: number;
  marketingMensual?: number;
  ventaAnual?: number;
  ventaMensual?: number;
  ingresosMeta?: number;
  sectorId?: SectorId;
  utilidadNetaAnual?: number;
  resultadoAntesImpuestosAnual?: number;
  utilidadAnual?: number;
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

// Utilidad segura para leer JSON del localStorage
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

/* ===== Helpers para capital de trabajo (mismas ideas que Step-9) ===== */
const ceil = (x: number) => (x > 0 ? Math.ceil(x) : 0);

function deriveCostoUnit(
  ticket: number,
  costoVarPct?: number | null,
  costoVarUnit?: number | null
) {
  const unit = typeof costoVarUnit === "number" ? costoVarUnit : 0;
  if (unit > 0) return Math.min(unit, ticket);

  const pct = typeof costoVarPct === "number" ? costoVarPct : 0;
  if (pct > 0) return Math.min((ticket * pct) / 100, ticket);

  return 0;
}

const calcMcUnit = (ticket: number, costoUnit: number) => Math.max(ticket - costoUnit, 0);

/**
 * Fallback: estima capital de trabajo desde step6 (si no vino de plan/step9).
 * Mantiene tu definición: incluye marketing dentro de gastos del mes.
 */
function computeCapitalTrabajoFromLegacy(legacy: LegacyForm | null): number | null {
  if (!legacy) return null;

  const s6: any = legacy.step6 ?? legacy.data?.step6 ?? legacy;

  const ticket = Math.max(0, toNumber(s6.ticket) ?? 0);
  const ventaAnual = Math.max(0, toNumber(s6.ventaAnual ?? s6.ventaAnio1) ?? 0);
  const marketingMensual = Math.max(
    0,
    toNumber(s6.marketingMensual ?? s6.presupuestoMarketing) ?? 0
  );
  const gastosFijosMensuales = Math.max(0, toNumber(s6.gastosFijosMensuales) ?? 0);
  const mesesPE = Math.max(1, Math.round(toNumber(s6.mesesPE) ?? 6));

  const costoUnit = deriveCostoUnit(
    ticket,
    toNumber(s6.costoVarPct) ?? 0,
    toNumber(s6.costoVarUnit) ?? 0
  );
  const mcUnit = calcMcUnit(ticket, costoUnit);

  if (ticket <= 0 || mcUnit <= 0) return null;

  const clientesPE = gastosFijosMensuales > 0 ? Math.ceil(gastosFijosMensuales / mcUnit) : 0;

  const clientesObjetivoMes =
    (toNumber(s6.clientesMensuales) ?? 0) > 0
      ? Math.round(toNumber(s6.clientesMensuales) ?? 0)
      : ticket > 0
        ? Math.round((ventaAnual / 12) / ticket)
        : 0;

  let capitalTrabajo = 0;

  for (let m = 1; m <= 12; m++) {
    const factor = mesesPE > 0 ? m / mesesPE : 1;
    const basePE = ceil(clientesPE * factor);
    const clientes = clientesObjetivoMes > 0 ? Math.min(basePE, clientesObjetivoMes) : basePE;

    const ingresos = clientes * ticket;
    const costoVar = clientes * costoUnit;
    const mc = Math.max(0, ingresos - costoVar);
    const gastos = gastosFijosMensuales + marketingMensual;
    const resultado = mc - gastos;

    if (resultado < 0) capitalTrabajo += Math.abs(resultado);
  }

  return Math.round(capitalTrabajo);
}

// ---------- Persistencia F3 (local + autosave DB) ----------
type F3Draft = {
  montoSolicitado?: string;
  montoEdited?: boolean; // 👈 NUEVO
  tieneAportePropio?: "si" | "no" | "";
  aportePropio?: string;
  porcentajeAporte?: string;
  usosPrincipales?: string;
  updatedAt?: number;
};


function f3StorageKey(sessionId: string) {
  return `aret3:funding:f3:${sessionId}`;
}

function parseMoneyInputToInt(value: string): number | null {
  const digitsOnly = (value ?? "").replace(/\D/g, "");
  if (!digitsOnly) return null;
  const num = parseInt(digitsOnly, 10);
  return Number.isNaN(num) ? null : num;
}

export default function FundingStep3Page() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string | undefined;

  const [montoSolicitado, setMontoSolicitado] = useState<string>("");
  const [tieneAportePropio, setTieneAportePropio] = useState<"si" | "no" | "">("");
  const [aportePropio, setAportePropio] = useState<string>("");
  const [porcentajeAporte, setPorcentajeAporte] = useState<string>("");
  const [usosPrincipales, setUsosPrincipales] = useState<string>("");

  const [dineroDisponible, setDineroDisponible] = useState<number | null>(null);
  const [capitalTrabajo, setCapitalTrabajo] = useState<number | null>(null);
  const [totalInversion, setTotalInversion] = useState<number | null>(null);

  const [capitalTrabajoSugerido, setCapitalTrabajoSugerido] = useState<string>("");
  const [dineroPropioDisponible, setDineroPropioDisponible] = useState<string>("");

 const montoInicialSetRef = useRef(false);
 const montoEditedRef = useRef(false); // 👈 NUEVO
 const usosInicialSetRef = useRef(false);

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiContext, setAiContext] = useState<AiContext>({});

  // autosave refs
  const hydratedRef = useRef(false);
  const autosaveTimerRef = useRef<number | null>(null);
  const autosavingRef = useRef(false);

  async function saveF3ToApi(partial?: Partial<F3Draft>) {
    if (!sessionId) return;

    // construye payload NUMÉRICO para backend
    const montoSolicitadoNumber = parseMoneyInputToInt(partial?.montoSolicitado ?? montoSolicitado);
    const aportePropioNumber = parseMoneyInputToInt(partial?.aportePropio ?? aportePropio);
    const porcentajeAporteNumber =
      (partial?.porcentajeAporte ?? porcentajeAporte)
        ? parseInt((partial?.porcentajeAporte ?? porcentajeAporte).replace(/\D/g, ""), 10)
        : null;

    const payloadF3 = {
      step: "F3" as const,
      montoSolicitado: montoSolicitadoNumber,
      tieneAportePropio: (partial?.tieneAportePropio ?? tieneAportePropio) || "",
      aportePropio: aportePropioNumber,
      porcentajeAporte: Number.isFinite(porcentajeAporteNumber as any) ? porcentajeAporteNumber : null,
      usosPrincipales: (partial?.usosPrincipales ?? usosPrincipales) || null,
    };

    try {
      autosavingRef.current = true;
      const res = await fetch("/api/funding-session/save-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, data: payloadF3 }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.error("[F3] autosave error:", errJson);
        return;
      }
      setSavedMsg("Guardado.");
    } catch (e) {
      console.error("[F3] autosave network error:", e);
    } finally {
      autosavingRef.current = false;
    }
  }

  function persistLocal(next: Partial<F3Draft>) {
    if (!sessionId) return;
    const key = f3StorageKey(sessionId);
    const prev = readJSON<F3Draft>(key) ?? {};
    const merged: F3Draft = {
      ...prev,
      ...next,
      updatedAt: Date.now(),
    };
    writeJSON(key, merged);
  }

  // 0) Restore inmediato desde localStorage (antes de sugerencias)
  useEffect(() => {
    if (!sessionId) return;
    const draft = readJSON<F3Draft>(f3StorageKey(sessionId));
    if (!draft) return;

    // solo pisa si el usuario aún no tiene nada escrito
    if (draft.montoSolicitado && !montoSolicitado) {
       setMontoSolicitado(draft.montoSolicitado);
       montoInicialSetRef.current = true;
    }
    if (draft.montoEdited) {
       montoEditedRef.current = true; // 👈 NUEVO
    }

    if (typeof draft.tieneAportePropio === "string" && !tieneAportePropio) {
      setTieneAportePropio(draft.tieneAportePropio);
    }
    if (draft.aportePropio && !aportePropio) setAportePropio(draft.aportePropio);
    if (draft.porcentajeAporte && !porcentajeAporte) setPorcentajeAporte(draft.porcentajeAporte);

    if (draft.usosPrincipales && !usosPrincipales) {
      setUsosPrincipales(draft.usosPrincipales);
      usosInicialSetRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // 1) Auto-relleno: capital de trabajo, dinero propio y regla payback 3 años
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const global = (window as any).__arete;
      const legacyFromGlobal: LegacyForm | null = global?.form ?? null;
      const planFromGlobal: PlanPreview | null = global?.plan ?? null;

      const legacyFromStorage: LegacyForm | null =
        readJSON<LegacyForm>("arete:legacyForm") ?? readJSON<LegacyForm>("arete:form");

      const planFromStorage: PlanPreview | null = readJSON<PlanPreview>("arete:planPreview") ?? null;

      const legacy: LegacyForm | null = legacyFromGlobal ?? legacyFromStorage;
      const plan: PlanPreview | null = planFromGlobal ?? planFromStorage ?? (legacy?.plan ?? null);

      if (legacy) {
        setAiContext({
          projectName: legacy.projectName,
          idea: legacy.idea,
          ventajaTexto: legacy.ventajaTexto,
          sectorId: legacy.sectorId,
          ubicacion: legacy.ubicacion,
          plan: plan ?? undefined,
        });
      } else if (plan) {
        setAiContext((ctx) => ({ ...ctx, plan }));
      }

      const s6: any = (legacy as any)?.step6 ?? (legacy as any)?.data?.step6 ?? {};
      const sectorId: SectorId =
        (plan?.sectorId as SectorId) ??
        ((legacy?.sectorId as SectorId) || ("retail_local" as SectorId));

      const resolvedCap = resolveCapitalTrabajo({ legacy, plan });

      const capitalTrabajoDerivado =
        resolvedCap.value ??
        computeCapitalTrabajoFromLegacy(legacy) ??
        toNumber(plan?.capitalTrabajo) ??
        toNumber(s6.capitalTrabajo);

      if (process.env.NODE_ENV !== "production") {
        console.info("[F3] capitalTrabajo source:", resolvedCap.source, "value:", resolvedCap.value);
      }

      const inversionInicialNum = toNumber(plan?.inversionInicial) ?? toNumber(s6.inversionInicial);

      const ventaAnualNum =
        toNumber(plan?.ventaAnual) ?? toNumber(s6.ventaAnual) ?? toNumber(s6.ventaAnio1);

      // Tarjeta capital trabajo
      if (typeof capitalTrabajoDerivado === "number" && capitalTrabajoDerivado > 0) {
        setCapitalTrabajo(capitalTrabajoDerivado);
        setCapitalTrabajoSugerido(Math.round(capitalTrabajoDerivado).toLocaleString("es-CL"));
      } else {
        setCapitalTrabajo(null);
        setCapitalTrabajoSugerido("");
      }

      // Tarjeta dinero propio (inversión inicial)
      if (inversionInicialNum && inversionInicialNum > 0) {
        setDineroDisponible(inversionInicialNum);
        const fmt = Math.round(inversionInicialNum).toLocaleString("es-CL");
        setDineroPropioDisponible(fmt);

        // solo prefill si usuario aún no tocó
        if (!aportePropio) {
          setTieneAportePropio("si");
          setAportePropio(fmt);
        }
      }

      // Regla payback 3 años -> inversión total
      const utilidadAnualPlan =
        toNumber(plan?.utilidadNetaAnual) ||
        toNumber(plan?.resultadoAntesImpuestosAnual) ||
        toNumber(plan?.utilidadAnual);

      let inversionObjetivo: number | null = null;

      if (utilidadAnualPlan && utilidadAnualPlan > 0) {
        inversionObjetivo = utilidadAnualPlan * 3;
      } else if (ventaAnualNum && ventaAnualNum > 0) {
        try {
          const tpl = getTemplateForSector(sectorId);
          const margenResultado = (tpl as any)?.resultado as number | undefined;
          if (typeof margenResultado === "number" && margenResultado > 0) {
            inversionObjetivo = ventaAnualNum * margenResultado * 3;
          }
        } catch {}
      }

      if (inversionObjetivo && inversionObjetivo > 0) {
        setTotalInversion(inversionObjetivo);

        const dineroPropio = inversionInicialNum ?? 0;

        if (!porcentajeAporte && dineroPropio > 0) {
          const pct = Math.round((dineroPropio / inversionObjetivo) * 100);
          setPorcentajeAporte(String(pct));
          if (!tieneAportePropio) setTieneAportePropio("si");
        }

        // sugerencia monto a pedir (solo si aún no hay un monto restaurado)
        const minAsk = capitalTrabajoDerivado ?? 0;
        const maxAskByRule = Math.max(0, inversionObjetivo - dineroPropio);
        let sugerido = maxAskByRule;

        if (sugerido < minAsk) sugerido = minAsk;
        if (sugerido > inversionObjetivo) sugerido = inversionObjetivo;

        if (sugerido > 0 && !montoInicialSetRef.current) {
          setMontoSolicitado(Math.round(sugerido).toLocaleString("es-CL"));
          montoInicialSetRef.current = true;
        }
      }

      // Prefill de usos si no hay nada y no se restauró ya
      if (
        !usosInicialSetRef.current &&
        !usosPrincipales &&
        typeof capitalTrabajoDerivado === "number" &&
        capitalTrabajoDerivado > 0
      ) {
        const capFmt = Math.round(capitalTrabajoDerivado).toLocaleString("es-CL");
        const baseText = [
          `- ${capFmt} para capital de trabajo (insumos, sueldos y gastos fijos de los primeros meses).`,
          "- Una parte para marketing digital y lanzamiento.",
          "- El resto para equipamiento básico, mejoras de local o plataforma.",
        ].join("\n");
        setUsosPrincipales(baseText);
        usosInicialSetRef.current = true;
      }
    } catch (e) {
      console.error("[F3] Error auto-rellenando desde legacyForm/plan:", e);
    } finally {
      hydratedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1.1) Mantener "monto solicitado" alineado a la regla (si el usuario no lo editó)
useEffect(() => {
  if (!hydratedRef.current) return;

  // si el usuario lo tocó, no lo pisamos jamás
  if (montoEditedRef.current) return;

  // si no hay datos base, no hacemos nada
  if (!totalInversion || totalInversion <= 0) return;

  const dineroPropio = parseMoneyInputToInt(aportePropio) ?? (dineroDisponible ?? 0);
  const cap = capitalTrabajo ?? 0;

  const maxAskByRule = Math.max(0, totalInversion - dineroPropio);
  let sugerido = maxAskByRule;

  // no pedir menos que capital de trabajo
  if (sugerido < cap) sugerido = cap;

  if (sugerido <= 0) return;

  const fmt = Math.round(sugerido).toLocaleString("es-CL");

  // evita re-render inútil
  if ((montoSolicitado ?? "") !== fmt) {
    setMontoSolicitado(fmt);
    persistLocal({ montoSolicitado: fmt, montoEdited: false });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [totalInversion, aportePropio, dineroDisponible, capitalTrabajo]);

  // 2) Autosave (local + DB) con debounce cuando cambian campos clave
  useEffect(() => {
    if (!sessionId) return;
    if (!hydratedRef.current) return;

    // siempre persistimos local al tiro
    persistLocal({
      montoSolicitado,
      montoEdited: montoEditedRef.current, // 👈 NUEVO
      tieneAportePropio,
      aportePropio,
      porcentajeAporte,
      usosPrincipales,
    });

    // debounce DB
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => {
      // evita spamear si ya hay un request corriendo
      if (autosavingRef.current) return;
      saveF3ToApi();
    }, 900);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montoSolicitado, tieneAportePropio, aportePropio, porcentajeAporte, usosPrincipales, sessionId]);

  if (!sessionId) {
    return (
      <main className="container max-w-3xl mx-auto py-8">
        <p className="text-sm text-red-600">No se encontró el ID de sesión de financiamiento.</p>
      </main>
    );
  }

  const handleBack = () => {
    router.push(`/funding/${sessionId}/f2`);
  };

const handleChangeMontoSolicitado = (value: string) => {
  montoEditedRef.current = true; // 👈 NUEVO

  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) {
    setMontoSolicitado("");
    // guarda al tiro en local
    persistLocal({ montoSolicitado: "", montoEdited: true });
    return;
  }

  const num = parseInt(digitsOnly, 10);
  if (Number.isNaN(num)) {
    setMontoSolicitado("");
    persistLocal({ montoSolicitado: "", montoEdited: true });
    return;
  }

  const fmt = num.toLocaleString("es-CL");
  setMontoSolicitado(fmt);

  // ✅ persistencia inmediata para que no se pierda si navega/recarga
  persistLocal({ montoSolicitado: fmt, montoEdited: true });
};


  const handleChangeAportePropio = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) return setAportePropio("");
    const num = parseInt(digitsOnly, 10);
    if (Number.isNaN(num)) return setAportePropio("");
    setAportePropio(num.toLocaleString("es-CL"));
  };

  const handleChangePorcentajeAporte = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) return setPorcentajeAporte("");
    const num = parseInt(digitsOnly, 10);
    if (Number.isNaN(num)) return setPorcentajeAporte("");
    const bounded = Math.max(0, Math.min(100, num));
    setPorcentajeAporte(String(bounded));
  };

  // 🔹 Botón IA: proponer usos de fondos (y guardar inmediatamente)
  const handleImproveUsosWithAI = async () => {
    setAiError(null);
    setAiLoading(true);

    const montoSolicitadoNumber = montoSolicitado ? parseMoneyInputToInt(montoSolicitado) : null;
    const aportePropioNumber = aportePropio ? parseMoneyInputToInt(aportePropio) : null;

    const capitalTrabajoNumber = capitalTrabajo ?? null;
    const totalInversionNumber = totalInversion ?? null;

    const current = (usosPrincipales ?? "").trim();

    try {
      const res = await fetch(AI_FUNDING_USES_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current,
          montoSolicitado: montoSolicitadoNumber,
          aportePropio: aportePropioNumber,
          capitalTrabajo: capitalTrabajoNumber,
          totalInversion: totalInversionNumber,
          projectName: aiContext.projectName,
          idea: aiContext.idea,
          ventajaTexto: aiContext.ventajaTexto,
          sectorId: aiContext.sectorId,
          ubicacion: aiContext.ubicacion,
          plan: aiContext.plan,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson?.error || `Error IA (${res.status})`;
        throw new Error(msg);
      }

      const json = await res.json();
      const improved = (json?.usos ?? json?.text ?? json?.content ?? "").toString().trim();
      if (!improved) throw new Error("Respuesta de IA vacía.");

      setUsosPrincipales(improved);

      // ✅ Persistir AL TIRO (local + DB) para que no se pierda aunque salgas
      persistLocal({ usosPrincipales: improved });
      await saveF3ToApi({ usosPrincipales: improved });

      try {
        window.dispatchEvent(new Event("focus"));
      } catch {}
    } catch (e: any) {
      setAiError(e?.message || "No se pudo generar el uso de fondos con IA. Intenta de nuevo.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAndContinue = async () => {
    setSaving(true);
    setSavedMsg(null);

    // guardado final explícito (igual que antes)
    await saveF3ToApi();

    setSaving(false);
    router.push(`/funding/${sessionId}/f4`);
  };

  return (
    <main className="container max-w-3xl mx-auto py-8 space-y-4">
      <header className="mb-4 text-center space-y-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Módulo de fondos</p>
        <h1 className="text-2xl font-semibold">Paso F3 – Monto y uso de fondos</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-xl mx-auto">
          Aquí definimos cuánto planeas pedir y en qué usarías el dinero. El monto se basa en lo que
          ya calculaste en tu plan (capital de trabajo, dinero propio y rentabilidad estimada),
          pero siempre lo puedes ajustar.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px]">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
            F3 de F8 · Monto y uso
          </span>
          <span className="text-slate-400">
            ID sesión:{" "}
            <code className="font-mono text-[10px] bg-slate-50 px-1.5 py-0.5 rounded">
              {sessionId}
            </code>
          </span>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3 space-y-3">
          <p className="text-sm font-medium">¿Cuánto planeas solicitar?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium">Monto aproximado que te gustaría pedir</span>
              <input
                type="text"
                inputMode="numeric"
                className="w-full rounded-md border px-2 py-1.5 text-sm"
                placeholder="Ej: 5.000.000"
                value={montoSolicitado}
                onChange={(e) => handleChangeMontoSolicitado(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Aret3 lo prellena usando tu capital de trabajo, tu dinero disponible y la regla de
                payback a 3 años.
              </p>
            </label>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          {(dineroPropioDisponible || capitalTrabajoSugerido !== "") && (
            <div className="mb-2 grid gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-lg border bg-slate-50 px-3 py-2">
                <div className="font-medium text-[11px] text-slate-700">
                  Capital de trabajo estimado (12 meses)
                </div>
                <div className="mt-1 text-sm font-semibold">
                  {capitalTrabajoSugerido !== "" ? `$${capitalTrabajoSugerido}` : "No disponible aún"}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {capitalTrabajoSugerido !== ""
                    ? "Calculado a partir de tu flujo de caja. En el uso de fondos se considera como un ítem separado."
                    : "No pudimos rescatar el capital de trabajo desde tu plan/flujo."}
                </p>
              </div>

              {dineroPropioDisponible && (
                <div className="rounded-lg border bg-slate-50 px-3 py-2">
                  <div className="font-medium text-[11px] text-slate-700">Dinero propio disponible</div>
                  <div className="mt-1 text-sm font-semibold">${dineroPropioDisponible}</div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Monto declarado en “¿Cuánto dinero dispones para tu idea?” (Paso 6).
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Aporte propio */}
          <div className="space-y-2">
            <p className="text-xs font-medium">¿Vas a aportar recursos propios al proyecto?</p>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTieneAportePropio("si")}
                className={`rounded-full px-3 py-1 border transition ${
                  tieneAportePropio === "si"
                    ? "border-primary bg-primary text-white"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => setTieneAportePropio("no")}
                className={`rounded-full px-3 py-1 border transition ${
                  tieneAportePropio === "no"
                    ? "border-primary bg-primary text-white"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                No
              </button>
            </div>

            {tieneAportePropio === "si" && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-medium">Monto aproximado de aporte propio</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                    placeholder="Ej: 1.000.000"
                    value={aportePropio}
                    onChange={(e) => handleChangeAportePropio(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Se prellena con el dinero disponible del Paso 6, pero puedes cambiarlo.
                  </p>
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium">¿Qué porcentaje del proyecto sería aporte propio?</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      className="w-full rounded-md border px-2 py-1.5 text-sm"
                      placeholder="Ej: 20"
                      value={porcentajeAporte}
                      onChange={(e) => handleChangePorcentajeAporte(e.target.value)}
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Debe estar entre 0% y 100%. Si no estás seguro, puedes dejarlo en blanco.
                  </p>
                </label>
              </div>
            )}
          </div>

          {/* Uso de fondos + IA */}
          <div className="space-y-2">
            <p className="text-xs font-medium">¿En qué usarías principalmente estos fondos?</p>

            <div className="flex gap-3 items-stretch">
              <textarea
               className="w-full min-h-[120px] rounded-md border px-2 py-1.5 text-sm"
               placeholder={`Ej:\n- 2.000.000 para capital de trabajo...\n- 1.500.000 para marketing...\n- 1.500.000 para equipamiento...`}
               value={usosPrincipales}
               onChange={(e) => {
                   const v = e.target.value;
                   setUsosPrincipales(v);
                // ✅ guarda al tiro en local para que no se pierda al navegar
                   persistLocal({ usosPrincipales: v });
               }}
              />

              <button
                type="button"
                onClick={handleImproveUsosWithAI}
                disabled={aiLoading}
                title="Proponer uso de fondos con IA Aret3"
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
                  Uso fondos
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
            Volver a F2
          </Button>

          <div className="flex flex-col items-end gap-1">
            {savedMsg && (
              <p className="text-[11px] text-muted-foreground max-w-xs text-right">{savedMsg}</p>
            )}
            <Button
              onClick={handleSaveAndContinue}
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
