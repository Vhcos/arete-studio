"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StepIdea() {
  const r = useRouter();
  const [form, setForm] = useState({ idea: "", rubro: "", ubicacion: "" });
  const [saving, setSaving] = useState(false);

  async function saveAndNext() {
    setSaving(true);
    await fetch("/wizard/save", { method:"POST", body: JSON.stringify({ step:"idea", data: form }) });
    setSaving(false);
    r.push("/wizard/mercado");
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Paso 1: Tu idea</h2>
      <input className="w-full border p-3 rounded" placeholder="Describe tu idea"
             value={form.idea} onChange={e=>setForm({ ...form, idea:e.target.value })}/>
      <input className="w-full border p-3 rounded" placeholder="Rubro"
             value={form.rubro} onChange={e=>setForm({ ...form, rubro:e.target.value })}/>
      <input className="w-full border p-3 rounded" placeholder="Ubicación"
             value={form.ubicacion} onChange={e=>setForm({ ...form, ubicacion:e.target.value })}/>
      <div className="flex gap-3">
        <button onClick={saveAndNext} className="bg-black text-white px-4 py-2 rounded" disabled={saving}>
          {saving ? "Guardando..." : "Guardar y continuar"}
        </button>
      </div>
    </div>
  );
}
