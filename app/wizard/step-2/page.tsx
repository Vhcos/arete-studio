// app/wizard/step-2/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { NextButton, PrevButton } from "@/components/wizard/WizardNav";
import UpsellBanner from "@/components/wizard/UpsellBanner";
import BotIcon from "@/components/icons/BotIcon";

const AI_IDEA_ENDPOINT =
  process.env.NEXT_PUBLIC_AI_IDEA_ENDPOINT ?? "/api/ai/idea-improve";

/* Spinner minimal */
function Spinner({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

const TOTAL_STEPS = 11;
const CURRENT_STEP = 2;

export default function Step2Page() {
  const router = useRouter();
  const sp = useSearchParams();
  const { data, setStep1 } = useWizardStore();
  const s1 = data.step1 ?? {};

  const [idea, setIdea] = useState<string>(s1.idea ?? "");
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Soporta prefill desde query (?prefill=... o ?p=...) si el campo está vacío
  useEffect(() => {
    const q = sp?.get("prefill") ?? sp?.get("p");
    if (q && !idea.trim()) setIdea(q);
  }, [sp, idea]);

  const progressPercent = useMemo(
    () => Math.round((CURRENT_STEP / TOTAL_STEPS) * 100),
    []
  );

  async function onImproveWithAI() {
    const txt = (idea ?? "").trim();
    if (txt.length < 5) {
      setError("Escribe al menos 5 caracteres antes de mejorar con IA.");
      return;
    }
    setAiError(null);
    setAiLoading(true);
    try {
      const r = await fetch(AI_IDEA_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: txt }),
      });
      if (!r.ok) throw new Error(`IA no disponible (${r.status})`);
      const j = await r.json();
      const improved = (j?.idea ?? j?.text ?? j?.content ?? "").toString().trim();
      if (!improved) throw new Error("Respuesta de IA vacía.");
      setIdea(improved);
      try {
        window.dispatchEvent(new Event("focus"));
      } catch {}
    } catch (e: any) {
      setAiError(e?.message || "No se pudo mejorar con IA. Configura el endpoint y reintenta.");
    } finally {
      setAiLoading(false);
    }
  }

  function onNext() {
    const txt = (idea ?? "").trim();
    if (txt.length < 5) {
      setError("Escribe al menos 5 caracteres para continuar.");
      return;
    }
    // Mantener compat: idea en step1
    setStep1({ ...(data.step1 ?? {}), idea: txt });
    router.push("/wizard/step-3");
  }

  return (
    <main className="min-h-[calc(100dvh-4rem)]">
      <div className="mx-auto max-w-screen-md px-4 pb-16 pt-6">
        {/* Progreso visual del paso 2/11 */}
        <div
          className="mb-4"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
          aria-label={`Progreso ${CURRENT_STEP} de ${TOTAL_STEPS}`}
        >
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-[width]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-1 text-right text-xs text-slate-500">
            Paso {CURRENT_STEP} de {TOTAL_STEPS}
          </div>
        </div>

        {/* Encabezado cálido y centrado */}
        <header className="text-center">
          <div className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
            <span className="text-lg" aria-hidden>💡</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Paso 2 · ¿Cuál es tu idea de negocio?
          </h1>
          <p className="mx-auto mt-1 max-w-2xl text-sm text-slate-600">
            Escribe una oración clara que explique de qué se trata tu idea, qué ofreces y para quién es.
            Puedes mejorarla con <span className="font-medium">IA Aret3</span> las veces que quieras.
          </p>
        </header>

        {/* Card del editor */}
        <section className="mx-auto mt-6 max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {/* Editor + botón IA lateral */}
          <div className="flex items-stretch gap-3">
            <textarea
              className="mt-1 w-full min-h-[140px] rounded-lg border border-slate-200 px-3 py-2 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-400 focus:ring-emerald-100"
              placeholder="¿Qué quieres crear? ¿Para quién? ¿Qué problema resuelves?"
              rows={6}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
            />

            {/* Botón IA celeste */}
            <button
              type="button"
              onClick={onImproveWithAI}
              disabled={aiLoading}
              title="Mejorar con IA (resta 1 crédito)"
              aria-busy={aiLoading}
              className={[
                "mt-1 shrink-0 w-[64px] rounded-xl border px-3 py-2",
                "flex flex-col items-center justify-center",
                "transition-colors duration-150",
                "bg-blue-100 border-blue-300 text-blue-700",
                "hover:bg-blue-200 hover:border-blue-400 hover:text-blue-800",
                "active:bg-blue-300 active:border-blue-500",
                "shadow-sm hover:shadow",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              ].join(" ")}
            >
              {aiLoading ? (
                <Spinner className="h-5 w-5" />
              ) : (
                 <BotIcon className="h-8 w-8" variant="t3" glowHue="gold"/>
              )}
              <span className="mt-1 text-[10px] leading-none">Escribe con IA Aret3</span>
            </button>
          </div>

          {/* Ejemplo + errores */}
          <p className="mt-2 text-sm text-slate-400">
            Ejemplo: Abrir un bar experto en mixología para que los clientes se sientan como en su casa, en un ambiente cálido y acogedor.
          </p>
          {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
          {aiError && <p className="mt-2 text-xs text-rose-600">IA: {aiError}</p>}

          {/* Nav */}
          <div className="mt-6 flex items-center justify-between">
            <PrevButton href="/wizard/step-1" />
            <NextButton onClick={onNext} />
          </div>
        </section>

        {/* Upsell */}
        <div className="mx-auto mt-6 max-w-2xl">
          <UpsellBanner />
        </div>

        {/* Nota créditos */}
        <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-slate-500">
          Nota: mejorar con{" "}
          <span className="inline-flex items-center gap-1 font-medium">
            <BotIcon className="h-3.5 w-3.5" variant="t3" /> IA Aret3
          </span>{" "}
          resta 1 crédito.
        </p>
      </div>
    </main>
  );
}
