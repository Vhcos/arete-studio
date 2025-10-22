// app/wizard/step-5/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { Step5Schema } from "@/lib/validation/wizard-extra";
import UpsellBanner from "@/components/wizard/UpsellBanner";

type S = { key: keyof ReturnType<typeof getDefault>; label: string };
function getDefault() {
  return {
    urgencia: 0, accesibilidad: 0, competencia: 0, experiencia: 0,
    pasion: 0, planesAlternativos: 0, toleranciaRiesgo: 0, testeoPrevio: 0, redApoyo: 0
  };
}
const FIELDS: S[] = [
  { key:"urgencia", label:"1.Tu idea resuelve un problema" },
  { key:"experiencia", label:"2.Tu experiencia en el rubro" },
  { key:"competencia", label:"3.Competencia (0=alta, 10=baja)" },
  { key:"toleranciaRiesgo", label:"4.Tolerancia al Riesgo" },
  { key:"accesibilidad", label:"5.Accesibilidad al cliente" },
  { key:"pasion", label:"6.Tu pasión/compromiso con la idea" },
  
  
  
  { key:"testeoPrevio", label:"Testeo previo" },
  { key:"redApoyo", label:"Red de apoyo" },
  { key:"planesAlternativos", label:"Planes alternativos a las dificultades" },
];

export default function Step5Page() {
  const router = useRouter();
  const { data, setStep5 } = useWizardStore();
  const [local, setLocal] = useState(data.step5 ?? getDefault());
  const [err, setErr] = useState<string | null>(null);

  function onNext() {
    const parsed = Step5Schema.safeParse(local);
    if (!parsed.success) {
      setErr("Revisa los valores (0 a 10).");
      return;
    }
    // Ensure all fields are numbers (not undefined)
    const completeData = { ...getDefault(), ...parsed.data };
    setStep5(completeData);

    router.push("/wizard/step-6");
  }

  return (
    
    <div>
      <h1 className="text-xl font-semibold mb-1">Paso 5 ·  Emocional: <span className="text-red-600 font-bold">Debes detenerte un minuto y poner TU nota de 0-10</span> a cada una de estas características 
        que te harán pensar y profundizar en tu negocio en los aspectos blandos o cualitativos </h1>
      <p className="text-sm text-slate-600 mb-6">Evalúa cada ítem (0 a 10).</p>
      <div className="md:col-span-3 rounded-xl border-2 p-4 border-blue-600/30 bg-blue-50 dark:border-blue-400/30 dark:bg-blue-400/10">
  <div className="font-medium">
    Califica de <strong>0 (nada)a 10(todo)</strong> cada ítem
  </div>
  <ul className="text-sm text-muted-foreground list-disc pl-5 mt-1 space-y-1">
    <li><strong>1.Tu idea resuelve un problema</strong> Piensa si viene de la observación de tu cliente</li>
    <li><strong>2.Tu experiencia en el rubro</strong> Trabajaste en este negocio o lo estas intentando de nuevo</li>
    <li><strong>3.Competencia</strong>: cantidad/calidad de competidores menos es mejor.</li>
    <li><strong>4.Tu tolerancia al riesgo</strong>: como soportas las perdidas o problemas.</li>
    <li><strong>5.Accesibilidad del cliente</strong>: tienes buena ubicación? puedes llegar facilmente a tu cliente?</li>
    <li><strong>6.Tu pasión/compromiso con la idea</strong>: estas dispuesto a dejarlo todo por tu idea o no</li>
  </ul>
</div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FIELDS.map(f => (
          <div key={f.key} className="rounded-lg border p-4">
            <label className="block text-sm font-medium mb-2">{f.label}</label>
            <input
              type="range" min={0} max={10} step={1}
              value={local[f.key]}
              onChange={e => setLocal(s => ({ ...s, [f.key]: Number(e.target.value) }))}
              className="w-full"
            />
            <div className="mt-1 text-xs text-slate-500">Valor: {local[f.key]}</div>
          </div>
        ))}
      </div>

      {err && <p className="mt-3 text-xs text-red-600">{err}</p>}

      <div className="mt-6 flex items-center gap-3">
        <button onClick={() => router.push("/wizard/step-4")} className="rounded-lg border px-4 py-2">Atrás</button>
        <button onClick={onNext} className="rounded-lg bg-green-600 text-white px-4 py-2">Siguiente</button>
      </div>
      <UpsellBanner />
      <p className="mt-4 text-xs text-slate-500">
          Nota: la generación con IA se hará al final, en el Informe.
        </p>
    </div>
  );
}
