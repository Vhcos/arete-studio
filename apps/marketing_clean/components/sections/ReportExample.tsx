// apps/marketing_clean/components/sections/ReportExample.tsx
import React from "react";

const APP = process.env.NEXT_PUBLIC_APP_ORIGIN || "https://app.aret3.cl";

export default function ReportExample() {
  return (
    <section id="ejemplo" className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
        {/* Texto */}
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Ejemplo de informe</h2>
          <p className="mt-3 text-slate-600">
            Este es un informe real generado con Aret3. Es visual, accionable y pensado para quienes no son expertos en finanzas.
          </p>
          <ul className="mt-4 space-y-2 text-slate-700">
            <li>• Resumen ejecutivo con semáforo de rentabilidad.</li>
            <li>• Estado de resultados con waterfall y % por concepto.</li>
            <li>• Flujo de caja 12 meses y capital de trabajo.</li>
            <li>• Próximos pasos concretos y recomendaciones.</li>
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/ejemplo-informe.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Abrir en pestaña nueva
            </a>
            <a
              href={`${APP}/auth/sign-in?callbackUrl=/`}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Empieza gratis
            </a>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Nota: los resultados dependen de tus datos. Úsalo como orientación inicial y valida antes de decidir.
          </p>
        </div>

        {/* Visor PDF embebido */}
        <div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5">
            {/* Iframe suele andar mejor que <object> en móviles modernos */}
            <iframe
              src="/ejemplo-informe.pdf#view=FitH"
              title="Ejemplo de informe Aret3 (PDF)"
              className="h-[520px] w-full"
              loading="lazy"
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Si tu navegador bloquea el visor, usa “Abrir en pestaña nueva”.
          </p>
        </div>
      </div>
    </section>
  );
}
