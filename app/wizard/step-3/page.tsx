/** app/wizard/step-3/page.tsx */
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import type { Step3 } from "@/lib/state/wizard-store";
import { Step3Schema } from "@/lib/validation/wizard";
import { NextButton, PrevButton } from "@/components/wizard/WizardNav";

export default function Step3Page() {
  const router = useRouter();
  const { data, setStep3 } = useWizardStore();

  // Prefill desde el store del wizard (si hubiera)
  const s3 = (data.step3 ?? {}) as Partial<Step3>;

  // Solo manejamos ventajaTexto en este paso
  const [local, setLocal] = useState<{ ventajaTexto?: string }>({
    ventajaTexto: s3.ventajaTexto ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function onNext() {
    // Validamos SOLO ventajaTexto (Step3Schema puede tener más campos opcionales y no afecta)
    const parsed = Step3Schema.safeParse({
      ventajaTexto: (local.ventajaTexto ?? "").trim(),
    });

    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path.join(".")] = i.message));
      setErrors(errs);
      return;
    }

    // Guardamos el paso con lo validado (solo ventajaTexto)
    setStep3(parsed.data as Step3);

    router.push("/wizard/step-6");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">
        Paso 3 · Cuéntanos qué harás distinto, cuál será tu impacto diferenciador y dónde harás tu negocio.
      </h1>
      <p className="text-sm text-slate-600 mb-6">
        Es muy importante pienses en esto !!!.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium">
            Tu ventaja diferenciadora (escribe con inspiración)
          </label>
          <textarea
            className="mt-1 w-full rounded-lg border px-3 py-2"
            rows={4}
            value={local.ventajaTexto ?? ""}
            onChange={(e) => setLocal((s) => ({ ...s, ventajaTexto: e.target.value }))}
            placeholder="¿Qué harás distinto o especial? tecnología, experiencia, costos, tiempo, marca, red, etc."
          />
          {errors.ventajaTexto && (
            <p className="mt-1 text-xs text-red-600">{errors.ventajaTexto}</p>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <PrevButton href="/wizard/step-2" />
        <NextButton onClick={onNext } />
      </div>
    </div>
  );
}
