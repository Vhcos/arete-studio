//app/billing/page.tsx
"use client";

import { useState } from "react";

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
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Planes sencillos y claros</h1>
        <p className="mt-2 text-gray-600">
          Paga solo por lo que usas. Tus créditos se aplican al generar informes con IA.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Plan 200 Créditos */}
          <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold">200 Créditos</h2>
              <span className="text-2xl font-bold">$5.000 (usd $5)</span>
              <span className="ml-1 text-gray-500">CLP</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Compra única. Ideal para validar varias ideas.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>• 200 créditos de IA (cada informe consume 2 créditos)</li>
              <li>• Informe premium (resumen de industria, competencia local, SWOT + mercado, veredicto final + ranking)</li>
              <li>• Plan de acción de 6 semanas (plan100 + bullets)</li>
              <li>• <strong>Copiar informe</strong> (pega donde necesites)</li>
              <li>• <strong>Enviar informe por email</strong></li>
              <li>• Soporte por email</li>
              <li>• Acceso inmediato; sin permanencia</li>
            </ul>
            <button
              onClick={onBuyPack}
              disabled={loading !== null}
              className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading === "pack" ? "Redirigiendo a Webpay…" : "Comprar 200 créditos ($5.000 CLP)"}
            </button>
          </div>

          {/* Asesoría 30 min */}
          <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold">Asesoría 1:1 (30 min)</h2>
              <span className="text-2xl font-bold">$30.000 (usd $30)</span>
              <span className="ml-1 text-gray-500">CLP</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Compra única. Acompañamiento experto para tu idea.</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>• Revisión de tu idea y del informe ARETE</li>
              <li>• Explicación de métricas, riesgos y oportunidades</li>
              <li>• Ajuste del plan de acción y próximos pasos</li>
              <li>• Sesión por Zoom/Meet</li>
            </ul>
            <button
              onClick={onBuyAddon}
              disabled={loading !== null}
              className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading === "addon" ? "Redirigiendo a Webpay…" : "Comprar asesoría ($30.000 CLP)"}
            </button>
          </div>
        </div>

        {/* Bloque instituciones */}
        <div className="mt-12 rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold">¿Eres una universidad, incubadora o cowork?</h3>
          <p className="mt-2 text-sm text-gray-600">
            Ofrecemos licencias para instituciones, integraciones y marca blanca. Cuéntanos tu caso.
          </p>
          <a
            href="mailto:vhc@aret3.cl?subject=Licencia%20ARETE%20para%20institución"
            className="mt-4 inline-block rounded-xl border border-blue-600 px-4 py-2 font-medium text-blue-700 hover:bg-blue-50"
          >
            Contáctanos
          </a>
        </div>

       {/* Bloque seguridad y legal */}
<div className="mt-6 grid gap-6 md:grid-cols-2">
  <div className="rounded-2xl border border-gray-200 p-6">
    <h4 className="font-semibold">Tu idea, bajo llave 🔐</h4>
    <ul className="mt-3 space-y-2 text-sm text-gray-700">
      <li>• <strong>Privada por diseño</strong>: tus informes no se comparten ni se venden.</li>
      <li>• <strong>Cifrada en tránsito</strong> (HTTPS).</li>
      <li>• <strong>Control total</strong>: puedes solicitar el borrado de tus datos cuando quieras.</li>
      <li>• <strong>Solo para ayudarte</strong>: usamos tus entradas para generar tu informe y mejorar la experiencia.</li>
    </ul>
  </div>
  <div className="rounded-2xl border border-gray-200 p-6">
    <h4 className="font-semibold">Información legal y contacto</h4>
    <p className="mt-3 text-sm text-gray-600">
      Revisa nuestros documentos y escríbenos si necesitas algo.
    </p>
    <div className="mt-3 space-y-2 text-sm">
      <a href="/terms" className="text-blue-700 underline">Ver Términos y Condiciones</a><br/>
      <a href="/privacy" className="text-blue-700 underline">Ver Política de Privacidad</a><br/>
      <a href="mailto:vhc@aret3.cl?subject=Contacto%20ARET3" className="text-blue-700 underline">Contacto</a>
    </div>
  </div>
</div>
      </div>
    </div>
  );
}