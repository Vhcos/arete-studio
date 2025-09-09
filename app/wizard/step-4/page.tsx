"use client";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/state/wizard-store";
import { fromWizard } from "@/lib/model/app-form";

const SHOW_IA = false; // <- por ahora desactivado

export default function Step4Page() {
  const router = useRouter();
  const { data } = useWizardStore();
  const body = fromWizard(data);

  function onFinish() {
    // TODO: apunta al Tablero+Informe cuando tengamos la ruta exacta
    router.push("/"); 
  }

  async function onIA() {
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        // Importante: ya va sectorId desde fromWizard()
        body: JSON.stringify({
          projectName: body.projectName,
          sectorId: body.sectorId,
          input: {
            ticket:  body.ticket ?? 0,
            costoUnit: body.costoUnit ?? 0,
            ingresosMeta: body.ingresosMeta ?? 0,
            gastosFijos: body.gastosFijos ?? 0,
            marketingMensual: body.marketingMensual ?? 0,
            costoPct: body.costoPct ?? 0,
          }
        }),
      });
      const j = await res.json();
      console.log("[preview IA]", j);
      alert("Generación IA (preview): revisa consola del navegador");
    } catch (e:any) {
      alert("No se pudo generar el plan (preview)");
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Paso 4 · Confirmación</h1>
      <p className="text-sm text-slate-600 mb-6">Revisa y cierra para generar tu plan.</p>

      <div className="rounded-lg border p-4 text-sm">
        <p><b>Proyecto:</b> {body.projectName || "—"}</p>
        <p><b>Descripción:</b> {body.shortDescription || "—"}</p>
        <p><b>Sector (canónico):</b> {body.sectorId || "—"}</p>
        <p><b>Plantilla:</b> {body.template || "default"}</p>
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={() => router.push("/wizard/step-3")} className="rounded-lg border px-4 py-2">Atrás</button>
        {SHOW_IA && (
          <button onClick={onIA} className="rounded-lg bg-slate-900 text-white px-4 py-2">Generar plan (IA)</button>
        )}
        <button onClick={onFinish} className="rounded-lg bg-blue-600 text-white px-4 py-2">Finalizar</button>
      </div>

      {!SHOW_IA && (
        <p className="mt-4 text-xs text-slate-500">
          Nota: La generación con IA se moverá al final (después de “Emocional” y “Económico”) para usar toda la información.
        </p>
      )}
    </div>
  );
}
