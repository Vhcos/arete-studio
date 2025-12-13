//app/funding/[sessionId]/f6/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

const TIPO_INSTRUMENTO_OPTIONS = [
  { id: "subsidio", label: "Subsidio no reembolsable" },
  { id: "credito", label: "Crédito bancario / línea de financiamiento" },
  { id: "capital_semilla", label: "Capital semilla / incubadoras / aceleradoras" },
  { id: "fondos_publicos", label: "Fondos municipales / regionales / públicos" },
  { id: "no_seguro", label: "No estoy seguro, quiero sugerencias" },
] as const;

const INSTITUCION_PREFERIDA_OPTIONS = [
  { id: "sercotec", label: "Sercotec" },
  { id: "corfo", label: "Corfo" },
  { id: "startup_chile", label: "Start-Up Chile / programas de aceleración" },
  { id: "municipalidad", label: "Municipalidad / Gobierno Regional" },
  { id: "banco", label: "Banco / cooperativa" },
  { id: "otro", label: "Otro / sin preferencia" },
] as const;

type F6Payload = {
  step: "F6";
  tipoInstrumento: string;
  institucionesPreferidas: string[];
  dispuestoEndeudarse: "si" | "no" | "";
  plazoUsoFondos: string | null;
  comentariosExtra: string | null;
};

function safeJsonParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export default function FundingStep6InstrumentoPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string | undefined;

  const storageKey = useMemo(
    () => (sessionId ? `aret3:funding:f6:${sessionId}` : ""),
    [sessionId]
  );

  const [tipoInstrumento, setTipoInstrumento] = useState<string>("subsidio");
  const [institucionesPreferidas, setInstitucionesPreferidas] = useState<string[]>([]);
  const [dispuestoEndeudarse, setDispuestoEndeudarse] = useState<"si" | "no" | "">("");
  const [plazoUsoFondos, setPlazoUsoFondos] = useState<string>("");
  const [comentariosExtra, setComentariosExtra] = useState<string>("");

  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const didHydrateFromLocal = useRef(false);

  if (!sessionId) {
    return (
      <main className="container max-w-3xl mx-auto py-8">
        <p className="text-sm text-red-600">No se encontró el identificador (ID) de sesión.</p>
      </main>
    );
  }

  const handleBack = () => router.push(`/funding/${sessionId}/f5`);

  const toggleInstitucion = (id: string) => {
    setInstitucionesPreferidas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const buildPayload = (): F6Payload => ({
    step: "F6",
    tipoInstrumento,
    institucionesPreferidas,
    dispuestoEndeudarse,
    plazoUsoFondos: plazoUsoFondos || null,
    comentariosExtra: comentariosExtra || null,
  });

  const saveToDb = async (data: F6Payload) => {
    const res = await fetch("/api/funding-session/save-step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, data }),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok && !!json?.ok, json };
  };

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setHydrating(true);
      setErrorMsg(null);

      const local = safeJsonParse<F6Payload>(localStorage.getItem(storageKey));
      if (local?.step === "F6") {
        didHydrateFromLocal.current = true;
        setTipoInstrumento(local.tipoInstrumento ?? "subsidio");
        setInstitucionesPreferidas(local.institucionesPreferidas ?? []);
        setDispuestoEndeudarse((local.dispuestoEndeudarse as any) ?? "");
        setPlazoUsoFondos(local.plazoUsoFondos ?? "");
        setComentariosExtra(local.comentariosExtra ?? "");
      }

      try {
       const qs = new URLSearchParams({ sessionId: sessionId ?? "", step: "F6" }).toString();
        const res = await fetch(`/api/funding-session/save-step?${qs}`, { method: "GET" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.ok) throw new Error(json?.error || "DB_READ_FAILED");

        const db: F6Payload | null = (json?.data as any) ?? null;

        if (!cancelled && db?.step === "F6" && !didHydrateFromLocal.current) {
          setTipoInstrumento(db.tipoInstrumento ?? "subsidio");
          setInstitucionesPreferidas(db.institucionesPreferidas ?? []);
          setDispuestoEndeudarse((db.dispuestoEndeudarse as any) ?? "");
          setPlazoUsoFondos(db.plazoUsoFondos ?? "");
          setComentariosExtra(db.comentariosExtra ?? "");
        }
      } catch (e) {
        console.warn("[F6] No pudimos leer desde base de datos:", e);
      } finally {
        if (!cancelled) setHydrating(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [sessionId, storageKey]);

  useEffect(() => {
    if (hydrating) return;

    const data = buildPayload();

    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {}

    setSavedMsg(null);
    setErrorMsg(null);

    const t = window.setTimeout(async () => {
      try {
        const out = await saveToDb(data);
        if (!out.ok) {
          console.error("[F6] Error guardando autosave:", out.json);
          setErrorMsg("No pudimos guardar en base de datos. Tu avance queda en este navegador.");
          return;
        }
        setSavedMsg("Guardado.");
      } catch (e) {
        console.error("[F6] Error de red en autosave:", e);
        setErrorMsg("Problema de conexión. Tu avance queda en este navegador.");
      }
    }, 650);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoInstrumento, institucionesPreferidas, dispuestoEndeudarse, plazoUsoFondos, comentariosExtra, hydrating]);

  const handleSaveAndContinue = async () => {
    setSaving(true);
    setSavedMsg(null);
    setErrorMsg(null);

    const data = buildPayload();

    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {}

    try {
      const out = await saveToDb(data);
      if (!out.ok) {
        console.error("[F6] Error al guardar:", out.json);
        setErrorMsg("No pudimos guardar este paso. Revisa tu conexión e intenta de nuevo.");
        return;
      }
      setSavedMsg("Guardado.");
      router.push(`/funding/${sessionId}/f7`);
    } catch (e) {
      console.error("[F6] Error de red:", e);
      setErrorMsg("No pudimos conectar con el servidor. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="container max-w-3xl mx-auto py-8 space-y-4">
      <header className="mb-4 text-center space-y-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Módulo de financiamiento</p>
        <h1 className="text-2xl font-semibold">Paso F6 – Tipo de instrumento y preferencias</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-xl mx-auto">
          Esto ayuda a ajustar el lenguaje según subsidio, crédito o fondos locales.
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px]">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
            F6 de 8 · Tipo de..
          </span>
          <span className="text-slate-400">
            ID sesión:{" "}
            <code className="font-mono text-[10px] bg-slate-50 px-1.5 py-0.5 rounded">{sessionId}</code>
          </span>
        </div>

        {(hydrating || savedMsg || errorMsg) && (
          <div className="mt-2 flex items-center justify-center">
            {hydrating && <span className="text-[11px] text-slate-400">Cargando tu progreso…</span>}
            {!hydrating && savedMsg && <span className="text-[11px] text-muted-foreground">{savedMsg}</span>}
            {!hydrating && errorMsg && <span className="text-[11px] text-red-600">{errorMsg}</span>}
          </div>
        )}
      </header>

      <Card>
        <CardHeader className="pb-3 space-y-4">
          <div>
            <p className="text-sm font-medium">¿Qué tipo de financiamiento buscas?</p>
            <div className="grid gap-2 sm:grid-cols-2 mt-2">
              {TIPO_INSTRUMENTO_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTipoInstrumento(opt.id)}
                  className={`
                    rounded-lg border px-3 py-2 text-xs text-left transition
                    ${
                      tipoInstrumento === opt.id
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">¿Con qué instituciones te gustaría postular?</p>
            <p className="text-[11px] text-muted-foreground mb-1">Puedes seleccionar una o varias.</p>
            <div className="flex flex-wrap gap-2 mt-1 text-xs">
              {INSTITUCION_PREFERIDA_OPTIONS.map((opt) => {
                const active = institucionesPreferidas.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleInstitucion(opt.id)}
                    className={`
                      rounded-full border px-3 py-1 transition
                      ${active ? "border-primary bg-primary text-white" : "border-slate-300 text-slate-600 hover:bg-slate-50"}
                    `}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          <div className="space-y-2">
            <p className="text-xs font-medium">
              Si una opción implica endeudarse (créditos, leasing, etc.), ¿estarías dispuesto/a?
            </p>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDispuestoEndeudarse("si")}
                className={`rounded-full px-3 py-1 border transition ${
                  dispuestoEndeudarse === "si" ? "border-primary bg-primary text-white" : "border-slate-300 text-slate-600"
                }`}
              >
                Sí, abierto a evaluarlo
              </button>
              <button
                type="button"
                onClick={() => setDispuestoEndeudarse("no")}
                className={`rounded-full px-3 py-1 border transition ${
                  dispuestoEndeudarse === "no" ? "border-primary bg-primary text-white" : "border-slate-300 text-slate-600"
                }`}
              >
                Prefiero solo subsidios / no quiero deuda
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium">¿En qué plazo usarías la mayor parte de los fondos?</p>
            <select
              className="mt-1 w-full max-w-xs rounded-md border px-2 py-1.5 text-sm"
              value={plazoUsoFondos}
              onChange={(e) => setPlazoUsoFondos(e.target.value)}
            >
              <option value="">Selecciona una opción</option>
              <option value="3_6">Entre 3 y 6 meses</option>
              <option value="6_12">Entre 6 y 12 meses</option>
              <option value="mas_12">Más de 12 meses</option>
            </select>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium">Comentarios adicionales (opcional)</p>
            <textarea
              className="w-full min-h-[100px] rounded-md border px-2 py-1.5 text-sm"
              value={comentariosExtra}
              onChange={(e) => setComentariosExtra(e.target.value)}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center gap-2">
          <Button variant="outline" onClick={handleBack} disabled={saving}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Volver a F5
          </Button>

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
        </CardFooter>
      </Card>
    </main>
  );
}
