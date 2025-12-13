// app/funding/[sessionId]/f7/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, RefreshCwIcon } from "lucide-react";

type FundingDrafts = {
  resumen_ejecutivo: string;
  descripcion_negocio_y_producto: string;
  problema_y_oportunidad: string;
  propuesta_valor_y_solucion: string;
  mercado_y_clientes_objetivo: string;
  traccion_y_estado_actual: string;
  modelo_de_negocio_y_ingresos: string;
  monto_y_uso_de_fondos: string;
  impacto_y_resultados_esperados: string;
  equipo_y_capacidades: string;
};

type F7Links = {
  webUrl: string | null;
  deckUrl: string | null;
  videoUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
};

type F7Payload = {
  step: "F7";
  links: F7Links;
  drafts?: FundingDrafts | null;
  draftsGeneratedAt?: string | null;
};

function safeJsonParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export default function FundingStep7Page() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string | undefined;

  const storageKey = useMemo(
    () => (sessionId ? `aret3:funding:f7:${sessionId}` : ""),
    [sessionId]
  );

  const [hydrating, setHydrating] = useState(true);

  const [webUrl, setWebUrl] = useState("");
  const [deckUrl, setDeckUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<FundingDrafts | null>(null);
  const [draftsGeneratedAt, setDraftsGeneratedAt] = useState<string | null>(null);
  const [lastCached, setLastCached] = useState<boolean | null>(null);


  if (!sessionId) {
    return (
      <main className="container max-w-3xl mx-auto py-8">
        <p className="text-sm text-red-600">No se encontró el identificador (ID) de sesión.</p>
      </main>
    );
  }

  const handleBack = () => router.push(`/funding/${sessionId}/f6`);
  const handleGoBackToReport = () => router.push("/?tab=explain");

  const buildLinks = (): F7Links => ({
    webUrl: webUrl.trim() ? webUrl.trim() : null,
    deckUrl: deckUrl.trim() ? deckUrl.trim() : null,
    videoUrl: videoUrl.trim() ? videoUrl.trim() : null,
    instagramUrl: instagramUrl.trim() ? instagramUrl.trim() : null,
    linkedinUrl: linkedinUrl.trim() ? linkedinUrl.trim() : null,
  });

  const buildPayload = (opts?: {
    drafts?: FundingDrafts | null;
    draftsGeneratedAt?: string | null;
  }): F7Payload => ({
    step: "F7",
    links: buildLinks(),
    drafts: opts?.drafts ?? drafts ?? null,
    draftsGeneratedAt: opts?.draftsGeneratedAt ?? draftsGeneratedAt ?? null,
  });

  const saveToDb = async (data: F7Payload) => {
    const res = await fetch("/api/funding-session/save-step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, data }),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok && !!json?.ok, json };
  };

  // 1) Rehidratar (localStorage → base de datos)
// 1) Rehidratar (DB es fuente de verdad; localStorage es fallback)
useEffect(() => {
  let cancelled = false;

  async function run() {
    setHydrating(true);
    setError(null);

    const local = safeJsonParse<F7Payload>(localStorage.getItem(storageKey));

    try {
      const qs = new URLSearchParams({ sessionId: sessionId ?? "", step: "F7" }).toString();
      const res = await fetch(`/api/funding-session/save-step?${qs}`, { method: "GET" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || "DB_READ_FAILED");

      const db: F7Payload | null = (json?.data as any) ?? null;

      // Merge: DB manda (sobre todo drafts). Local solo rellena si DB no trae.
      const merged: F7Payload | null =
        db?.step === "F7"
          ? {
              step: "F7",
              links: {
                webUrl: db.links?.webUrl ?? local?.links?.webUrl ?? null,
                deckUrl: db.links?.deckUrl ?? local?.links?.deckUrl ?? null,
                videoUrl: db.links?.videoUrl ?? local?.links?.videoUrl ?? null,
                instagramUrl: db.links?.instagramUrl ?? local?.links?.instagramUrl ?? null,
                linkedinUrl: db.links?.linkedinUrl ?? local?.links?.linkedinUrl ?? null,
              },
              drafts: db.drafts ?? local?.drafts ?? null,
              draftsGeneratedAt: db.draftsGeneratedAt ?? local?.draftsGeneratedAt ?? null,
            }
          : local?.step === "F7"
            ? local
            : null;

      if (!cancelled && merged?.step === "F7") {
        setWebUrl(merged.links?.webUrl ?? "");
        setDeckUrl(merged.links?.deckUrl ?? "");
        setVideoUrl(merged.links?.videoUrl ?? "");
        setInstagramUrl(merged.links?.instagramUrl ?? "");
        setLinkedinUrl(merged.links?.linkedinUrl ?? "");
        setDrafts(merged.drafts ?? null);
        setDraftsGeneratedAt(merged.draftsGeneratedAt ?? null);
      }
    } catch (e) {
      console.warn("[F7] No pudimos leer desde base de datos:", e);

      // Fallback: solo local
      if (!cancelled && local?.step === "F7") {
        setWebUrl(local.links?.webUrl ?? "");
        setDeckUrl(local.links?.deckUrl ?? "");
        setVideoUrl(local.links?.videoUrl ?? "");
        setInstagramUrl(local.links?.instagramUrl ?? "");
        setLinkedinUrl(local.links?.linkedinUrl ?? "");
        setDrafts(local.drafts ?? null);
        setDraftsGeneratedAt(local.draftsGeneratedAt ?? null);
      }
    } finally {
      if (!cancelled) setHydrating(false);
    }
  }

  run();
  return () => {
    cancelled = true;
  };
}, [sessionId, storageKey]);


  // 2) Autosave links con debounce
  useEffect(() => {
    if (hydrating) return;

    const data = buildPayload();

    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {}

    setSavedMsg(null);

    const t = window.setTimeout(async () => {
      try {
        const out = await saveToDb(data);
        if (!out.ok) {
          console.error("[F7] Error guardando autosave:", out.json);
          setError("No pudimos guardar en base de datos. Tus links siguen en este navegador.");
          return;
        }
        setError(null);
        setSavedMsg("Guardado.");
      } catch (e) {
        console.error("[F7] Error de red en autosave:", e);
        setError("Problema de conexión. Tus links siguen en este navegador.");
      }
    }, 650);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webUrl, deckUrl, videoUrl, instagramUrl, linkedinUrl, hydrating, drafts, draftsGeneratedAt]);

  const callDrafts = async (opts: { force: boolean }) => {
    setLoading(true);
    setError(null);
    setSavedMsg(null);

    const url = `/api/funding-session/${sessionId}/drafts${opts.force ? "?force=1" : ""}`;
    const res = await fetch(url, { method: "POST", cache: "no-store" });
    const raw = await res.text();

    if (!raw) {
      console.error("[F7] Respuesta vacía desde drafts. Status:", res.status);
      throw new Error("EMPTY_RESPONSE");
    }

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error("[F7] Respuesta no-JSON desde drafts:", raw);
      throw new Error("NON_JSON");
    }

    if (!res.ok || !data.ok) {
      console.error("[F7] Error lógico en drafts:", data);
      const msg =
        data?.error === "no_credits"
          ? "No tienes créditos suficientes para generar estos borradores."
          : data?.error || "Ocurrió un problema al generar los borradores.";
      throw new Error(msg);
    }

    const newDrafts = data.drafts as FundingDrafts;
    const genAt = (data?.draftsGeneratedAt as string | undefined) ?? new Date().toISOString();

    setDrafts(newDrafts);
    setDraftsGeneratedAt(genAt);
    setLastCached(!!data?.cached);

    const payload = buildPayload({ drafts: newDrafts, draftsGeneratedAt: genAt });

    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {}

    setSaving(true);
    const out = await saveToDb(payload);
    if (!out.ok) {
      console.error("[F7] No pudimos guardar drafts en base de datos:", out.json);
      setError("Generamos los borradores, pero no pudimos guardarlos en base de datos. Quedaron en este navegador.");
      return;
    }

    if (data?.cached) {
      setSavedMsg("Borradores cargados (ya existían).");
    } else if (opts.force) {
      setSavedMsg("Borradores regenerados.");
    } else {
      setSavedMsg("Borradores guardados.");
    }
  };

  const handleGenerateDrafts = async (force: boolean) => {
    try {
      await callDrafts({ force });
    } catch (e: any) {
      setError(e?.message || "No pudimos conectar con el servidor. Intenta nuevamente.");
    } finally {
      setLoading(false);
      setSaving(false);
    }
  };

  return (
    <main className="container max-w-3xl mx-auto py-8 space-y-4">
      <header className="mb-4 text-center space-y-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Módulo Resumen</p>
        <h1 className="text-2xl font-semibold">Paso F7 – Resumen y borradores finales</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-xl mx-auto">
          Listo. Ya tenemos perfil (F1), estado (F2), monto/uso (F3), impacto (F4), equipo (F5) e instrumento (F6).
          Ahora armamos los borradores.
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px]">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
            F7 de F8 · Borrador Formulario
          </span>
          <span className="text-slate-400">
            ID sesión:{" "}
            <code className="font-mono text-[10px] bg-slate-50 px-1.5 py-0.5 rounded">{sessionId}</code>
          </span>
        </div>

        {(hydrating || savedMsg || error) && (
          <div className="mt-2 flex items-center justify-center">
            {hydrating && <span className="text-[11px] text-slate-400">Cargando tu progreso…</span>}
            {!hydrating && savedMsg && <span className="text-[11px] text-muted-foreground">{savedMsg}</span>}
            {!hydrating && error && <span className="text-[11px] text-red-600">{error}</span>}
          </div>
        )}
      </header>

      <Card>
        <CardHeader className="space-y-2">
          <p className="text-sm font-medium">Links opcionales (si tienes)</p>
          <p className="text-xs text-muted-foreground">
            Esto ayuda mucho cuando una postulación pide “sitio web”, “pitch deck”, “video”, etc.
          </p>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-3">
            <div className="grid gap-1">
              <label className="text-xs font-medium">Sitio web</label>
              <input className="w-full rounded-md border px-2 py-1.5 text-sm" value={webUrl} onChange={(e) => setWebUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div className="grid gap-1">
              <label className="text-xs font-medium">Pitch deck (PDF/Drive/Notion)</label>
              <input className="w-full rounded-md border px-2 py-1.5 text-sm" value={deckUrl} onChange={(e) => setDeckUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div className="grid gap-1">
              <label className="text-xs font-medium">Video pitch</label>
              <input className="w-full rounded-md border px-2 py-1.5 text-sm" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div className="grid gap-1">
              <label className="text-xs font-medium">Instagram</label>
              <input className="w-full rounded-md border px-2 py-1.5 text-sm" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." />
            </div>

            <div className="grid gap-1">
              <label className="text-xs font-medium">LinkedIn</label>
              <input className="w-full rounded-md border px-2 py-1.5 text-sm" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/..." />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 text-xs sm:text-sm">
            <p className="font-semibold mb-1">Generar borradores</p>
            <p className="text-muted-foreground">
              Genera bloques listos para copiar/pegar en formularios de Sercotec, Corfo, fondos municipales y bancos.
            </p>
          </div>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-muted-foreground">
              Generar borradores con IA aret3 usa <strong>1 crédito</strong>. Regenerar no debería cobrar doble si ya se cobró para esta sesión.
            </p>

            <div className="flex gap-2 justify-center sm:justify-end">
              <Button
                onClick={() => handleGenerateDrafts(false)}
                disabled={loading || saving}
                className={`
                  inline-flex items-center justify-center gap-2
                  rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-slate-900
                  px-3.5 py-2 text-[11px] font-medium text-white shadow-md
                  transition-all duration-300
                  hover:from-emerald-500 hover:to-emerald-700
                  active:scale-[0.98]
                `}
              >
                <img src="/aret3-logo.svg" alt="aret3" className="h-6 w-6 rounded-full shadow-[0_0_6px_rgba(56,189,248,0.9)]" loading="lazy" />
                <span className="whitespace-nowrap">{loading ? "Generando..." : saving ? "Guardando..." : "Generar"}</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleGenerateDrafts(true)}
                disabled={loading || saving || !drafts}
                title={!drafts ? "Primero genera borradores" : "Forzar regeneración"}
                className="rounded-xl px-3.5 py-2 text-[11px]"
              >
                <RefreshCwIcon className="mr-2 h-4 w-4" />
                Regenerar
              </Button>
            </div>
          </div>

          {drafts && (
            <div className="mt-4 space-y-3 text-xs sm:text-sm">
              <p className="font-semibold text-slate-700">
                Borradores{" "}
                {draftsGeneratedAt ? (
                  <span className="text-[11px] text-slate-400 font-normal">
                    · {new Date(draftsGeneratedAt).toLocaleString("es-CL")}
                    {lastCached ? " · cached" : ""}
                  </span>
                ) : null}
              </p>

              <div className="grid gap-3">
                {[
                  ["1. Resumen ejecutivo", drafts.resumen_ejecutivo],
                  ["2. Descripción del negocio y producto/servicio", drafts.descripcion_negocio_y_producto],
                  ["3. Problema u oportunidad", drafts.problema_y_oportunidad],
                  ["4. Propuesta de valor y solución", drafts.propuesta_valor_y_solucion],
                  ["5. Mercado y clientes objetivo", drafts.mercado_y_clientes_objetivo],
                  ["6. Tracción y estado actual del negocio", drafts.traccion_y_estado_actual],
                  ["7. Modelo de negocio e ingresos", drafts.modelo_de_negocio_y_ingresos],
                  ["8. Monto y uso de fondos", drafts.monto_y_uso_de_fondos],
                  ["9. Impacto e indicadores esperados", drafts.impacto_y_resultados_esperados],
                  ["10. Equipo y capacidades", drafts.equipo_y_capacidades],
                ].map(([title, text]) => (
                  <div key={title as string} className="rounded-md border bg-white px-3 py-2">
                    <p className="text-[11px] font-semibold mb-1">{title as string}</p>
                    <p className="whitespace-pre-line text-slate-700">{text as string}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between items-center gap-2">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Volver a F6
          </Button>

          <Button
            onClick={handleGoBackToReport}
            className={`
              inline-flex items-center justify-center gap-2
              rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-slate-900
              px-3.5 py-2 text-[11px] font-medium text-white shadow-md
              transition-all duration-300
              hover:from-emerald-500 hover:to-emerald-700
              active:scale-[0.98]
            `}
          >
            <img src="/aret3-logo.svg" alt="aret3" className="h-6 w-6 rounded-full shadow-[0_0_6px_rgba(56,189,248,0.9)]" loading="lazy" />
            <span className="whitespace-nowrap">Volver al informe</span>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
