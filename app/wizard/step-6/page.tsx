"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { Step6Schema } from "@/lib/validation/wizard-extra";

export default function Step6Page() {
  const router = useRouter();
  const { data, setStep6 } = useWizardStore();
  const [local, setLocal] = useState({
    ticket: data.step6?.ticket ?? 0,
    costoUnit: data.step6?.costoUnit ?? 0,
    ingresosMeta: data.step6?.ingresosMeta ?? 0,
    gastosFijos: data.step6?.gastosFijos ?? 0,
    marketingMensual: data.step6?.marketingMensual ?? 0,
    costoPct: data.step6?.costoPct ?? 0,
  });
  const [err, setErr] = useState<string | null>(null);

  function onNext() {
    const parsed = Step6Schema.safeParse(local);
    if (!parsed.success) { setErr("Revisa los valores económicos."); return; }
    setStep6(parsed.data);
    // Aquí, al terminar, ya tenemos todo para IA → siguiente PR moverá el botón IA aquí
    router.push("/wizard/step-4"); // o a una pantalla final /tablero
  }

  function field(name: keyof typeof local, label: string, hint?: string) {
    return (
      <div>
        <label className="block text-sm font-medium">{label}</label>
        <input
          type="number"
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={local[name]}
          onChange={(e) => setLocal(s => ({ ...s, [name]: Number(e.target.value) }))}
        />
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Paso 6 · Económico</h1>
      <p className="text-sm text-slate-600 mb-6">Completa los supuestos para tu plan.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {field("ticket","Ticket promedio ($)")}
        {field("costoUnit","Costo unitario ($)")}
        {field("ingresosMeta","Ingresos meta mensuales ($)")}
        {field("gastosFijos","Gastos fijos mensuales ($)")}
        {field("marketingMensual","Marketing mensual ($)")}
        {field("costoPct","Costo variable (%)","0 a 100")}
      </div>

      {err && <p className="mt-3 text-xs text-red-600">{err}</p>}

      <div className="mt-6 flex items-center gap-3">
        <button onClick={() => router.push("/wizard/step-5")} className="rounded-lg border px-4 py-2">Atrás</button>
        <button onClick={onNext} className="rounded-lg bg-blue-600 text-white px-4 py-2">Guardar y continuar</button>
      </div>
    </div>
  );
}
