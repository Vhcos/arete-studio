// app/wizard/step-2/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { NextButton, PrevButton } from "@/components/wizard/WizardNav";
import UpsellBanner from "@/components/wizard/UpsellBanner";
import EconomicHeader from "@/components/wizard/EconomicHeader";
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

export default function Step2Page() {
  const router = useRouter();
  const { data, setStep1 } = useWizardStore();
  const s1 = data.step1 ?? {};

  const [idea, setIdea] = useState<string>(s1.idea ?? "");
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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
        // refresca créditos en el header
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
    // Mantener compat: idea en step1 (tu store ya lo soporta)
    setStep1({ ...(data.step1 ?? {}), idea: txt });
    router.push("/wizard/step-3");
  }

  return (
    <main className="mx-auto max-w-7xl px-3 py-8">
      <EconomicHeader
        title="Paso 2 · ¿Cuál es tu idea de negocio?"
        subtitle="Escribe una oración clara que explique de qué se trata tu idea, qué ofreces y para quién es."
      />

      <section className="mx-auto mt-6 max-w-2xl rounded-xl border-2 border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5 p-6">
        {/* Editor + botón IA lateral */}
        <div className="flex gap-3 items-stretch">
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 min-h-[140px] shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
            placeholder="¿Qué quieres crear? ¿Para quién? ¿Qué problema resuelves?"
            rows={6}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          />

          {/* Botón IA celeste (blue-100/200/300) */}
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
            {aiLoading ? <Spinner className="w-5 h-5" /> : <BotIcon className="w-5 h-5" variant="t3" />}
            <span className="mt-1 text-[10px] leading-none">IA Aret3</span>
          </button>
        </div>

        {/* Ejemplo + errores */}
        <p className="text-sm text-slate-400 mt-2">
          Ejemplo: Abrir un bar experto en mixología para que los clientes se sientan como en su casa, en un ambiente cálido y acogedor.
        </p>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        {aiError && <p className="mt-2 text-xs text-red-600">IA: {aiError}</p>}

        <div className="mt-6 flex items-center justify-between">
          <PrevButton href="/wizard/step-1" />
          <NextButton onClick={onNext} />
        </div>
      </section>

      <div className="max-w-2xl mx-auto mt-4">
        <UpsellBanner />
      </div>

      <p className="mt-4 text-xs text-slate-500 text-center">
        Nota: mejorar con{" "}
        <span className="inline-flex items-center gap-1 font-medium">
          <BotIcon className="w-3.5 h-3.5" variant="t3" /> IA Aret3
        </span>{" "}
        resta 1 crédito.
      </p>
    </main>
  );
}
