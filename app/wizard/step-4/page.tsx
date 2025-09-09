"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/state/wizard-store";
import { fromWizard } from "@/lib/model/app-form";
import { PrevButton } from "@/components/wizard/WizardNav";

export default function Step4Page() {
  const router = useRouter();
  const { data, clear } = useWizardStore();

  const mapped = fromWizard(data); // projectName, shortDescription, sector, sectorId, template
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onGenerate() {
    setLoading(true);
    setErr(null);
    setResp(null);
    try {
      const payload = {
        projectName: mapped.projectName,
        shortDescription: mapped.shortDescription,
        sector: mapped.sector,        // texto libre del paso 1
        sectorId: mapped.sectorId,    // canónico del paso 2 (14 sectores)
        template: mapped.template,    // básica / lean / pitch
        input: {},                    // PR-5: aquí añadimos números si los pides
      };
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      setResp(json);
      // PR-5: guardar en DB y redirigir a tablero+informe
      // router.push("/tablero"); // cuando esté listo
      clear();
    } catch (e: any) {
      setErr(e?.message ?? "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  const disabled =
    !mapped.projectName || !mapped.sectorId; // mínimo necesario para llamar a la API

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Paso 4 · Confirmación</h1>
      <p className="text-sm text-slate-600 mb-6">Revisa y envía para generar tu plan.</p>

      <div className="rounded-xl border bg-slate-50 p-4 text-sm space-y-2">
        <div><span className="font-medium">Proyecto:</span> {mapped.projectName || "—"}</div>
        <div><span className="font-medium">Descripción:</span> {mapped.shortDescription || "—"}</div>
        <div><span className="font-medium">Sector (canónico):</span> {mapped.sectorId || "—"}</div>
        <div><span className="font-medium">Sector (libre):</span> {mapped.sector || "—"}</div>
        <div><span className="font-medium">Plantilla:</span> {mapped.template || "—"}</div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <PrevButton href="/wizard/step-3" />
        <button
          onClick={onGenerate}
          disabled={loading || disabled}
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Generando…" : "Generar plan (IA)"}
        </button>
      </div>

      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

      {resp && (
        <div className="mt-6">
          <h2 className="font-medium">Resultado (preview)</h2>
          <pre className="mt-2 rounded-lg border bg-white p-3 text-xs overflow-x-auto">
            {JSON.stringify(resp, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
