"use client";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/state/wizard-store";
import { fromWizard } from "@/lib/model/app-form";

const SHOW_IA = false; // por ahora desactivado; moveremos IA luego del paso 6

export default function Step4Page() {
  const router = useRouter();
  const { data } = useWizardStore();
  const body = fromWizard(data);

  function onNext() {
  try {
    // Wizard store
    const s1 = (data as any)?.step1 ?? {};
    const s2 = (data as any)?.step2 ?? {};
    const s3 = (data as any)?.step3 ?? {}; 

    const meta = {
      projectName: s1.projectName ?? "",
      founderName: s1.founderName ?? "",
      email: s1.notifyEmail ?? "",
      idea: s1.idea ?? "",
      sectorId: s2.sectorId ?? "",
      ventajaTexto: s3.ventajaTexto ?? "", 
      // Si más adelante capturas ubicación/ventaja en el wizard, las agregas aquí:
      // ubicacion: sX.ubicacion ?? "",
      // ventajaTexto: sX.ventajaTexto ?? "",
    };

    localStorage.setItem(
      "arete:fromWizard",
      JSON.stringify({ meta, steps: ["step-1","step-2","step-3","step-4"] })
    );

    // Ir al Formulario con marcador
    router.push("/?from=wizard=1");
  } catch (e) {
    console.error("[Step4] onNext error", e);
    router.push("/?from=wizard=1");
  }
}

  async function onIA() {
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
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
      <h1 className="text-xl font-semibold mb-1">Paso 6 · Confirmación</h1>
      <p className="text-sm text-slate-600 mb-6">Revisa y entramos en los números y las emociones.</p>

      <div className="rounded-lg border p-4 text-sm">
        <p><b>Proyecto:</b> {body.projectName || "—"}</p>
        <p><b>Descripción:</b> {body.idea || "—"}</p>
        <p><b>Sector:</b> {body.sectorId || "—"}</p>
        <p><b>Plantilla:</b> {body.template || "default"}</p>
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={() => router.push("/wizard/step-5")} className="rounded-lg border px-4 py-2">Atrás</button>
        {SHOW_IA && (
          <button onClick={onIA} className="rounded-lg bg-slate-900 text-white px-4 py-2">Generar plan (IA)</button>
        )}
        <button onClick={onNext} className="rounded-lg bg-blue-600 text-white px-4 py-2">Ir al Formulario</button>
      </div>

      {!SHOW_IA && (
        <p className="mt-4 text-xs text-slate-500">
          Nota: la generación con IA se hará al final, cuando ya tengamos los Datos Emocionales  y Económico.
        </p>
      )}
    </div>
  );
}
