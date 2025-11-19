// app/wizard/step-6/_components/Step6Video.tsx
"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, any>>;
  }
}

export default function Step6Video() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    // Tracking simple al cargar el bloque de video
    window.dataLayer?.push({
      event: "step6_video_view",
      step: 6,
      source: "wizard",
    });
  }, []);

  return (
    <section className="mx-auto mb-6 max-w-3xl">
      <div className="space-y-3">
        {/* Título corto y limpio */}
        <p className="text-center text-sm font-medium text-slate-700">
          Mira este video de 1 minuto.
        </p>

        {/* Card del video, con fondo claro y sombra suave */}
        <div className="overflow-hidden rounded-xl bg-slate-50 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
          <div className="aspect-video">
            <iframe
              ref={iframeRef}
              title="Cómo completar el Paso 6 en aret3"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              // VIDEO_ID del short de YouTube
              src="https://www.youtube.com/embed/LyRSJ3OLf-0?rel=0&modestbranding=1"
              className="h-full w-full"
            />
          </div>
        </div>

        {/* Texto breve bajo el video */}
        <p className="text-center text-xs text-slate-500">
          Guía rápida del Paso Económico: cómo estimar ticket, clientes y ventas mensuales/anuales con IA.
        </p>
      </div>
    </section>
  );
}
