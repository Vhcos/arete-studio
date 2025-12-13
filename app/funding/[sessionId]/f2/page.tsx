"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

const ESTADO_NEGOCIO_OPTIONS = [
  { id: "idea", label: "Solo idea, todavía no he empezado" },
  { id: "marcha_sin_ventas", label: "En marcha, pero sin ventas aún" },
  { id: "primeras_ventas", label: "Tengo primeras ventas" },
  { id: "ventas_recurrentes", label: "Ventas recurrentes (más de 6 meses)" },
];

// Tipo amplio para no romper si vienen más campos
type LegacyForm = {
  meta?: {
    savedAt?: string;
    [key: string]: any;
  } | null;
  plan?: {
    ventaAnual?: number;
    ventaMensual?: number;
    ingresosMeta?: number;
    ticket?: number;
    [key: string]: any;
  } | null;
  [key: string]: any;
};

type PlanPreview = {
  ventaAnual?: number;
  ventaMensual?: number;
  ingresosMeta?: number;
  ticket?: number;
  [key: string]: any;
};

type F2Draft = {
  estadoNegocio?: string;
  anioInicio?: string;
  ventasMensuales?: string; // formateado
  clientesMensuales?: string;
  tieneFormalizacion?: "si" | "no" | "";
  tipoFormalizacion?: string;
  tieneEmpleados?: "si" | "no" | "";
  numEmpleados?: string;
  updatedAt?: number;
};

// ---------- Local storage helpers ----------
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
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function f2StorageKey(sessionId: string) {
  return `aret3:funding:f2:${sessionId}`;
}

