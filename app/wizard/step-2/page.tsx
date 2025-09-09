"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { Step2Schema } from "@/lib/validation/wizard";
import { NextButton, PrevButton } from "@/components/wizard/WizardNav";
import { SECTORS, SectorId } from "@/lib/model/sectors";

export default function Step2Page() {
  const router = useRouter();
  const { data, setStep2 } = useWizardStore();

  const initialSector = (data.step2?.sectorId as SectorId) ?? "tech_saas";
  const [local, setLocal] = useState({
    sectorId: initialSector as string,
    template: data.step2?.template ?? "default",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onNext() {
    const parsed = Step2Schema.safeParse(local);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach(i => (errs[i.path.join(".")] = i.message));
      setErrors(errs);
      return;
    }
    setStep2(parsed.data);
    router.push("/wizard/step-3");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Paso 2 · Sector y plantilla</h1>
      <p className="text-sm text-slate-600 mb-6">Elige el sector canónico (14 opciones) para personalizar tu plan.</p>

      <div className="mt-2">
        <label className="block text-sm font-medium">Sector</label>
        <select
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={local.sectorId}
          onChange={(e) => setLocal(s => ({ ...s, sectorId: e.target.value }))}
        >
          {SECTORS.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        {errors.sectorId && <p className="mt-1 text-xs text-red-600">{errors.sectorId}</p>}
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium">Plantilla</label>
        <select
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={local.template}
          onChange={(e) => setLocal(s => ({ ...s, template: e.target.value }))}
        >
          <option value="default">Básica</option>
          <option value="lean">Lean Canvas</option>
          <option value="pitch">Pitch / One-pager</option>
        </select>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <PrevButton href="/wizard/step-1" />
        <NextButton onClick={onNext} />
      </div>
    </div>
  );
}
