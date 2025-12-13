// app/funding/[sessionId]/f5/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

type F5Payload = {
  step: "F5";
  lider: {
    nombre: string | null;
    rol: string | null;
    resumen: string | null;
  };
  equipo: string | null;
  brechas: string | null;
};

// 🔁 Igual que F1: nos basta con founderName + postulante
type LegacyForm = {
  founderName?: string;
  postulante?: {
    nombreCompleto?: string | null;
    representanteNombre?: string | null;
    [key: string]: any;
  } | null;
  [key: string]: any;
};

function safeJsonParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

// Igual que F1
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

export default function FundingStep5TeamPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string | undefined;

  const storageKey = useMemo(
    () => (sessionId ? `aret3:funding:f5:${sessionId}` : ""),
    [sessionId]
  );

  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("");
  const [resumen, setResumen] = useState("");

  const [equipo, setEquipo] = useState("");
  const [brechas, setBrechas] = useState("");

  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const didHydrateFromLocal = useRef(false);

  // ✅ Igual que F1: guardar legacy una sola vez
  const legacyRef = useRef<LegacyForm | null>(null);
  useEffect(() => {
    try {
      const global = typeof window !== "undefined" ? (window as any).__arete : undefined;
      const legacyFromGlobal: LegacyForm | null = global?.form ?? null;
      const legacyFromStorage: LegacyForm | null =
        readJSON<LegacyForm>("arete:legacyForm") ?? readJSON<LegacyForm>("arete:form");

      legacyRef.current = legacyFromGlobal ?? legacyFromStorage ?? null;
    } catch (e) {
      console.error("[F5 Equipo] Error leyendo legacyForm:", e);
    }
  }, []);

  if (!sessionId) {
    return (
      <main className="container max-w-3xl mx-auto py-8">
        <p className="text-sm text-red-600">No se encontró el identificador (ID) de sesión.</p>
      </main>
    );
  }

  const handleBack = () => router.push(`/funding/${sessionId}/f4`);

  const buildPayload = (): F5Payload => ({
    step: "F5",
    lider: {
      nombre: nombre.trim() ? nombre.trim() : null,
      rol: rol.trim() ? rol.trim() : null,
      resumen: resumen.trim() ? resumen.trim() : null,
    },
    equipo: equipo.trim() ? equipo.trim() : null,
    brechas: brechas.trim() ? brechas.trim() : null,
  });

  const saveToDb = async (data: F5Payload) => {
    const res = await fetch("/api/funding-session/save-step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, data }),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok && !!json?.ok, json };
  };

  async function readStepFromDb(step: string) {
    const qs = new URLSearchParams({ sessionId: sessionId ?? "", step }).toString();
    const res = await fetch(`/api/funding-session/save-step?${qs}`, { method: "GET" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.ok) return null;
    return (json?.data as any) ?? null;
  }

  // Hidratación F5 (local → DB)
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setHydrating(true);
      setErrorMsg(null);

      const local = safeJsonParse<F5Payload>(localStorage.getItem(storageKey));
      if (local?.step === "F5") {
        didHydrateFromLocal.current = true;
        setNombre(local.lider?.nombre ?? "");
        setRol(local.lider?.rol ?? "");
        setResumen(local.lider?.resumen ?? "");
        setEquipo(local.equipo ?? "");
        setBrechas(local.brechas ?? "");
      }

      try {
        const db = await readStepFromDb("F5");
        if (!cancelled && db?.step === "F5" && !didHydrateFromLocal.current) {
          setNombre(db.lider?.nombre ?? "");
          setRol(db.lider?.rol ?? "");
          setResumen(db.lider?.resumen ?? "");
          setEquipo(db.equipo ?? "");
          setBrechas(db.brechas ?? "");
        }
      } catch (e) {
        console.warn("[F5 Equipo] No pudimos leer desde base de datos:", e);
      } finally {
        if (!cancelled) setHydrating(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [sessionId, storageKey]);

  // ✅ Prefill nombre “como F1”: desde legacyForm (una vez, sin pisar si ya hay nombre)
  useEffect(() => {
    if (hydrating) return;
    if (nombre.trim()) return;

    const legacy = legacyRef.current;
    if (!legacy) return;

    const postulante = legacy.postulante ?? {};
    const candidate = (
      postulante.nombreCompleto ??
      postulante.representanteNombre ??
      legacy.founderName ??
      ""
    )
      .toString()
      .trim();

    if (candidate) setNombre(candidate);
  }, [hydrating, nombre]);

  // Autosave (local + DB)
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
          console.error("[F5 Equipo] Error guardando autosave:", out.json);
          setErrorMsg("No pudimos guardar en base de datos. Tu avance queda en este navegador.");
          return;
        }
        setSavedMsg("Guardado.");
      } catch (e) {
        console.error("[F5 Equipo] Error de red en autosave:", e);
        setErrorMsg("Problema de conexión. Tu avance queda en este navegador.");
      }
    }, 650);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nombre, rol, resumen, equipo, brechas, hydrating]);

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
        console.error("[F5 Equipo] Error al guardar:", out.json);
        setErrorMsg("No pudimos guardar este paso. Revisa tu conexión e intenta de nuevo.");
        return;
      }
      setSavedMsg("Guardado.");
      router.push(`/funding/${sessionId}/f6`);
    } catch (e) {
      console.error("[F5 Equipo] Error de red:", e);
      setErrorMsg("No pudimos conectar con el servidor. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="container max-w-3xl mx-auto py-8 space-y-4">
      <header className="mb-4 text-center space-y-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Módulo de financiamiento</p>
        <h1 className="text-2xl font-semibold">Paso F5 – Equipo y capacidades</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-xl mx-auto">
          Lo mínimo que te piden casi siempre: quién lidera, qué saben hacer y qué te falta.
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px]">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
            F5 de F8 · Equipo
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
        <CardHeader className="space-y-2">
          <p className="text-sm font-medium">Líder del proyecto</p>
          <p className="text-xs text-muted-foreground">
            No inventes credenciales: describe lo real. Si falta algo, deja “[completar]”.
          </p>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-xs font-medium">Nombre (opcional)</label>
              <input
                className="w-full rounded-md border px-2 py-1.5 text-sm"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium">Rol (opcional)</label>
              <input
                className="w-full rounded-md border px-2 py-1.5 text-sm"
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                placeholder="Ej: Fundador(a), Diseño/Producción, Comercial"
              />
            </div>
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-medium">Resumen del líder (1 párrafo)</label>
            <textarea
              className="w-full min-h-[90px] rounded-md border px-2 py-1.5 text-sm"
              value={resumen}
              onChange={(e) => setResumen(e.target.value)}
              placeholder="Ej: Experiencia en joyería, ventas online, diseño, etc. [completar]"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-medium">Equipo actual (opcional)</label>
            <textarea
              className="w-full min-h-[90px] rounded-md border px-2 py-1.5 text-sm"
              value={equipo}
              onChange={(e) => setEquipo(e.target.value)}
              placeholder="Ej: Producción, marketing, finanzas, logística… [completar]"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-xs font-medium">Brechas / apoyos que necesitas (opcional)</label>
            <textarea
              className="w-full min-h-[90px] rounded-md border px-2 py-1.5 text-sm"
              value={brechas}
              onChange={(e) => setBrechas(e.target.value)}
              placeholder="Ej: Packaging, e-commerce, performance ads, contabilidad… [completar]"
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center gap-2">
          <Button variant="outline" onClick={handleBack} disabled={saving}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Volver a F4
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
