// app/funding/[sessionId]/f3/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

export default function FundingStep3Page() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string | undefined;

  const [montoSolicitado, setMontoSolicitado] = useState<string>("");
  const [tieneAportePropio, setTieneAportePropio] = useState<"si" | "no" | "">("");
  const [aportePropio, setAportePropio] = useState<string>("");
  const [porcentajeAporte, setPorcentajeAporte] = useState<string>("");
  const [usosPrincipales, setUsosPrincipales] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  if (!sessionId) {
    return (
      <main className="container max-w-3xl mx-auto py-8">
        <p className="text-sm text-red-600">
          No se encontró el ID de sesión de financiamiento.
        </p>
      </main>
    );
  }

  const handleBack = () => {
    router.push(`/funding/${sessionId}/f2`);
  };

  // Formato LATAM para montos de dinero
  const handleChangeMontoSolicitado = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) {
      setMontoSolicitado("");
      return;
    }
    const num = parseInt(digitsOnly, 10);
    if (Number.isNaN(num)) {
      setMontoSolicitado("");
      return;
    }
    setMontoSolicitado(num.toLocaleString("es-CL"));
  };

  const handleChangeAportePropio = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) {
      setAportePropio("");
      return;
    }
    const num = parseInt(digitsOnly, 10);
    if (Number.isNaN(num)) {
      setAportePropio("");
      return;
    }
    setAportePropio(num.toLocaleString("es-CL"));
  };

  const handleChangePorcentajeAporte = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) {
      setPorcentajeAporte("");
      return;
    }
    const num = parseInt(digitsOnly, 10);
    if (Number.isNaN(num)) {
      setPorcentajeAporte("");
      return;
    }
    // 0 a 100
    const bounded = Math.max(0, Math.min(100, num));
    setPorcentajeAporte(String(bounded));
  };

  const handleSaveAndContinue = async () => {
    setSaving(true);
    setSavedMsg(null);

    const montoSolicitadoNumber = montoSolicitado
      ? parseInt(montoSolicitado.replace(/\./g, ""), 10)
      : null;
    const aportePropioNumber = aportePropio
      ? parseInt(aportePropio.replace(/\./g, ""), 10)
      : null;
    const porcentajeAporteNumber = porcentajeAporte
      ? parseInt(porcentajeAporte, 10)
      : null;

    const payloadF3 = {
      step: "F3",
      montoSolicitado: montoSolicitadoNumber,
      tieneAportePropio,
      aportePropio: aportePropioNumber,
      porcentajeAporte: porcentajeAporteNumber,
      usosPrincipales: usosPrincipales || null,
    };

    try {
    const res = await fetch("/api/funding-session/save-step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        data: payloadF3,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.error("[F3] Error al guardar paso F3:", errJson);
    } else {
      setSavedMsg("Datos de monto y uso de fondos guardados.");
    }
  } catch (err) {
    console.error("[F3] Error de red al guardar paso F3:", err);
  } finally {
    setSaving(false);
    router.push(`/funding/${sessionId}/f4`);
  }
};

  return (
  <main className="container max-w-3xl mx-auto py-8 space-y-4">
  <header className="mb-4 text-center space-y-2">
    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
      Módulo de fondos
    </p>
    <h1 className="text-2xl font-semibold">
      Paso F3 – Monto y uso de fondos
    </h1>
    <p className="mt-1 text-sm text-muted-foreground max-w-xl mx-auto">
      Aquí definimos cuánto planeas pedir y en qué usarías el dinero. Esto es lo
            que más miran los evaluadores: que el monto tenga sentido con el tamaño de tu
            negocio y que el uso de fondos sea claro.

    </p>
    <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px]">
      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
       F3 de F5 · Monto y uso
      </span>
      <span className="text-slate-400">
        ID sesión:{" "}
        <code className="font-mono text-[10px] bg-slate-50 px-1.5 py-0.5 rounded">
          {sessionId}
        </code>
      </span>
    </div>
  </header>


      <Card>
        <CardHeader className="pb-3 space-y-3">
          <p className="text-sm font-medium">¿Cuánto planeas solicitar?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium">
                Monto aproximado que te gustaría pedir (en tu moneda)
              </span>
              <input
                type="text"
                inputMode="numeric"
                className="w-full rounded-md border px-2 py-1.5 text-sm"
                placeholder="Ej: 5.000.000"
                value={montoSolicitado}
                onChange={(e) => handleChangeMontoSolicitado(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                No tiene que ser perfecto, pero ayuda a dimensionar el proyecto.
              </p>
            </label>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          {/* Aporte propio */}
          <div className="space-y-2">
            <p className="text-xs font-medium">
              ¿Vas a aportar recursos propios al proyecto?
            </p>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTieneAportePropio("si")}
                className={`rounded-full px-3 py-1 border transition ${
                  tieneAportePropio === "si"
                    ? "border-primary bg-primary text-white"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => setTieneAportePropio("no")}
                className={`rounded-full px-3 py-1 border transition ${
                  tieneAportePropio === "no"
                    ? "border-primary bg-primary text-white"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                No
              </button>
            </div>

            {tieneAportePropio === "si" && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-medium">
                    Monto aproximado de aporte propio
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                    placeholder="Ej: 1.000.000"
                    value={aportePropio}
                    onChange={(e) => handleChangeAportePropio(e.target.value)}
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium">
                    ¿Qué porcentaje del proyecto sería aporte propio?
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      className="w-full rounded-md border px-2 py-1.5 text-sm"
                      placeholder="Ej: 20"
                      value={porcentajeAporte}
                      onChange={(e) => handleChangePorcentajeAporte(e.target.value)}
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Debe estar entre 0% y 100%. Si no estás seguro, puedes dejarlo en
                    blanco.
                  </p>
                </label>
              </div>
            )}
          </div>

          {/* Uso de fondos */}
          <div className="space-y-2">
            <p className="text-xs font-medium">¿En qué usarías principalmente estos fondos?</p>
            <p className="text-[11px] text-muted-foreground mb-1">
              Piensa en categorías como: equipamiento, capital de trabajo, marketing,
              formalización, mejoras de local, desarrollo tecnológico, etc.
            </p>
            <textarea
              className="w-full min-h-[120px] rounded-md border px-2 py-1.5 text-sm"
              placeholder="Ej: 
- 2.000.000 para equipamiento del local (mesas, sillas, cafeteras).
- 1.500.000 para capital de trabajo (insumos y sueldos primeros meses).
- 1.500.000 para marketing digital y mejoras en la página web."
              value={usosPrincipales}
              onChange={(e) => setUsosPrincipales(e.target.value)}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center gap-2">
          <Button variant="outline" onClick={handleBack} disabled={saving}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Volver a F2
          </Button>

          <div className="flex flex-col items-end gap-1">
            {savedMsg && (
              <p className="text-[11px] text-muted-foreground max-w-xs text-right">
                {savedMsg}
              </p>
            )}
            <Button
              onClick={handleSaveAndContinue}
              disabled={saving}
              className={`
                inline-flex flex-col items-center justify-center gap-0.5
                rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-slate-900
                px-3.5 py-2 text-[11px] font-medium text-white shadow-md
                transition-all duration-300
                hover:from-emerald-500 hover:to-emerald-700
                active:scale-[0.98]
                sm:flex-row sm:gap-2
              `}
            >
              <div className="flex items-center gap-1.5">
                <img
                  src="/aret3-logo.svg"
                  alt="aret3"
                  className="h-6 w-6 rounded-full shadow-[0_0_6px_rgba(56,189,248,0.9)]"
                  loading="lazy"
                />
                <span className="whitespace-nowrap">
                  {saving ? "Guardando..." : "Guardar y continuar"}
                </span>
              </div>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
