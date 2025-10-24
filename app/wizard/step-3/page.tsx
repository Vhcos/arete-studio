// app/wizard/step-3/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { Step2Schema } from "@/lib/validation/wizard";
import { NextButton, PrevButton } from "@/components/wizard/WizardNav";
import { SECTORS, SectorId } from "@/lib/model/sectors";
import UpsellBanner from "@/components/wizard/UpsellBanner";
import EconomicHeader from "@/components/wizard/EconomicHeader";
import BotIcon from "@/components/icons/BotIcon";

export default function Step3Page() {
  const router = useRouter();
  const { data, setStep2 } = useWizardStore();

  const initialSector = (data.step2?.sectorId as SectorId) ?? "tech_saas";

  const [local, setLocal] = useState({
    sectorId: initialSector as string,
    template: (data.step2?.template ?? "default") as string,
    ubicacion: (data.step2?.ubicacion ?? data.step1?.ubicacion ?? "") as string,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const sectorInfo = useMemo(
    () => SECTORS.find((s) => s.id === (local.sectorId as SectorId)),
    [local.sectorId]
  );
  const sectorHint = sectorInfo?.hint ?? "";

  function onNext() {
    const parsed = Step2Schema.safeParse(local);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (e[i.path.join(".")] = i.message));
      setErrors(e);
      return;
    }
    setErrors({});
    setStep2(parsed.data);
    router.push("/wizard/step-4");
  }

  return (
    <main className="mx-auto max-w-7xl px-3 py-8">
      <EconomicHeader
        title="Paso 3 · Rubro y ubicación"
        subtitle="Elige el rubro más cercano a tu idea y dónde operarás."
      />

      <section className="mx-auto mt-6 max-w-2xl rounded-xl border-2 border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5 p-6">
        {/* Rubro / sector */}
        <div>
          <label className="block text-sm font-medium text-slate-700">Rubro</label>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
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
          {sectorHint && (
            <p className="mt-1 text-xs text-slate-500">{sectorHint}</p>
          )}
        </div>

        {/* Ubicación */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">Ubicación</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
            placeholder="Comuna / Región / País"
            value={local.ubicacion}
            onChange={(e) => setLocal((s) => ({ ...s, ubicacion: e.target.value }))}
          />
          {errors.ubicacion && <p className="mt-1 text-xs text-red-600">{errors.ubicacion}</p>}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <PrevButton href="/wizard/step-2" />
          <NextButton onClick={onNext} />
        </div>
      </section>

      <div className="max-w-2xl mx-auto mt-4">
        <UpsellBanner />
      </div>

      <p className="mt-4 text-xs text-slate-500 text-center">
        Nota: la generación con{" "}
        <span className="inline-flex items-center gap-1 font-medium">
          <BotIcon className="w-3.5 h-3.5" variant="t3" /> IA Aret3
        </span>{" "}
        se hará al final, en el Informe.
      </p>
    </main>
  );
}
