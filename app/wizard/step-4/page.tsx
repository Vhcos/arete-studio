"use client";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/state/wizard-store";
import { PrevButton } from "@/components/wizard/WizardNav";
import { useState } from "react";

const NEXT_STEP_PATH = "/"; // PR-5 lo cambiaremos a /report (o tu ruta real)

export default function Step4Page() {
  const router = useRouter();
  const { data, clear } = useWizardStore();
  const [loading, setLoading] = useState(false);

  async function onFinish() {
    setLoading(true);
    try {
      console.log("[Wizard] Datos listos para enviar:", data);
      clear();
      router.push(NEXT_STEP_PATH);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Paso 4 · Confirmación</h1>
      <p className="text-sm text-slate-600 mb-6">Revisa y envía. (En el siguiente PR guardaremos en tu cuenta y abriremos el informe.)</p>

      <pre className="bg-slate-50 border rounded-lg p-3 overflow-x-auto text-sm">{JSON.stringify(data, null, 2)}</pre>

      <div className="mt-8 flex items-center justify-between">
        <PrevButton href="/wizard/step-3" />
        <button
          onClick={onFinish}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 focus:outline-none focus:ring disabled:opacity-60"
        >
          {loading ? "Procesando…" : "Finalizar (stub)"}
        </button>
      </div>
    </div>
  );
}
