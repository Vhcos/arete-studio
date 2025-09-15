"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { Step5Schema } from "@/lib/validation/wizard-extra";

type S = { key: keyof ReturnType<typeof getDefault>; label: string };
function getDefault() {
  return {
    urgencia: 5, accesibilidad: 5, competencia: 5, experiencia: 5,
    pasion: 5, planesAlternativos: 5, toleranciaRiesgo: 5, testeoPrevio: 5, redApoyo: 5
  };
}
const FIELDS: S[] = [
  { key:"urgencia", label:"Tu idea resuelve un urgencia" },
  { key:"accesibilidad", label:"Accesibilidad al cliente" },
  { key:"competencia", label:"Competencia (0=alta, 10=baja)" },
  { key:"experiencia", label:"Tu experiencia en el rubro" },
  { key:"pasion", label:"Tu pasión/compromiso con la idea" },
  { key:"planesAlternativos", label:"Planes alternativos a las dificultades" },
  { key:"toleranciaRiesgo", label:"Tolerancia al Riesgo" },
  { key:"testeoPrevio", label:"Testeo previo" },
  { key:"redApoyo", label:"Red de apoyo" },
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
    setStep5(parsed.data);

    router.push("/wizard/step-4");
  }

  return (
    
    <div>
      <h1 className="text-xl font-semibold mb-1">Paso 5 ·  Emocional Aquí tienes los datos blandos de tu idea aspectos cualitativos y emocionales que impactarán tu negocio</h1>
      <p className="text-sm text-slate-600 mb-6">Evalúa cada ítem (0 a 10).</p>
      <div className="md:col-span-3 rounded-xl border-2 p-4 border-blue-600/30 bg-blue-50 dark:border-blue-400/30 dark:bg-blue-400/10">
  <div className="font-medium">
    Califica de <strong>0 a 10</strong> cada ítem
  </div>
  <ul className="text-sm text-muted-foreground list-disc pl-5 mt-1 space-y-1">
    <li><strong>Tu idea resuelve un problema</strong>: 0 = poco, 10 = mucho.</li>
    <li><strong>Competencia</strong>: cantidad/calidad de competidores (alto = mucha competencia).</li>
    <li><strong>Tu tolerancia al riesgo</strong>: cuánta volatilidad soportas.</li>
    <li><strong>Testeo previo</strong>: entrevistas, lista de espera, reuniones, respuestas positivas, seguidores.</li>
    <li><strong>Red de apoyo</strong>: mentores, socios, partners, contactos.</li>
    <li><strong>Planes alternativos a las dificultades</strong>: mitigaciones listas si algo sale mal.</li>
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
        <button onClick={() => router.push("/wizard/step-6")} className="rounded-lg border px-4 py-2">Atrás</button>
        <button onClick={onNext} className="rounded-lg bg-blue-600 text-white px-4 py-2">Siguiente</button>
      </div>
    </div>
  );
}
