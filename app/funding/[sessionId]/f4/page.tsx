// app/funding/[sessionId]/f4/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

const TIPO_INSTRUMENTO_OPTIONS = [
  { id: "subsidio", label: "Subsidio no reembolsable" },
  { id: "credito", label: "Crédito bancario / línea de financiamiento" },
  { id: "capital_semilla", label: "Capital semilla / incubadoras / aceleradoras" },
  { id: "fondos_publicos", label: "Fondos municipales / regionales / públicos" },
  { id: "no_seguro", label: "No estoy seguro, quiero sugerencias" },
];

const INSTITUCION_PREFERIDA_OPTIONS = [
  { id: "sercotec", label: "Sercotec" },
  { id: "corfo", label: "Corfo" },
  { id: "startup_chile", label: "Start-Up Chile / programas de aceleración" },
  { id: "municipalidad", label: "Municipalidad / Gobierno Regional" },
  { id: "banco", label: "Banco / cooperativa" },
  { id: "otro", label: "Otro / sin preferencia" },
];

export default function FundingStep4Page() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string | undefined;

  const [tipoInstrumento, setTipoInstrumento] = useState<string>("subsidio");
  const [institucionesPreferidas, setInstitucionesPreferidas] = useState<string[]>([]);
  const [dispuestoEndeudarse, setDispuestoEndeudarse] = useState<"si" | "no" | "">("");
  const [plazoUsoFondos, setPlazoUsoFondos] = useState<string>("");
  const [comentariosExtra, setComentariosExtra] = useState<string>("");

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
    router.push(`/funding/${sessionId}/f3`);
  };

  const toggleInstitucion = (id: string) => {
    setInstitucionesPreferidas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSaveAndContinue = async () => {
    setSaving(true);
    setSavedMsg(null);

    const payloadF4 = {
      step: "F4",
      tipoInstrumento,
      institucionesPreferidas,
      dispuestoEndeudarse,
      plazoUsoFondos: plazoUsoFondos || null,
      comentariosExtra: comentariosExtra || null,
    };

     try {
    const res = await fetch("/api/funding-session/save-step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        data: payloadF4,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.error("[F4] Error al guardar paso F4:", errJson);
    } else {
      setSavedMsg("Preferencias de instrumento guardadas.");
    }
  } catch (err) {
    console.error("[F4] Error de red al guardar paso F4:", err);
  } finally {
    setSaving(false);
    router.push(`/funding/${sessionId}/f5`);
  }
};

  return (
<main className="container max-w-3xl mx-auto py-8 space-y-4">
  <header className="mb-4 text-center space-y-2">
    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
      Módulo de financiamiento
    </p>
    <h1 className="text-2xl font-semibold">
      Paso F4 – Tipo de instrumento y preferencias
    </h1>
    <p className="mt-1 text-sm text-muted-foreground max-w-xl mx-auto">
      Cuéntanos qué tipo de financiamiento te interesa y con qué instituciones
      te gustaría postular. Esto nos ayuda a ajustar los textos y sugerencias a tu
      realidad (subsidios, créditos, fondos locales, etc.).
    </p>
    <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px]">
      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
        F4 de F5 · Instrumentos y preferencias
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
        <CardHeader className="pb-3 space-y-4">
          {/* Tipo de instrumento */}
          <div>
            <p className="text-sm font-medium">¿Qué tipo de financiamiento buscas?</p>
            <div className="grid gap-2 sm:grid-cols-2 mt-2">
              {TIPO_INSTRUMENTO_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTipoInstrumento(opt.id)}
                  className={`
                    rounded-lg border px-3 py-2 text-xs text-left transition
                    ${
                      tipoInstrumento === opt.id
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Instituciones preferidas */}
          <div>
            <p className="text-sm font-medium">
              ¿Con qué tipo de instituciones te gustaría postular?
            </p>
            <p className="text-[11px] text-muted-foreground mb-1">
              Puedes seleccionar una o varias opciones.
            </p>
            <div className="flex flex-wrap gap-2 mt-1 text-xs">
              {INSTITUCION_PREFERIDA_OPTIONS.map((opt) => {
                const active = institucionesPreferidas.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleInstitucion(opt.id)}
                    className={`
                      rounded-full border px-3 py-1 transition
                      ${
                        active
                          ? "border-primary bg-primary text-white"
                          : "border-slate-300 text-slate-600 hover:bg-slate-50"
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          {/* Disposición a endeudarse */}
          <div className="space-y-2">
            <p className="text-xs font-medium">
              Si una opción de financiamiento implica endeudarse (créditos, leasing, etc.),
              ¿estarías dispuesto/a a considerarlo?
            </p>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDispuestoEndeudarse("si")}
                className={`rounded-full px-3 py-1 border transition ${
                  dispuestoEndeudarse === "si"
                    ? "border-primary bg-primary text-white"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                Sí, abierto a evaluarlo
              </button>
              <button
                type="button"
                onClick={() => setDispuestoEndeudarse("no")}
                className={`rounded-full px-3 py-1 border transition ${
                  dispuestoEndeudarse === "no"
                    ? "border-primary bg-primary text-white"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                Prefiero solo subsidios / no quiero deuda
              </button>
            </div>
          </div>

          {/* Plazo de uso de fondos */}
          <div className="space-y-1">
            <p className="text-xs font-medium">
              ¿En qué plazo aproximado usarías la mayor parte de los fondos?
            </p>
            <select
              className="mt-1 w-full max-w-xs rounded-md border px-2 py-1.5 text-sm"
              value={plazoUsoFondos}
              onChange={(e) => setPlazoUsoFondos(e.target.value)}
            >
              <option value="">Selecciona una opción</option>
              <option value="3_6">Entre 3 y 6 meses</option>
              <option value="6_12">Entre 6 y 12 meses</option>
              <option value="mas_12">Más de 12 meses</option>
            </select>
          </div>

          {/* Comentarios extra */}
          <div className="space-y-1">
            <p className="text-xs font-medium">
              Comentarios adicionales (opcional)
            </p>
            <p className="text-[11px] text-muted-foreground mb-1">
              Por ejemplo: “No quiero postular a bancos tradicionales”, “me interesa algo
              rápido aunque el monto sea menor”, o cualquier restricción/prefencia que
              quieras que tengamos en cuenta.
            </p>
            <textarea
              className="w-full min-h-[100px] rounded-md border px-2 py-1.5 text-sm"
              value={comentariosExtra}
              onChange={(e) => setComentariosExtra(e.target.value)}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center gap-2">
          <Button variant="outline" onClick={handleBack} disabled={saving}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Volver a F3
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
