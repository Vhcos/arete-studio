import React from "react";

export default function Hero() {
  return (
    <section id="producto" className="mx-auto max-w-6xl px-4 pt-8 pb-6">
      <p className="text-xs font-semibold tracking-wider text-slate-400">ARET3</p>
      <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Evalúa tu idea de negocio con IA
      </h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Completa 5 pasos y recibe un informe claro para decidir. Rápido, simple y visual.
      </p>

      <div className="mt-5 flex gap-3">
        <a
          href="https://app.aret3.cl/auth/sign-in?callbackUrl=/"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Empieza gratis
        </a>
        <a
          href="#como-funciona"
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Ver cómo funciona
        </a>
      </div>
    </section>
  );
}
