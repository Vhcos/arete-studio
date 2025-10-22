//  app/wizard/step-2/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { NextButton, PrevButton } from "@/components/wizard/WizardNav";
import UpsellBanner from "@/components/wizard/UpsellBanner";

const AI_IDEA_ENDPOINT =
  process.env.NEXT_PUBLIC_AI_IDEA_ENDPOINT ?? "/api/ai/idea-improve";

// Icono IA (usa currentColor para heredar el color)
function BotIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 3h6v3H9V3Z" fill="currentColor" />
      <rect x="3" y="6" width="18" height="12" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="12" r="1.5" fill="currentColor" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" />
      <path d="M7 18c1.5 1 3.5 1.5 5 1.5S15.5 19 17 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Spinner({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg>
  );
}

export default function Step2Page() {
  const router = useRouter();
  const { data, setStep1 } = useWizardStore();
  const s1 = data.step1 ?? {};

  const [idea, setIdea] = useState(s1.idea ?? "");
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
      setIdea(improved); // el usuario puede seguir editando
      // refrescar header de créditos
      try { window.dispatchEvent(new Event("focus")); } catch {}
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
    setStep1({ ...(data.step1 ?? {}), idea: txt });
    router.push("/wizard/step-3");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Paso 2 · ¿Cuál es tu idea de negocio?</h1>
      <p className="text-sm text-slate-600 mb-6">
        Escribe una oración clara que explique de qué se trata tu idea, qué ofreces y para quién es.
      </p>

      {/* Editor + botón IA a la derecha */}
      <div className="flex gap-3 items-stretch">
        <textarea
          className="mt-1 w-full rounded-lg border px-3 py-2 min-h-[140px]"
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
           "mt-1 shrink-0 w-[56px] rounded-xl border px-3 py-2",
           "flex flex-col items-center justify-center",
           "transition-colors duration-150",
       // Azul claro + estados
           "bg-blue-100 border-blue-300 text-blue-700",
           "hover:bg-blue-200 hover:border-blue-400 hover:text-blue-800",
           "active:bg-blue-300 active:border-blue-500",
           "shadow-sm hover:shadow",
           "disabled:opacity-60 disabled:cursor-not-allowed",
       ].join(" ")}
       >
         {aiLoading ? <Spinner className="w-5 h-5" /> : <BotIcon />}
        <span className="mt-1 text-[10px] leading-none">IA</span>
       </button>
      </div>

      {/* Ejemplo + errores */}
      <p className="text-sm text-slate-400 mt-2">
        Ejemplo: Abrir un bar experto en mixología para que los clientes se sientan como en su casa, en un ambiente cálido y acogedor.
      </p>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {aiError && <p className="mt-2 text-xs text-red-600">IA: {aiError}</p>}

      <div className="mt-8 flex items-center justify-between">
        <PrevButton href="/wizard/step-1" />
        <NextButton onClick={onNext} />
      </div>

      <UpsellBanner />

      <p className="mt-4 text-xs text-slate-500 flex items-center gap-1">
        Nota: la generación con IA <BotIcon className="w-3.5 h-3.5" /> resta un crédito.
      </p>
    </div>
  );
}