export default function FundingStep2Page() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string | undefined;

  // Estado del negocio / avance
  const [estadoNegocio, setEstadoNegocio] = useState<string>("idea");
  const [anioInicio, setAnioInicio] = useState<string>("");

  // Ventas / clientes (estos son “realidad del negocio”, no proyección del plan)
  const [ventasMensuales, setVentasMensuales] = useState<string>(""); // formateado con puntos
  const [clientesMensuales, setClientesMensuales] = useState<string>("");

  const [tieneFormalizacion, setTieneFormalizacion] = useState<"si" | "no" | "">("");
  const [tipoFormalizacion, setTipoFormalizacion] = useState<string>("");
  const [tieneEmpleados, setTieneEmpleados] = useState<"si" | "no" | "">("");
  const [numEmpleados, setNumEmpleados] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Validaciones UX
  const [errVentas, setErrVentas] = useState<string | null>(null);
  const [errClientes, setErrClientes] = useState<string | null>(null);

  // Backups para no perder lo que escribió el usuario si cambia a “sin ventas”
  const ventasBackupRef = useRef<string>("");
  const clientesBackupRef = useRef<string>("");

  const requiresSalesNumbers =
    estadoNegocio === "primeras_ventas" || estadoNegocio === "ventas_recurrentes";
  const isNoSalesStage =
    estadoNegocio === "idea" || estadoNegocio === "marcha_sin_ventas";

  // --------- Hidratación: primero draft local, luego sugerencias mínimas ----------
  useEffect(() => {
    if (!sessionId) return;

    try {
      // 1) Draft por sesión (esto evita el “me deja atrapado” y reseteos al volver)
      const draft = readJSON<F2Draft>(f2StorageKey(sessionId));
      if (draft) {
        if (draft.estadoNegocio) setEstadoNegocio(draft.estadoNegocio);
        if (draft.anioInicio) setAnioInicio(draft.anioInicio);

        if (typeof draft.ventasMensuales === "string") setVentasMensuales(draft.ventasMensuales);
        if (typeof draft.clientesMensuales === "string") setClientesMensuales(draft.clientesMensuales);

        if (typeof draft.tieneFormalizacion === "string") setTieneFormalizacion(draft.tieneFormalizacion);
        if (typeof draft.tipoFormalizacion === "string") setTipoFormalizacion(draft.tipoFormalizacion);
        if (typeof draft.tieneEmpleados === "string") setTieneEmpleados(draft.tieneEmpleados);
        if (typeof draft.numEmpleados === "string") setNumEmpleados(draft.numEmpleados);
      }

      // 2) Año sugerido (si no hay draft)
      if (!draft?.anioInicio) {
        const global = (window as any).__arete;
        const legacyFromGlobal: LegacyForm | null = global?.form ?? null;

        const legacyFromStorage: LegacyForm | null =
          readJSON<LegacyForm>("arete:legacyForm") ?? readJSON<LegacyForm>("arete:form");

        const legacy: LegacyForm | null = legacyFromGlobal ?? legacyFromStorage;

        let year: string | null = null;
        const savedAtStr = legacy?.meta?.savedAt;
        if (savedAtStr && !Number.isNaN(Date.parse(savedAtStr))) {
          year = new Date(savedAtStr).getFullYear().toString();
        } else {
          year = new Date().getFullYear().toString();
        }
        if (year) setAnioInicio(year);
      }

      // IMPORTANTE: no inferimos estadoNegocio desde plan, y NO prellenamos ventas/clientes desde plan.
      // Este paso es “realidad del usuario”, no proyección del wizard.
    } catch (e) {
      console.error("[F2] Error al hidratar:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // --------- Persistencia local (draft por sesión) ----------
  useEffect(() => {
    if (!sessionId) return;

    const payload: F2Draft = {
      estadoNegocio,
      anioInicio,
      ventasMensuales,
      clientesMensuales,
      tieneFormalizacion,
      tipoFormalizacion,
      tieneEmpleados,
      numEmpleados,
      updatedAt: Date.now(),
    };
    writeJSON(f2StorageKey(sessionId), payload);
  }, [
    sessionId,
    estadoNegocio,
    anioInicio,
    ventasMensuales,
    clientesMensuales,
    tieneFormalizacion,
    tipoFormalizacion,
    tieneEmpleados,
    numEmpleados,
  ]);

  // --------- Regla clave: si es etapa sin ventas => 0 por defecto y bloqueado ----------
  useEffect(() => {
    // Limpia errores al cambiar etapa
    setErrVentas(null);
    setErrClientes(null);

    if (isNoSalesStage) {
      // Guardamos backups si venían números “reales”
      if (ventasMensuales && ventasMensuales !== "0") ventasBackupRef.current = ventasMensuales;
      if (clientesMensuales && clientesMensuales !== "0") clientesBackupRef.current = clientesMensuales;

      // Forzamos a 0 visible
      if (ventasMensuales !== "0") setVentasMensuales("0");
      if (clientesMensuales !== "0") setClientesMensuales("0");
      return;
    }

    // Si pasa a etapa con ventas y venía “0”, restauramos lo que el usuario había puesto antes (si existe)
    if (requiresSalesNumbers) {
      if (ventasMensuales === "0" && ventasBackupRef.current) setVentasMensuales(ventasBackupRef.current);
      if (clientesMensuales === "0" && clientesBackupRef.current) setClientesMensuales(clientesBackupRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoNegocio]);

  if (!sessionId) {
    return (
      <main className="container max-w-3xl mx-auto py-8">
        <p className="text-sm text-red-600">
          No se encontró el ID de sesión de financiamiento.
        </p>
      </main>
    );
  }

  const handleBack = () => {
    router.push(`/funding/${sessionId}`);
  };

  // Formatea ventas con separador de miles estilo LATAM
  const handleChangeVentas = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) {
      setVentasMensuales("");
      return;
    }
    const num = parseInt(digitsOnly, 10);
    if (Number.isNaN(num)) {
      setVentasMensuales("");
      return;
    }
    const formatted = num.toLocaleString("es-CL"); // 1500000 -> "1.500.000"
    setVentasMensuales(formatted);
  };

  const handleChangeClientes = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) {
      setClientesMensuales("");
      return;
    }
    const num = parseInt(digitsOnly, 10);
    if (Number.isNaN(num)) {
      setClientesMensuales("");
      return;
    }
    setClientesMensuales(String(num));
  };

  const handleChangeEmpleados = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) {
      setNumEmpleados("");
      return;
    }
    const num = parseInt(digitsOnly, 10);
    if (Number.isNaN(num)) {
      setNumEmpleados("");
      return;
    }
    setNumEmpleados(String(num));
  };

  const ventasMensualesNumber = useMemo(() => {
    if (!ventasMensuales) return null;
    const n = parseInt(ventasMensuales.replace(/\./g, ""), 10);
    return Number.isFinite(n) ? n : null;
  }, [ventasMensuales]);

  const clientesMensualesNumber = useMemo(() => {
    if (!clientesMensuales) return null;
    const n = parseInt(clientesMensuales, 10);
    return Number.isFinite(n) ? n : null;
  }, [clientesMensuales]);

  const canContinue = useMemo(() => {
    if (!requiresSalesNumbers) return true;
    const v = ventasMensualesNumber ?? 0;
    const c = clientesMensualesNumber ?? 0;
    return v > 0 && c > 0;
  }, [requiresSalesNumbers, ventasMensualesNumber, clientesMensualesNumber]);

  const handleSaveAndContinue = async () => {
    setSaving(true);
    setSavedMsg(null);
    setErrVentas(null);
    setErrClientes(null);

    // Validación: si el usuario dice que ya vende, obligamos a llenar
    if (requiresSalesNumbers) {
      const v = ventasMensualesNumber ?? 0;
      const c = clientesMensualesNumber ?? 0;

      let ok = true;
      if (!(v > 0)) {
        setErrVentas("Completa tus ventas mensuales (debe ser mayor que 0).");
        ok = false;
      }
      if (!(c > 0)) {
        setErrClientes("Completa tus clientes mensuales (debe ser mayor que 0).");
        ok = false;
      }

      if (!ok) {
        setSaving(false);
        return;
      }
    }

    const numEmpleadosNumber = numEmpleados ? parseInt(numEmpleados, 10) : null;

    // Regla: en etapas sin ventas, guardamos 0/0 sí o sí
    const payloadF2 = {
      step: "F2",
      estadoNegocio,
      anioInicio,
      ventasMensuales: isNoSalesStage ? 0 : (ventasMensualesNumber ?? null),
      clientesMensuales: isNoSalesStage ? 0 : (clientesMensualesNumber ?? null),
      tieneFormalizacion,
      tipoFormalizacion: tipoFormalizacion || null,
      tieneEmpleados,
      numEmpleados: numEmpleadosNumber,
    };

    try {
      const res = await fetch("/api/funding-session/save-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          data: payloadF2,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.error("[F2] Error al guardar paso F2:", errJson);
      } else {
        setSavedMsg("Datos del negocio guardados.");
      }
    } catch (err) {
      console.error("[F2] Error de red al guardar paso F2:", err);
    } finally {
      setSaving(false);
      router.push(`/funding/${sessionId}/f3`);
    }
  };

  return (
    <main className="container max-w-3xl mx-auto py-8 space-y-4">
      <header className="mb-4 text-center space-y-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Módulo de financiamiento
        </p>
        <h1 className="text-2xl font-semibold">
          Paso F2 – Estado y avance del negocio
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-xl mx-auto">
          Esto es tu <b>realidad hoy</b> (no la proyección del wizard). Sirve para que
          formularios y evaluadores entiendan si estás en etapa inicial o ya vendiendo.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px]">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
            F2 de F8 · Estado del negocio
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
          <p className="text-sm font-medium">¿En qué estado está tu negocio?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {ESTADO_NEGOCIO_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setEstadoNegocio(opt.id)}
                className={`
                  rounded-lg border px-3 py-2 text-xs text-left transition
                  ${
                    estadoNegocio === opt.id
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          {/* Año de inicio / antigüedad */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium">
                Año aproximado en que empezaste a trabajar en esta idea/negocio
              </span>
              <input
                type="text"
                className="w-full rounded-md border px-2 py-1.5 text-sm"
                placeholder="Ej: 2023"
                value={anioInicio}
                onChange={(e) => setAnioInicio(e.target.value)}
              />
            </label>
          </div>

          {/* Bloque: ventas y clientes (modo sin ventas vs con ventas) */}
          <div
            className={[
              "rounded-xl border p-4",
              isNoSalesStage ? "bg-slate-50 border-slate-200" : "bg-emerald-50/60 border-emerald-200",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Ventas y clientes (realidad actual)</p>
                <p className="text-[11px] text-slate-600">
                  {isNoSalesStage ? (
                    <>
                      Estás en etapa <b>sin ventas</b>. Dejamos esto en <b>0</b>.
                    </>
                  ) : (
                    <>
                      Dijiste que ya vendes. Entonces estos dos campos son <b>obligatorios</b>.
                    </>
                  )}
                </p>
              </div>
              <span
                className={[
                  "rounded-full px-2.5 py-1 text-[11px] font-medium border",
                  isNoSalesStage
                    ? "bg-white text-slate-700 border-slate-200"
                    : "bg-white text-emerald-800 border-emerald-200",
                ].join(" ")}
              >
                {isNoSalesStage ? "No aplica" : "Obligatorio"}
              </span>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-medium">
                  Ventas promedio mensuales (en tu moneda)
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  className={[
                    "w-full rounded-md border px-2 py-1.5 text-sm",
                    isNoSalesStage ? "bg-slate-100 text-slate-500" : "bg-white",
                    errVentas ? "border-rose-500" : "border-slate-200",
                  ].join(" ")}
                  placeholder={isNoSalesStage ? "0" : "Ej: 1.500.000"}
                  value={ventasMensuales}
                  onChange={(e) => handleChangeVentas(e.target.value)}
                  disabled={isNoSalesStage}
                />
                {errVentas ? (
                  <p className="text-[11px] text-rose-600">{errVentas}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    {isNoSalesStage
                      ? "Cuando pases a una etapa con ventas, se habilita este campo."
                      : "Si estás vendiendo, pon un promedio (aunque sea aproximado)."}
                  </p>
                )}
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium">
                  Clientes promedio al mes
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  className={[
                    "w-full rounded-md border px-2 py-1.5 text-sm",
                    isNoSalesStage ? "bg-slate-100 text-slate-500" : "bg-white",
                    errClientes ? "border-rose-500" : "border-slate-200",
                  ].join(" ")}
                  placeholder={isNoSalesStage ? "0" : "Ej: 40"}
                  value={clientesMensuales}
                  onChange={(e) => handleChangeClientes(e.target.value)}
                  disabled={isNoSalesStage}
                />
                {errClientes ? (
                  <p className="text-[11px] text-rose-600">{errClientes}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    {isNoSalesStage
                      ? "Cuando pases a una etapa con ventas, se habilita este campo."
                      : "Pon un promedio mensual (si es estimado, igual sirve)."}
                  </p>
                )}
              </label>
            </div>
          </div>

          {/* Formalización */}
          <div className="space-y-2">
            <p className="text-xs font-medium">¿Tienes formalización tributaria?</p>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTieneFormalizacion("si")}
                className={`rounded-full px-3 py-1 border transition ${
                  tieneFormalizacion === "si"
                    ? "border-primary bg-primary text-white"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => setTieneFormalizacion("no")}
                className={`rounded-full px-3 py-1 border transition ${
                  tieneFormalizacion === "no"
                    ? "border-primary bg-primary text-white"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                No
              </button>
            </div>

            {tieneFormalizacion === "si" && (
              <label className="mt-2 block space-y-1">
                <span className="text-xs font-medium">
                  Tipo de formalización (opcional)
                </span>
                <input
                  type="text"
                  className="w-full rounded-md border px-2 py-1.5 text-sm"
                  placeholder="Ej: Boleta, SpA, EIRL, persona natural con giro, etc."
                  value={tipoFormalizacion}
                  onChange={(e) => setTipoFormalizacion(e.target.value)}
                />
              </label>
            )}
          </div>

          {/* Empleados */}
          <div className="space-y-2">
            <p className="text-xs font-medium">
              ¿Tienes personas trabajando contigo?
            </p>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTieneEmpleados("si")}
                className={`rounded-full px-3 py-1 border transition ${
                  tieneEmpleados === "si"
                    ? "border-primary bg-primary text-white"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => setTieneEmpleados("no")}
                className={`rounded-full px-3 py-1 border transition ${
                  tieneEmpleados === "no"
                    ? "border-primary bg-primary text-white"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                No
              </button>
            </div>

            {tieneEmpleados === "si" && (
              <label className="mt-2 block space-y-1">
                <span className="text-xs font-medium">
                  ¿Cuántas personas trabajan contigo? (incluyéndote)
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full rounded-md border px-2 py-1.5 text-sm"
                  placeholder="Ej: 3"
                  value={numEmpleados}
                  onChange={(e) => handleChangeEmpleados(e.target.value)}
                />
              </label>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center gap-2">
          <Button variant="outline" onClick={handleBack} disabled={saving}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Volver a F1
          </Button>

          <div className="flex flex-col items-end gap-1">
            {savedMsg && (
              <p className="text-[11px] text-muted-foreground max-w-xs text-right">
                {savedMsg}
              </p>
            )}
            <Button
              onClick={handleSaveAndContinue}
              disabled={saving || !canContinue}
              title={
                !canContinue
                  ? "Completa ventas y clientes (mayores que 0) para continuar."
                  : ""
              }
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
                <span className="whitespace-nowrap">
                  {saving ? "Guardando..." : "Guardar y continuar"}
                </span>
              </div>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
