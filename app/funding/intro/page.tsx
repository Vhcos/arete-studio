// app/funding/intro/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon } from "lucide-react";

export default function FundingIntroPage() {
  const router = useRouter();
  const search = useSearchParams();

  // id de la FundingSession que viene desde /
  // Ej: /funding/intro?idea=...&rubro=...&ubicacion=...&fs=xxxxx
  const fundingSessionId = search?.get("fs") ?? null;
  const idea = search?.get("idea") ?? null;
  const rubro = search?.get("rubro") ?? null;
  const ubicacion = search?.get("ubicacion") ?? null;

  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleConfirm = () => {
    if (!fundingSessionId) return;
    setLoading(true);
    router.push(`/funding/${fundingSessionId}`);
  };

  // Si llegamos sin fs, mostramos mensaje de error simple
  if (!fundingSessionId) {
    return (
      <main className="container max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <h1 className="text-xl font-semibold">Módulo de financiamiento</h1>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              No encontramos la sesión de financiamiento asociada a esta pantalla.
            </p>
            <p className="text-sm">
              Vuelve al informe, genera tu informe con IA y luego usa el botón
              <strong> "Seguir a formulario de financiamiento"</strong>.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <main className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            {/* Icono constructor (nuevo) */}
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <img
                src="/icon-constructor.png"
                alt="Módulo de financiamiento aret3"
                className="h-8 w-8 rounded-full"
                loading="lazy"
              />
            </span>

            <div>
              <h1 className="text-xl font-semibold">
                Prepara tu postulación a fondos con Aret3
              </h1>
              <p className="text-xs text-muted-foreground">
                Activar este módulo usa <strong>3 créditos</strong> una sola vez para este
                proyecto.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            <Badge variant="outline">Sercotec</Badge>
            <Badge variant="outline">Corfo</Badge>
            <Badge variant="outline">Fondos municipales</Badge>
            <Badge variant="outline">Start-Up Chile</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm">
            Con la información de tu informe actual vamos a pre-llenar por ti las
            preguntas típicas de los formularios de financiamiento: problema, solución,
            mercado, modelo de negocio, ventas y uso del subsidio.
          </p>

          <ul className="text-sm list-disc list-inside space-y-1 text-muted-foreground">
            <li>Usamos tu informe y algunas preguntas extra que completarás después.</li>
            <li>Te entregamos borradores listos para copiar/pegar en los formularios reales.</li>
            <li>Podrás salir y volver cuando quieras sin perder la información.</li>
          </ul>

          {(idea || rubro || ubicacion) && (
            <div className="mt-3 rounded-lg border bg-muted/40 p-3 text-xs">
              <p className="font-semibold mb-1">Resumen rápido de este proyecto:</p>
              {idea && (
                <p>
                  <span className="font-medium">Idea:</span> {idea}
                </p>
              )}
              {rubro && (
                <p>
                  <span className="font-medium">Rubro:</span> {rubro}
                </p>
              )}
              {ubicacion && (
                <p>
                  <span className="font-medium">Ubicación:</span> {ubicacion}
                </p>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between gap-2">
          <Button variant="outline" onClick={handleBack} disabled={loading}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Volver al informe
          </Button>

          {/* Botón principal con estilo similar a "Ver todas las noticias" */}
          <Button
            onClick={handleConfirm}
            disabled={loading}
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
                {loading ? "Abriendo módulo..." : "Comenzar (usar 3 créditos)"}
              </span>
            </div>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
