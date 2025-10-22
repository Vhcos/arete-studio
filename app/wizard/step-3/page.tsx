"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { Step2Schema } from "@/lib/validation/wizard";
import { NextButton, PrevButton } from "@/components/wizard/WizardNav";
import { SECTORS, SectorId } from "@/lib/model/sectors";
import UpsellBanner from "@/components/wizard/UpsellBanner";

export default function Step3Page() {
  const router = useRouter();
  const { data, setStep2 } = useWizardStore();

  const initialSector = (data.step2?.sectorId as SectorId) ?? "tech_saas";
  const [local, setLocal] = useState({
    sectorId: initialSector as string,
    template: data.step2?.template ?? "default",
    ubicacion: (data.step2?.ubicacion ?? data.step1?.ubicacion ?? "") as string,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onNext() {
    const parsed = Step2Schema.safeParse(local);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (e[i.path.join(".")] = i.message));
      setErrors(e);
      return;
    }
    setStep2(parsed.data);
    router.push("/wizard/step-4"); // lo que hoy es Step-3 pasará a Step-4
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">
        Paso 3 · Rubro y ubicación en el que estarás y que más se acerque a tu Idea
      </h1>
        <p className="text-sm text-slate-600 mb-6">Elige una de las opciones que se desplegarán.</p>
      {/* Rubro / sector */}
      <div className="mt-2">
        <label className="block text-sm font-medium">Rubro</label>
        <select
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={local.sectorId}
          onChange={(e) => setLocal((s) => ({ ...s, sectorId: e.target.value }))}
        >
          {SECTORS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        {errors.sectorId && <p className="mt-1 text-xs text-red-600">{errors.sectorId}</p>}
      </div>

      {/* Ubicación */}
      <div className="mt-4">
        <label className="block text-sm font-medium">Ubicación</label>
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          placeholder="Comuna / Región / País"
          value={local.ubicacion}
          onChange={(e) => setLocal((s) => ({ ...s, ubicacion: e.target.value }))}
        />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <PrevButton href="/wizard/step-2" />
        <NextButton onClick={onNext} />
      </div>
      <UpsellBanner />
      <p className="mt-4 text-xs text-slate-500">
          Nota: la generación con IA se hará al final, en el Informe.
        </p>
    </div>
  );
}
