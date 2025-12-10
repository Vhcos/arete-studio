// app/funding/[sessionId]/f5/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

type FundingDrafts = {
  resumen_ejecutivo: string;
  descripcion_negocio_y_producto: string;
  problema_y_oportunidad: string;
  propuesta_valor_y_solucion: string;
  mercado_y_clientes_objetivo: string;
  traccion_y_estado_actual: string;
  modelo_de_negocio_y_ingresos: string;
  monto_y_uso_de_fondos: string;
  impacto_y_resultados_esperados: string;
  equipo_y_capacidades: string;
};

export default function FundingStep5Page() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string | undefined;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<FundingDrafts | null>(null);

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
    router.push(`/funding/${sessionId}/f4`);
  };

  const handleGoBackToReport = () => {
    router.push("/?tab=explain");
  };

  const handleGenerateDrafts = async () => {
    try {
      setLoading(true);
      setError(null);
      setDrafts(null);

      const res = await fetch(`/api/funding-session/${sessionId}/drafts`, {
        method: "POST",
      });

      const raw = await res.text();

      if (!raw) {
        console.error(
          "[F5] Respuesta vacía desde /api/funding-session/:id/drafts. Status:",
          res.status
        );
        setError(
          "El servidor respondió vacío al generar los borradores. Revisa los logs del backend."
        );
        return;
      }

      let data: any;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        console.error(
          "[F5] Respuesta no-JSON desde /api/funding-session/:id/drafts:",
          raw
        );
        setError(
          "El servidor devolvió una respuesta que no pudimos interpretar. Revisa los logs del backend."
        );
        return;
      }

      if (!res.ok || !data.ok) {
        console.error("[F5] Error lógico en drafts:", data);
        setError(
          data?.error === "no_credits"
            ? "No tienes créditos suficientes para generar estos borradores."
            : data?.error || "Ocurrió un problema al generar los borradores."
        );
        return;
      }

      setDrafts(data.drafts as FundingDrafts);
    } catch (e) {
      console.error("[F5] Error de red al llamar a drafts:", e);
      setError("No pudimos conectar con el servidor. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container max-w-3xl mx-auto py-8 space-y-4">
      <header className="mb-4 text-center space-y-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Módulo Resumen
        </p>
        <h1 className="text-2xl font-semibold">
          Paso F5 – Resumen y borradores finales
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-xl mx-auto">
          Listo, ya tenemos toda la información clave para armar tu postulación:
          perfil del postulante (F1), estado del negocio (F2), monto y uso de
          fondos (F3) y tipo de instrumento / preferencias (F4).
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px]">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
            F5 de F5 · Resumen final
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
        <CardHeader className="space-y-2">
          <p className="text-sm font-medium">¿Qué haremos con estos datos?</p>
          <p className="text-xs text-muted-foreground">
            Desde aquí vamos a generar con IA los borradores de texto para tu
            postulación.
          </p>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          {/* Banner de celebración con lluvia de dinero */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-sky-500 to-blue-600 px-4 py-3 text-white shadow-md">
            <span className="money-rain left-4 top-0" style={{ animationDelay: "0s" }}>
              💸
            </span>
            <span
              className="money-rain left-12 top-[-10px]"
              style={{ animationDelay: "0.4s" }}
            >
              💸
            </span>
            <span
              className="money-rain left-24 top-[-6px]"
              style={{ animationDelay: "0.8s" }}
            >
              💸
            </span>
            <span
              className="money-rain right-10 top-[-8px]"
              style={{ animationDelay: "1.2s" }}
            >
              💸
            </span>

            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl">
                🪙
              </div>
              <div className="text-sm">
                <p className="font-semibold">
                  ¡Listo! Dejaste tu proyecto preparado para ir a buscar financiamiento 💪
                </p>
                <p className="text-[11px] sm:text-xs text-emerald-50">
                  Aquí podrás generar tus borradores con IA aret3 para postular a subsidios,
                  fondos y bancos sin partir desde cero.
                </p>
              </div>
            </div>
          </div>

          <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs sm:text-sm">
            <li>
              Resumen ejecutivo, problema, solución, mercado y modelo de negocio
              listos para <strong>copiar/pegar</strong> en formularios de Sercotec, Corfo,
              fondos municipales y bancos.
            </li>
            <li>
              Texto de <strong>“monto y uso de fondos”</strong> consistente con lo que
              indicaste en F3.
            </li>
            <li>
              Bloques específicos de <strong>tracción</strong>, <strong>impacto</strong> y{" "}
              <strong>equipo</strong> para responder varias preguntas sin escribir desde cero.
            </li>
          </ul>

          <div className="rounded-lg border bg-muted/40 p-3 text-xs sm:text-sm">
            <p className="font-semibold mb-1">¿Qué pasa ahora?</p>
            <p className="text-muted-foreground">
              Tus respuestas quedan asociadas a este proyecto para que puedas retomarlas
              cuando quieras y para que podamos preparar los textos de postulación.
            </p>
            <ul className="mt-1 list-disc list-inside space-y-0.5 text-muted-foreground">
              <li>
                Podrás revisar y actualizar estos datos antes de enviar tu postulación
                real.
              </li>
              <li>
                Puedes generar borradores con IA aret3 listos para copiar y pegar en los
                formularios.
              </li>
              <li>
                Más adelante podrás descargar un resumen con toda la información de tu
                proyecto y del financiamiento que buscas.
              </li>
            </ul>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-muted-foreground">
              Generar los borradores con IA aret3 usa <strong>1 crédito</strong>.
            </p>
            <Button
              onClick={handleGenerateDrafts}
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
                  {loading ? "Generando borradores..." : "Generar borradores con IA"}
                </span>
              </div>
            </Button>
          </div>

          {/* Resultado de la IA */}
          {drafts && (
            <div className="mt-4 space-y-3 text-xs sm:text-sm">
              <p className="font-semibold text-slate-700">Borradores generados</p>

              <div className="grid gap-3">
                <div className="rounded-md border bg-white px-3 py-2">
                  <p className="text-[11px] font-semibold mb-1">
                    1. Resumen ejecutivo
                  </p>
                  <p className="whitespace-pre-line text-slate-700">
                    {drafts.resumen_ejecutivo}
                  </p>
                </div>

                <div className="rounded-md border bg-white px-3 py-2">
                  <p className="text-[11px] font-semibold mb-1">
                    2. Descripción del negocio y producto/servicio
                  </p>
                  <p className="whitespace-pre-line text-slate-700">
                    {drafts.descripcion_negocio_y_producto}
                  </p>
                </div>

                <div className="rounded-md border bg-white px-3 py-2">
                  <p className="text-[11px] font-semibold mb-1">
                    3. Problema u oportunidad
                  </p>
                  <p className="whitespace-pre-line text-slate-700">
                    {drafts.problema_y_oportunidad}
                  </p>
                </div>

                <div className="rounded-md border bg-white px-3 py-2">
                  <p className="text-[11px] font-semibold mb-1">
                    4. Propuesta de valor y solución
                  </p>
                  <p className="whitespace-pre-line text-slate-700">
                    {drafts.propuesta_valor_y_solucion}
                  </p>
                </div>

                <div className="rounded-md border bg-white px-3 py-2">
                  <p className="text-[11px] font-semibold mb-1">
                    5. Mercado y clientes objetivo
                  </p>
                  <p className="whitespace-pre-line text-slate-700">
                    {drafts.mercado_y_clientes_objetivo}
                  </p>
                </div>

                <div className="rounded-md border bg-white px-3 py-2">
                  <p className="text-[11px] font-semibold mb-1">
                    6. Tracción y estado actual del negocio
                  </p>
                  <p className="whitespace-pre-line text-slate-700">
                    {drafts.traccion_y_estado_actual}
                  </p>
                </div>

                <div className="rounded-md border bg-white px-3 py-2">
                  <p className="text-[11px] font-semibold mb-1">
                    7. Modelo de negocio e ingresos
                  </p>
                  <p className="whitespace-pre-line text-slate-700">
                    {drafts.modelo_de_negocio_y_ingresos}
                  </p>
                </div>

                <div className="rounded-md border bg-white px-3 py-2">
                  <p className="text-[11px] font-semibold mb-1">
                    8. Monto y uso de fondos
                  </p>
                  <p className="whitespace-pre-line text-slate-700">
                    {drafts.monto_y_uso_de_fondos}
                  </p>
                </div>

                <div className="rounded-md border bg-white px-3 py-2">
                  <p className="text-[11px] font-semibold mb-1">
                    9. Impacto e indicadores esperados
                  </p>
                  <p className="whitespace-pre-line text-slate-700">
                    {drafts.impacto_y_resultados_esperados}
                  </p>
                </div>

                <div className="rounded-md border bg-white px-3 py-2">
                  <p className="text-[11px] font-semibold mb-1">
                    10. Equipo y capacidades
                  </p>
                  <p className="whitespace-pre-line text-slate-700">
                    {drafts.equipo_y_capacidades}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between items-center gap-2">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Volver a F4
          </Button>

          <div className="flex flex-col items-end gap-1">
            <p className="text-[11px] text-muted-foreground max-w-xs text-right">
              Puedes volver a tu informe cuando quieras. Esta sesión quedará como base
              para los borradores de financiamiento.
            </p>
            <Button
              onClick={handleGoBackToReport}
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
                <span className="whitespace-nowrap">Volver al informe</span>
              </div>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
