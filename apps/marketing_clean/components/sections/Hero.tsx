// apps/marketing_clean/components/sections/Hero.tsx
import React from "react";

export default function Hero() {
  return (
    <section id="producto" className="mx-auto max-w-6xl px-4 pt-12 pb-10 text-center">
      <p className="text-xs font-semibold tracking-wider text-slate-400">#1 software de negocios en Chile para evaluar ideas</p>
      <h1 className="mt-2 mx-auto max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Evalúa tu idea de negocio sigue tu sueño
      </h1>
      <p className="mt-3 mx-auto max-w-2xl text-slate-600">
        Aret3 te acompaña en cada paso que necesitas para llevar a cabo tu sueño, recibe un
      </p>
      <p className="mx-auto max-w-2xl mt-1 text-slate-600">
        informe claro para decidir. Rápido, simple y visual. potenciado <strong>con el impulso de la IA.</strong>
      </p>

      <div className="mt-6 flex justify-center gap-3">
        <a
          href="https://app.aret3.cl/auth/sign-in?callbackUrl=/"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Comienza tu prueba gratis
        </a>
      </div>
    </section>
  );
}
