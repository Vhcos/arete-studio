// app/wizard/step-2/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { Step2Schema } from "@/lib/validation/wizard";
import { NextButton, PrevButton } from "@/components/wizard/WizardNav";
import { SECTORS, SectorId, templateForSector } from "@/lib/domain/sectors";
import { suggestSectors } from "@/lib/suggest/sectors";

export default function Step2Page() {
  const router = useRouter();
  const { data, setStep2 } = useWizardStore();

  const initialSector: SectorId = (data.step2 as any)?.sectorId ?? "tech_saas";
  const [local, setLocal] = useState({
    sectorId: initialSector as string,
    template: (data.step2?.template ?? templateForSector(initialSector)) as string,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [suggested, setSuggested] = useState<{ id: SectorId; label: string; reason: string }[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTORS;
    return SECTORS.filter(s => s.label.toLowerCase().includes(q));
  }, [query]);

  function onNext() {
    const parsed = Step2Schema.safeParse(local);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach(i => (errs[i.path.join(".")] = i.message));
      setErrors(errs);
      return;
    }
    setStep2(parsed.data as any);
    router.push("/wizard/step-3");
  }

  function onGenerate() {
    const s = suggestSectors({
      projectName: data.step1?.projectName,
      shortDescription: data.step1?.shortDescription,
      sector: data.step1?.sector,
    });
    setSuggested(s);
  }

  function applySuggestion(id: SectorId) {
    setLocal(s => ({ ...s, sectorId: id, template: templateForSector(id) }));
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Paso 2 · Sector y plantilla</h1>
      <p className="text-sm text-slate-600 mb-6">Elige el sector canónico (14 opciones) para personalizar mejor tu plan.</p>

      {/* Sugerencias */}
      <div className="rounded-xl border p-4 bg-violet-50/50">
        <button
          onClick={onGenerate}
          className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-violet-700 hover:bg-violet-50 focus:outline-none focus:ring"
        >
          ✨ Generar sugerencias
        </button>

        {suggested.length > 0 ? (
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            {suggested.map(sug => (
              <button
                key={sug.id}
                onClick={() => applySuggestion(sug.id)}
                className={`text-left rounded-lg border p-3 hover:border-slate-800 focus:outline-none focus:ring ${
                  local.sectorId === sug.id ? "border-slate-900 ring-1 bg-white" : "border-slate-200 bg-white"
                }`}
                aria-pressed={local.sectorId === sug.id}
              >
                <div className="font-medium">{sug.label}</div>
                <div className="text-xs text-slate-600">{sug.reason}</div>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">Usaremos lo escrito en el paso 1 para proponer sectores.</p>
        )}
      </div>

      {/* Buscador */}
      <div className="mt-6">
        <label className="block text-sm font-medium">Buscar sector</label>
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          placeholder="Escribe para filtrar (ej: salud, turismo, fintech)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Lista de 14 sectores */}
      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        {filtered.map(s => (
          <button
            key={s.id}
            onClick={() => setLocal(prev => ({ ...prev, sectorId: s.id, template: templateForSector(s.id) }))}
            className={`text-left rounded-xl border p-4 hover:border-slate-800 focus:outline-none focus:ring ${
              local.sectorId === s.id ? "border-slate-900 ring-1" : "border-slate-200"
            }`}
            aria-pressed={local.sectorId === s.id}
          >
            <div className="font-medium">{s.label}</div>
            <div className="text-xs text-slate-600 mt-1 line-clamp-2">{s.description}</div>
          </button>
        ))}
      </div>

      {/* Plantilla */}
      <div className="mt-6">
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
        {errors.template && <p className="mt-1 text-xs text-red-600">{errors.template}</p>}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <PrevButton href="/wizard/step-1" />
        <NextButton onClick={onNext} />
      </div>
    </div>
  );
}
