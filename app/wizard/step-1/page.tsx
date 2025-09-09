"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { Step1Schema } from "@/lib/validation/wizard";
import { NextButton, PrevButton } from "@/components/wizard/WizardNav";
import { PLACEHOLDERS } from "@/lib/model/app-form";

export default function Step1Page() {
  const router = useRouter();
  const { data, setStep1 } = useWizardStore();
  const [local, setLocal] = useState({
    projectName: data.step1?.projectName ?? "",
    shortDescription: data.step1?.shortDescription ?? "",
    sector: data.step1?.sector ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onNext() {
    const parsed = Step1Schema.safeParse(local);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach(i => (errs[i.path.join(".")] = i.message));
      setErrors(errs);
      return;
    }
    setStep1(parsed.data);
    router.push("/wizard/step-2");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Paso 1 · Datos básicos</h1>
      <p className="text-sm text-slate-600 mb-6">Nombre del proyecto, descripción breve y sector.</p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium">Nombre del proyecto</label>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
            value={local.projectName}
            onChange={(e) => setLocal(s => ({ ...s, projectName: e.target.value }))}
            placeholder={PLACEHOLDERS.projectName}
            aria-invalid={!!errors.projectName}
            aria-describedby="err-projectName"
          />
          {errors.projectName && <p id="err-projectName" className="mt-1 text-xs text-red-600">{errors.projectName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Descripción breve</label>
          <textarea
            className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
            value={local.shortDescription}
            onChange={(e) => setLocal(s => ({ ...s, shortDescription: e.target.value }))}
            placeholder={PLACEHOLDERS.shortDescription}
            rows={3}
          />
          {errors.shortDescription && <p className="mt-1 text-xs text-red-600">{errors.shortDescription}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Sector o rubro</label>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
            value={local.sector}
            onChange={(e) => setLocal(s => ({ ...s, sector: e.target.value }))}
            placeholder={PLACEHOLDERS.sector}
          />
          {errors.sector && <p className="mt-1 text-xs text-red-600">{errors.sector}</p>}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <PrevButton disabled />
        <NextButton onClick={onNext} />
      </div>
    </div>
  );
}
