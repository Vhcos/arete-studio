//  app/wizard/step-4/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import type { Step3 } from "@/lib/state/wizard-store";
import { Step3Schema } from "@/lib/validation/wizard";
import { NextButton, PrevButton } from "@/components/wizard/WizardNav";
import UpsellBanner from "@/components/wizard/UpsellBanner";

const AI_ADV_ENDPOINT =
  process.env.NEXT_PUBLIC_AI_ADV_ENDPOINT ?? "/api/ai/advantage-improve";

// Icono IA
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

export default function Step4Page() {
  const router = useRouter();
  const { data, setStep3 } = useWizardStore();

  // Contexto para el prompt
  const idea = (data.step1?.idea ?? "").toString();
  const sectorId = (data.step2?.sectorId ?? "").toString();
  const ubicacion = (data.step2?.ubicacion ?? "").toString();

  // Prefill desde store
  const s3 = (data.step3 ?? {}) as Partial<Step3>;
  const [local, setLocal] = useState<{ ventajaTexto?: string }>({
    ventajaTexto: s3.ventajaTexto ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function onImproveWithAI() {
    const current = (local.ventajaTexto ?? "").trim();
    setAiError(null);
    setAiLoading(true);
    try {
      const r = await fetch(AI_ADV_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, sectorId, ubicacion, current }),
      });
      if (!r.ok) throw new Error(`IA no disponible (${r.status})`);
      const j = await r.json();
      const improved = (j?.ventaja ?? j?.text ?? j?.content ?? "").toString().trim();
      if (!improved) throw new Error("Respuesta de IA vacía.");
      setLocal((s) => ({ ...s, ventajaTexto: improved }));
      // refrescar el header de créditos
      try { window.dispatchEvent(new Event("focus")); } catch {}
    } catch (e: any) {
      setAiError(e?.message || "No se pudo mejorar con IA. Reintenta.");
    } finally {
      setAiLoading(false);
    }
  }

  function onNext() {
    const parsed = Step3Schema.safeParse({
      ventajaTexto: (local.ventajaTexto ?? "").trim(),
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path.join(".")] = i.message));
      setErrors(errs);
      return;
    }
    setStep3(parsed.data as Step3);
    router.push("/wizard/step-5");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">
        Paso 4 · Cuéntanos qué harás distinto, cuál será tu impacto diferenciador y dónde harás tu negocio.
      </h1>
      <p className="text-sm text-slate-600 mb-6">Es muy importante que pienses en esto.</p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium">
            Tu ventaja diferenciadora (escribe con inspiración)
          </label>

          {/* Textarea + botón IA (igual que Paso 2, estilos azules) */}
          <div className="flex gap-3 items-stretch">
            <textarea
              className="mt-1 w-full rounded-lg border px-3 py-2 min-h-[120px]"
              rows={5}
              value={local.ventajaTexto ?? ""}
              onChange={(e) => setLocal((s) => ({ ...s, ventajaTexto: e.target.value }))}
              placeholder="¿Qué harás distinto o especial? tecnología, experiencia, costos, tiempo, marca, red, nicho, etc."
            />
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

          {errors.ventajaTexto && (
            <p className="mt-1 text-xs text-red-600">{errors.ventajaTexto}</p>
          )}
          {aiError && <p className="mt-2 text-xs text-red-600">IA: {aiError}</p>}
        </div>
      </div>

      {/* Ejemplo */}
      <p className="text-sm text-slate-400 mt-2">
        Ejemplo: Propuesta de atención a la vieja escuela, donde “cada cliente es un invitado especial”, diferente de la frialdad de las cadenas y la improvisación de los bares amateur.
      </p>

      <div className="mt-8 flex items-center justify-between">
        <PrevButton href="/wizard/step-3" />
        <NextButton onClick={onNext} />
      </div>

      <UpsellBanner />

      <p className="mt-4 text-xs text-slate-500 flex items-center gap-1">
        Nota: la generación con IA <BotIcon className="w-3.5 h-3.5" /> resta un crédito.
      </p>
    </div>
  );
}
