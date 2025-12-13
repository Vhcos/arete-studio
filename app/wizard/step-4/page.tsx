// app/wizard/step-4/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import type { Step3 } from "@/lib/state/wizard-store";
import { Step3Schema } from "@/lib/validation/wizard";
import { NextButton, PrevButton } from "@/components/wizard/WizardNav";
import UpsellBanner from "@/components/wizard/UpsellBanner";
import EconomicHeader from "@/components/wizard/EconomicHeader";
import BotIcon from "@/components/icons/BotIcon";

const AI_ADV_ENDPOINT =
  process.env.NEXT_PUBLIC_AI_ADV_ENDPOINT ?? "/api/ai/advantage-improve";

/* Spinner mínimo */
function Spinner({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function Step4Page() {
  const router = useRouter();
  const { data, setStep3 } = useWizardStore();

  // Contexto para el prompt IA
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
      if (!r.ok) throw new Error(`Créditos insuficientes revisa nuestros planes y adquiere más créditos  (${r.status})`);
      const j = await r.json();
      const improved = (j?.ventaja ?? j?.text ?? j?.content ?? "").toString().trim();
      if (!improved) throw new Error("Respuesta de IA vacía.");
      setLocal((s) => ({ ...s, ventajaTexto: improved }));
      try {
        // refresca créditos en el header
        window.dispatchEvent(new Event("focus"));
      } catch {}
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
    <main className="mx-auto max-w-7xl px-3 py-8">
      <EconomicHeader
        title="Paso 4 · Tu ventaja diferenciadora"
        subtitle="Cuéntanos qué harás distinto, cuál será tu impacto y dónde operarás. Sino sabes que anotar deja que la IA de aret3 lo haga por ti solo aprieta el botón "
      />

      <section className="mx-auto mt-6 max-w-2xl rounded-xl border-2 border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5 p-6">
        <label className="block text-sm font-medium text-slate-700">
          Tu ventaja diferenciadora
        </label>

        {/* Textarea + botón IA (igual patrón Step-2: blue 100/200/300) */}
        <div className="flex gap-3 items-stretch">
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 min-h-[120px] shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
            rows={5}
            value={local.ventajaTexto ?? ""}
            onChange={(e) => setLocal((s) => ({ ...s, ventajaTexto: e.target.value }))}
            placeholder="¿Qué harás distinto o especial? tecnología, experiencia, costos, tiempo, marca, red, nicho, etc."
          />
          <button
            type="button"
            onClick={onImproveWithAI}
            disabled={aiLoading}
            title="Mejorar con IA Aret3 (resta 1 crédito)"
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
            {aiLoading ? <Spinner className="w-5 h-5" /> :  <BotIcon className="h-8 w-8" variant="t3" glowHue="gold"/>}
            <span className="mt-1 text-[10px] leading-none">Escribe con IA Aret3</span>
          </button>
        </div>

        {/* Mensajes */}
        {errors.ventajaTexto && (
          <p className="mt-1 text-xs text-red-600">{errors.ventajaTexto}</p>
        )}
        {aiError && <p className="mt-2 text-xs text-red-600">IA: {aiError}</p>}

        {/* Ejemplo */}
        <p className="text-sm text-slate-400 mt-2">
          Ejemplo: Propuesta de atención a la vieja escuela, donde “cada cliente es un invitado especial”,
          distinta de la frialdad de las cadenas y la improvisación de los bares amateur.
        </p>

        <div className="mt-6 flex items-center justify-between">
          <PrevButton href="/wizard/step-3" />
          <NextButton onClick={onNext} />
        </div>
      </section>

      <div className="max-w-2xl mx-auto mt-4">
        <UpsellBanner />
      </div>

      <p className="mt-4 text-xs text-slate-500 text-center">
        Nota: usar{" "}
        <span className="inline-flex items-center gap-1 font-medium">
          <BotIcon className="w-3.5 h-3.5" variant="t3" /> IA Aret3
        </span>{" "}
        resta 1 crédito.
      </p>
    </main>
  );
}

