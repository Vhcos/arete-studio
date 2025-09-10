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

  // Evita ts(2339): tipa como Partial<Step3>
  const s3 = (data.step3 ?? {}) as Partial<Step3>;

  const [local, setLocal] = useState<Step3>({
    ventajaTexto: s3.ventajaTexto ?? "",
    country: s3.country ?? "Chile",
    city: s3.city ?? "Santiago",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

function onNext() {
  const parsed = Step3Schema.safeParse(local);
  if (!parsed.success) {
    const errs: Record<string, string> = {};
    parsed.error.issues.forEach((i) => (errs[i.path.join(".")] = i.message));
    setErrors(errs);
    return;
  }
  setStep3(parsed.data);
  router.push("/wizard/step-4");
}


  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Paso 3 · Es muy especial cuenta la gracia de tu idea y dónde estará</h1>
      <p className="text-sm text-slate-600 mb-6">
        Cuéntanos qué harás distinto, cuál será tu impacto diferenciador y dónde harás tu negocio.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium">
            Tu ventaja diferenciadora (texto)
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">País</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={local.country ?? ""}
              onChange={(e) => setLocal((s) => ({ ...s, country: e.target.value }))}
            />
            {errors.country && (
              <p className="mt-1 text-xs text-red-600">{errors.country}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Ciudad</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={local.city ?? ""}
              onChange={(e) => setLocal((s) => ({ ...s, city: e.target.value }))}
            />
            {errors.city && (
              <p className="mt-1 text-xs text-red-600">{errors.city}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <PrevButton href="/wizard/step-2" />
        <NextButton onClick={onNext} />
      </div>
    </div>
  );
}
