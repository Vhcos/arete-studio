"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { Step1Schema } from "@/lib/validation/wizard";
import { NextButton, PrevButton } from "@/components/wizard/WizardNav";

export default function Step1Page() {
  const router = useRouter();
  const { data, setStep1 } = useWizardStore();
  const s1 = data.step1 ?? {};

  const [local, setLocal] = useState({
    projectName: s1.projectName ?? "",
    idea: s1.idea ?? "",
    ubicacion: s1.ubicacion ?? "",
    founderName: s1.founderName ?? "",
    notifyEmail: s1.notifyEmail ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onNext() {
    const parsed = Step1Schema.safeParse(local);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach(i => (e[i.path.join(".")] = i.message));
      setErrors(e);
      return;
    }
    console.log("[S1] ubicacion a guardar:", parsed.data.ubicacion);  //Verifica que Step-1 realmente guarda ubicacion

    setStep1(parsed.data);
    router.push("/wizard/step-2");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Paso 1 · Bienvenido a Aret3</h1>
      <p className="text-sm text-slate-600 mb-6">Estamos encantado de tenerte inicia este viaje con estos primeros pasos.</p>

      <label className="block text-sm font-medium">Que nombre le tienes a tu Proyecto</label>
      <input
        className="mt-1 w-full rounded-lg border px-3 py-2"
        placeholder="p. ej. Joyas Patagonia"
        value={local.projectName}
        onChange={(e) => setLocal((s) => ({ ...s, projectName: e.target.value }))}
      />
      {errors.projectName && <p className="mt-1 text-xs text-red-600">{errors.projectName}</p>}

      <label className="block text-sm font-medium mt-4">¿Cuál es tu Idea que te Inspira?</label>
      <textarea
        className="mt-1 w-full rounded-lg border px-3 py-2"
        placeholder="Describe brevemente tu maravillosa idea eso ayudara a la IA."
        rows={3}
        value={local.idea}
        onChange={(e) => setLocal((s) => ({ ...s, idea: e.target.value }))}
      />
        {/* NUEVO: Ubicación (mismo patrón que founderName) */}
      <label className="block text-sm font-medium mt-4">Ubicación</label>
      <input
        className="mt-1 w-full rounded-lg border px-3 py-2"
        placeholder="Comuna, País, Continente"
        value={local.ubicacion}
        onChange={(e) => setLocal((s) => ({ ...s, ubicacion: e.target.value }))}
      />

      <label className="block text-sm font-medium mt-4">Danos tu nombre emprendedora/o</label>
      <input
        className="mt-1 w-full rounded-lg border px-3 py-2"
        placeholder="p. ej. Carola Plaza"
        value={local.founderName}
        onChange={(e) => setLocal((s) => ({ ...s, founderName: e.target.value }))}
      />

      <label className="block text-sm font-medium mt-4">Tu email asi recibiras tu informe </label>
      <input
        type="email"
        className="mt-1 w-full rounded-lg border px-3 py-2"
        placeholder="tucorreo@ejemplo.com"
        value={local.notifyEmail}
        onChange={(e) => setLocal((s) => ({ ...s, notifyEmail: e.target.value }))}
      />
      {errors.notifyEmail && <p className="mt-1 text-xs text-red-600">{errors.notifyEmail}</p>}

      <div className="mt-6 flex items-center justify-between">
        <PrevButton href="/" />
        <NextButton onClick={onNext} />
      </div>
    </div>
  );
}
