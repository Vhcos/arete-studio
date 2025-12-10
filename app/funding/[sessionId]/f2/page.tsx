// app/funding/[sessionId]/f2/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

const ESTADO_NEGOCIO_OPTIONS = [
  { id: "idea", label: "Solo idea, todavía no he empezado" },
  { id: "marcha_sin_ventas", label: "En marcha, pero sin ventas aún" },
  { id: "primeras_ventas", label: "Tengo primeras ventas" },
  { id: "ventas_recurrentes", label: "Ventas recurrentes (más de 6 meses)" },
];

export default function FundingStep2Page() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string | undefined;

  // Estado del negocio / avance
  const [estadoNegocio, setEstadoNegocio] = useState<string>("idea");
  const [anioInicio, setAnioInicio] = useState<string>("");
  const [ventasMensuales, setVentasMensuales] = useState<string>(""); // formateado con puntos
  const [clientesMensuales, setClientesMensuales] = useState<string>("");
  const [tieneFormalizacion, setTieneFormalizacion] = useState<"si" | "no" | "">("");
  const [tipoFormalizacion, setTipoFormalizacion] = useState<string>("");
  const [tieneEmpleados, setTieneEmpleados] = useState<"si" | "no" | "">("");
  const [numEmpleados, setNumEmpleados] = useState<string>("");

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
    // Volver a F1
    router.push(`/funding/${sessionId}`);
  };

  // Formatea ventas con separador de miles estilo LATAM
  const handleChangeVentas = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) {
      setVentasMensuales("");
      return;
    }
    const num = parseInt(digitsOnly, 10);
    if (Number.isNaN(num)) {
      setVentasMensuales("");
      return;
    }
    const formatted = num.toLocaleString("es-CL"); // 1500000 -> "1.500.000"
    setVentasMensuales(formatted);
  };

  const handleChangeClientes = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) {
      setClientesMensuales("");
      return;
    }
    const num = parseInt(digitsOnly, 10);
    if (Number.isNaN(num)) {
      setClientesMensuales("");
      return;
    }
    setClientesMensuales(String(num));
  };

  const handleChangeEmpleados = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) {
      setNumEmpleados("");
      return;
    }
    const num = parseInt(digitsOnly, 10);
    if (Number.isNaN(num)) {
      setNumEmpleados("");
      return;
    }
    setNumEmpleados(String(num));
  };

  const handleSaveAndContinue = async () => {
    setSaving(true);
    setSavedMsg(null);

    const ventasMensualesNumber = ventasMensuales
      ? parseInt(ventasMensuales.replace(/\./g, ""), 10)
      : null;
    const clientesMensualesNumber = clientesMensuales
      ? parseInt(clientesMensuales, 10)
      : null;
    const numEmpleadosNumber = numEmpleados ? parseInt(numEmpleados, 10) : null;

    const payloadF2 = {
      step: "F2",
      estadoNegocio,
      anioInicio,
      ventasMensuales: ventasMensualesNumber,
      clientesMensuales: clientesMensualesNumber,
      tieneFormalizacion,
      tipoFormalizacion: tipoFormalizacion || null,
      tieneEmpleados,
      numEmpleados: numEmpleadosNumber,
    };

    try {
    const res = await fetch("/api/funding-session/save-step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        data: payloadF2,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.error("[F2] Error al guardar paso F2:", errJson);
    } else {
      setSavedMsg("Datos del negocio guardados.");
    }
  } catch (err) {
    console.error("[F2] Error de red al guardar paso F2:", err);
  } finally {
    setSaving(false);
    router.push(`/funding/${sessionId}/f3`);
  }
};

  return (
<main className="container max-w-3xl mx-auto py-8 space-y-4">
  <header className="mb-4 text-center space-y-2">
    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
      Módulo de financiamiento
    </p>
    <h1 className="text-2xl font-semibold">
      Paso F2 – Estado y avance del negocio
    </h1>
    <p className="mt-1 text-sm text-muted-foreground max-w-xl mx-auto">
      Aquí resumimos qué tan avanzado está tu negocio: desde idea hasta ventas
      recurrentes. Esta parte se usa mucho en los formularios para diferenciar
      entre emprendimientos en etapa inicial y negocios más establecidos.
    </p>
    <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px]">
      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
        F2 de F5 · Estado del negocio
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
          <p className="text-sm font-medium">¿En qué estado está tu negocio?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {ESTADO_NEGOCIO_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setEstadoNegocio(opt.id)}
                className={`
                  rounded-lg border px-3 py-2 text-xs text-left transition
                  ${
                    estadoNegocio === opt.id
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          {/* Año de inicio / antigüedad */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium">
                Año aproximado en que empezaste a trabajar en esta idea/negocio
              </span>
              <input
                type="text"
                className="w-full rounded-md border px-2 py-1.5 text-sm"
                placeholder="Ej: 2023"
                value={anioInicio}
                onChange={(e) => setAnioInicio(e.target.value)}
              />
            </label>
          </div>

          {/* Ventas y clientes */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium">
                Ventas promedio mensuales (en tu moneda)
              </span>
              <input
                type="text" // sin flechas
                inputMode="numeric"
                className="w-full rounded-md border px-2 py-1.5 text-sm"
                placeholder="Ej: 1.500.000"
                value={ventasMensuales}
                onChange={(e) => handleChangeVentas(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Si aún no vendes, puedes dejarlo en blanco.
              </p>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium">
                Clientes promedio al mes
              </span>
              <input
                type="text"
                inputMode="numeric"
                className="w-full rounded-md border px-2 py-1.5 text-sm"
                placeholder="Ej: 40"
                value={clientesMensuales}
                onChange={(e) => handleChangeClientes(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Debe ser cero o un número positivo. Puede ser aproximado.
              </p>
            </label>
          </div>

          {/* Formalización */}
          <div className="space-y-2">
            <p className="text-xs font-medium">¿Tienes formalización tributaria?</p>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTieneFormalizacion("si")}
                className={`rounded-full px-3 py-1 border transition ${
                  tieneFormalizacion === "si"
                    ? "border-primary bg-primary text-white"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => setTieneFormalizacion("no")}
                className={`rounded-full px-3 py-1 border transition ${
                  tieneFormalizacion === "no"
                    ? "border-primary bg-primary text-white"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                No
              </button>
            </div>

            {tieneFormalizacion === "si" && (
              <label className="mt-2 block space-y-1">
                <span className="text-xs font-medium">
                  Tipo de formalización (opcional)
                </span>
                <input
                  type="text"
                  className="w-full rounded-md border px-2 py-1.5 text-sm"
                  placeholder="Ej: Boleta de honorarios, SpA, EIRL, persona natural con giro, etc."
                  value={tipoFormalizacion}
                  onChange={(e) => setTipoFormalizacion(e.target.value)}
                />
              </label>
            )}
          </div>

          {/* Empleados */}
          <div className="space-y-2">
            <p className="text-xs font-medium">¿Tienes personas trabajando contigo?</p>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTieneEmpleados("si")}
                className={`rounded-full px-3 py-1 border transition ${
                  tieneEmpleados === "si"
                    ? "border-primary bg-primary text-white"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => setTieneEmpleados("no")}
                className={`rounded-full px-3 py-1 border transition ${
                  tieneEmpleados === "no"
                    ? "border-primary bg-primary text-white"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                No
              </button>
            </div>

            {tieneEmpleados === "si" && (
              <label className="mt-2 block space-y-1">
                <span className="text-xs font-medium">
                  ¿Cuántas personas trabajan contigo? (incluyéndote)
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full rounded-md border px-2 py-1.5 text-sm"
                  placeholder="Ej: 3"
                  value={numEmpleados}
                  onChange={(e) => handleChangeEmpleados(e.target.value)}
                />
              </label>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center gap-2">
          <Button variant="outline" onClick={handleBack} disabled={saving}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Volver a F1
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
