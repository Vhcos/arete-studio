// app/billing/page.tsx
"use client";

import { useState } from "react";

// Config créditos
const CREDITS_PER_REPORT = Number(
  process.env.NEXT_PUBLIC_CREDITS_PER_REPORT ?? 6
);

// Pack lanzamiento
const TOTAL_PACK_CREDITS = 60;
const APPROX_REPORTS = Math.floor(TOTAL_PACK_CREDITS / CREDITS_PER_REPORT);

async function startWebpay(concept: "pack200" | "addon30m") {
  const res = await fetch("/api/webpay/plus/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ concept }),
  });
  const json = await res.json();
  if (!json?.ok) {
    alert("No se pudo iniciar el pago. Intenta nuevamente.");
    return;
  }
  const form = document.createElement("form");
  form.method = "POST";
  form.action = json.url;
  const input = document.createElement("input");
  input.name = "token_ws";
  input.value = json.token;
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
}

export default function BillingPage() {
  const [loading, setLoading] = useState<null | "pack" | "addon">(null);

  const onBuyPack = async () => {
    try {
      setLoading("pack");
      await startWebpay("pack200");
    } finally {
      setLoading(null);
    }
  };

  const onBuyAddon = async () => {
    try {
      setLoading("addon");
      await startWebpay("addon30m");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Planes sencillos para ideas y negocios en marcha
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Usa Aret3 para entender si tu idea nueva o tu negocio que ya está
          vendiendo se sostiene en números y para bajar la ansiedad antes de
          tomar decisiones grandes. Pagas solo por los créditos que usas al
          generar informes con IA.
        </p>

        {/* Cómo se usan los créditos */}
        <div className="mt-4 inline-flex flex-col gap-1 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs sm:text-sm text-blue-900">
          <span className="font-semibold uppercase tracking-wide">
            ¿Cómo se usan los créditos en Aret3?
          </span>
          <ul className="mt-1 space-y-1 list-disc pl-4">
            <li>
              <strong>1 crédito</strong> cada vez que usas la IA solo para un
              bloque: <strong>idea</strong>,{" "}
              <strong>mirada Ventaja Diferenciadora</strong> o{" "}
              <strong>análisis económico / mercado</strong>.
            </li>
            <li>
              <strong>3 créditos</strong> cuando activas el{" "}
              <strong>Informe con IA Aret3</strong>, porque{" "}
              <strong>combina todo el camino y lo entrega pulido</strong> en un
              solo informe.
            </li>
            <li>
              Si usas todo en un mismo proyecto (bloques sueltos + informe
              completo), el máximo son <strong>6 créditos</strong>.
            </li>
            <li>
              Cada vez que repites cualquier botón de IA, se descuentan créditos
              de nuevo.
            </li>
            <li>
              Con este pack de{" "}
              <strong>{TOTAL_PACK_CREDITS} créditos de lanzamiento</strong>,
              tienes margen para alrededor de{" "}
              <strong>{APPROX_REPORTS} informes completos</strong> usando todas
              las ayudas.
            </li>
          </ul>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Pack lanzamiento créditos */}
          <div className="rounded-2xl border border-blue-200/70 bg-white p-6 shadow-sm shadow-blue-50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                  Pack recomendado
                </span>
                <h2 className="mt-2 text-xl font-semibold">
                  Pack emprendedor — {TOTAL_PACK_CREDITS} créditos
                </h2>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-rose-700">
                  Lanzamiento · 50% OFF
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-gray-400 line-through">
                    $20.000
                  </span>
                  <span className="text-2xl font-bold text-blue-700">
                    $10.000
                  </span>
                </div>
                <span className="text-[11px] text-gray-500">
                  CLP (≈ usd $10) · Precio lanzamiento
                </span>
              </div>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Precio normal <span className="line-through">$20.000 CLP</span>.
              Durante el lanzamiento obtienes el mismo pack al{" "}
              <span className="font-semibold">50% de descuento</span>.
            </p>

            <p className="mt-3 text-sm text-gray-500">
              Compra única. Ideal para validar varias ideas o revisar negocios
              en funcionamiento sin suscripciones mensuales.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>
                • <strong>{TOTAL_PACK_CREDITS} créditos de IA</strong> (cada
                informe completo puede usar hasta{" "}
                <strong>{CREDITS_PER_REPORT} créditos</strong> si activas todas
                las ayudas).
              </li>
              <li>
                • Suficiente para generar aprox.{" "}
                <strong>{APPROX_REPORTS} informes completos</strong>.
              </li>
              <li>
                • Úsalo con ideas nuevas o con MIPYMES que ya están vendiendo.
              </li>
              <li>
                • Informe premium: diagnóstico,{" "}
                <span className="font-semibold">Regla del 8 %</span>, riesgos y
                oportunidades.
              </li>
              <li>• Punto de equilibrio estimado e indicadores clave.</li>
              <li>
                • Plan de acción de 6 semanas para ordenar tus próximos pasos.
              </li>
              <li>• Copiar informe para pegar donde lo necesites.</li>
              <li>• Enviar informe por email directamente desde Aret3.</li>
              <li>• Acceso inmediato, sin permanencia ni suscripción mensual.</li>
            </ul>

            <button
              onClick={onBuyPack}
              disabled={loading !== null}
              className={`
                mt-6 inline-flex w-full items-center justify-center gap-2
                rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-slate-900
                px-5 py-3 text-sm font-semibold text-white shadow-md
                transition-all duration-200
                hover:from-sky-400 hover:via-blue-500 hover:to-slate-800
                active:scale-[0.98]
                disabled:opacity-60
              `}
            >
              <span>
                {loading === "pack"
                  ? "Conectando con Webpay…"
                  : `Comprar pack lanzamiento de ${TOTAL_PACK_CREDITS} créditos ($10.000 CLP)`}
              </span>
              <span aria-hidden>⚡</span>
            </button>
          </div>

          {/* Asesoría 1 hora */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Asesoría 1:1 (60 min)</h2>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-bold">$40.000</span>
                <span className="text-xs text-gray-500">
                  CLP (≈ usd $40 aprox.)
                </span>
              </div>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Compra única. Sesión en vivo para traducir tu informe Aret3 en
              decisiones concretas y accionables.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>
                • Revisamos juntos tu informe Aret3: idea nueva o negocio en
                marcha.
              </li>
              <li>
                • Explicamos métricas clave: ventas, margen, Regla del 8 %, punto
                de equilibrio.
              </li>
              <li>
                • Definimos 3–5 acciones claras para los próximos 30 días.
              </li>
              <li>• Espacio para preguntas específicas sobre tu caso.</li>
              <li>• Sesión online por Zoom/Meet (60 minutos).</li>
            </ul>

            <button
              onClick={onBuyAddon}
              disabled={loading !== null}
              className={`
                mt-6 inline-flex w-full items-center justify-center gap-2
                rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-slate-900
                px-5 py-3 text-sm font-semibold text-white shadow-md
                transition-all duration-200
                hover:from-sky-400 hover:via-blue-500 hover:to-slate-800
                active:scale-[0.98]
                disabled:opacity-60
              `}
            >
              <span>
                {loading === "addon"
                  ? "Conectando con Webpay…"
                  : "Comprar asesoría 1:1 ($40.000 CLP)"}
              </span>
              <span aria-hidden>💬</span>
            </button>
          </div>
        </div>

        {/* Qué incluye cada informe */}
        <div className="mt-10 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900">
            ¿Qué incluye cada informe con IA Aret3?
          </h3>
          <ul className="mt-2 grid gap-2 text-sm text-gray-700 md:grid-cols-3">
            <li>
              • Diagnóstico con la{" "}
              <span className="font-semibold">Regla del 8&nbsp;%</span> y nivel
              de salud del negocio.
            </li>
            <li>
              • Riesgos, oportunidades y punto de equilibrio estimado para tu
              idea o negocio.
            </li>
            <li>
              • Plan de acción de 6 semanas con pasos concretos para mejorar tus
              números.
            </li>
          </ul>
        </div>

        {/* Bloque instituciones */}
        <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold">
            ¿Eres una universidad, incubadora, municipio o cowork?
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Ofrecemos licencias para instituciones, uso en programas de
            emprendimiento y opciones de marca blanca para trabajar con muchas
            MIPYMES a la vez. Si quieres usar Aret3 con 20, 50 o 200
            emprendedores, armamos un plan a medida.
          </p>
          <a
            href="mailto:vhc@aret3.cl?subject=Licencia%20ARET3%20para%20institución"
            className="mt-4 inline-block rounded-xl border border-blue-600 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            Contáctanos
          </a>
        </div>

        {/* Bloque seguridad y legal */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h4 className="font-semibold">
              Tu idea y tu negocio, bajo llave 🔐
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                • <strong>Privada por diseño</strong>: tus informes no se
                comparten ni se venden.
              </li>
              <li>• Cifrada en tránsito (HTTPS).</li>
              <li>
                • <strong>Control total</strong>: puedes solicitar el borrado de
                tus datos cuando quieras.
              </li>
              <li>
                • Usamos tu información solo para generar tus informes y mejorar
                la experiencia.
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h4 className="font-semibold">Información legal y contacto</h4>
            <p className="mt-3 text-sm text-gray-600">
              Revisa nuestros documentos y escríbenos si necesitas algo.
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <a href="/terms" className="text-blue-700 underline">
                Ver Términos y Condiciones
              </a>
              <br />
              <a href="/privacy" className="text-blue-700 underline">
                Ver Política de Privacidad
              </a>
              <br />
              <a
                href="mailto:vhc@aret3.cl?subject=Contacto%20ARET3"
                className="text-blue-700 underline"
              >
                Contacto
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
