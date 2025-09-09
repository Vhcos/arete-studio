"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { Step3Schema, Stage } from "@/lib/validation/wizard";
import { NextButton, PrevButton } from "@/components/wizard/WizardNav";

export default function Step3Page() {
  const router = useRouter();
  const { data, setStep3 } = useWizardStore();
  const [local, setLocal] = useState({
    headline: data.step3?.headline ?? "",
    country: data.step3?.country ?? "Chile",
    city: data.step3?.city ?? "Santiago",
    stage: (data.step3?.stage ?? "idea") as Stage,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onNext() {
    const parsed = Step3Schema.safeParse(local);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach(i => (errs[i.path.join(".")] = i.message));
      setErrors(errs);
      return;
    }
    setStep3(parsed.data);
    router.push("/wizard/step-4");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Paso 3 · Contexto</h1>
      <p className="text-sm text-slate-600 mb-6">Tu “brillante idea”, país/ciudad y etapa.</p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium">Brillante idea (headline)</label>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={local.headline}
            onChange={(e) => setLocal(s => ({ ...s, headline: e.target.value }))}
            placeholder="La forma más simple de evaluar tu idea en 2 minutos"
          />
          {errors.headline && <p className="mt-1 text-xs text-red-600">{errors.headline}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">País</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={local.country}
              onChange={(e) => setLocal(s => ({ ...s, country: e.target.value }))}
            />
            {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Ciudad</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={local.city}
              onChange={(e) => setLocal(s => ({ ...s, city: e.target.value }))}
            />
            {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
          </div>
        </div>
        <fieldset>
          <legend className="block text-sm font-medium">Etapa</legend>
          <div className="mt-2 flex gap-3">
            {(["idea","launch","growth"] as const).map(v => (
              <label key={v} className={`px-3 py-1.5 rounded-full border cursor-pointer ${local.stage === v ? "border-slate-900" : "border-slate-200"}`}>
                <input
                  type="radio"
                  name="stage"
                  className="sr-only"
                  checked={local.stage === v}
                  onChange={() => setLocal(s => ({ ...s, stage: v }))}
                />
                {v === "idea" ? "Idea" : v === "launch" ? "Lanzamiento" : "Crecimiento"}
              </label>
            ))}
          </div>
          {errors.stage && <p className="mt-1 text-xs text-red-600">{errors.stage}</p>}
        </fieldset>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <PrevButton href="/wizard/step-2" />
        <NextButton onClick={onNext} />
      </div>
    </div>
  );
}
