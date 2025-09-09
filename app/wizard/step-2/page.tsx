"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { Step2Schema, BusinessType } from "@/lib/validation/wizard";
import { NextButton, PrevButton } from "@/components/wizard/WizardNav";

const OPTIONS: { value: BusinessType; label: string; hint: string }[] = [
  { value: "saas", label: "SaaS", hint: "Software como servicio" },
  { value: "ecommerce", label: "E-commerce", hint: "Tienda online" },
  { value: "servicio", label: "Servicios", hint: "Consultoría/Agencia" },
  { value: "producto", label: "Producto físico", hint: "Fabricación/retail" },
  { value: "restaurante", label: "Restaurante/Food", hint: "Local o dark-kitchen" },
];

export default function Step2Page() {
  const router = useRouter();
  const { data, setStep2 } = useWizardStore();
  const [local, setLocal] = useState({
    businessType: (data.step2?.businessType ?? "saas") as BusinessType,
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
      <h1 className="text-xl font-semibold mb-1">Paso 2 · Tipo de negocio / plantilla</h1>
      <p className="text-sm text-slate-600 mb-6">Selecciona el arquetipo que mejor calza con tu proyecto. Podrás cambiarlo luego.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        {OPTIONS.map(op => (
          <button
            key={op.value}
            onClick={() => setLocal(s => ({ ...s, businessType: op.value }))}
            className={`text-left rounded-xl border p-4 hover:border-slate-800 focus:outline-none focus:ring ${local.businessType === op.value ? "border-slate-900 ring-1" : "border-slate-200"}`}
            aria-pressed={local.businessType === op.value}
          >
            <div className="font-medium">{op.label}</div>
            <div className="text-xs text-slate-600">{op.hint}</div>
          </button>
        ))}
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium">Plantilla</label>
        <select
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={local.template}
          onChange={(e) => setLocal(s => ({ ...s, template: e.target.value }))}
        >
          <option value="default">Básica (recomendada)</option>
          <option value="lean">Lean Canvas</option>
          <option value="pitch">Pitch / One-pager</option>
        </select>
        {errors.template && <p className="mt-1 text-xs text-red-600">{errors.template}</p>}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <PrevButton href="/wizard/step-1" />
        <NextButton onClick={onNext} />
      </div>
    </div>
  );
}
