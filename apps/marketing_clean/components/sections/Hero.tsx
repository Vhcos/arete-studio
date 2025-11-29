// apps/marketing_clean/components/sections/Hero.tsx
import React from "react";

export default function Hero() {
  return (
    <section
      id="producto"
      className="mx-auto max-w-6xl px-4 pt-12 pb-10 text-center"
    >
      <p className="text-[11px] font-semibold tracking-wider text-slate-400">
        #1 software de negocios en Chile para evaluar ideas
      </p>

      <h1
        className="
          mt-2
          text-3xl sm:text-4xl md:text-[2.5rem] lg:text-[2.8rem]
          font-bold leading-tight tracking-tight
          text-slate-900
        "
      >
        Evalúa tu idea <span className="text-blue-600">o tu negocio</span>
        <br className="hidden sm:block" />
        en menos de 30 minutos
      </h1>

      {/* Línea IA (más separada del título) */}
       <p className="text-[11px] font-semibold tracking-wider text-slate-400">
        Rápido, simple y visual, potenciado{" "}
        <span className="font-semibold">con el impulso de la IA</span>.
      </p>

      {/* Beneficio emocional + números */}
      <p className="mx-auto mt-4 max-w-2xl text-center text-sm sm:text-base text-slate-700 leading-relaxed">
        Aret3 ordena los números de tu idea o negocio y te ayuda a{" "}
        <span className="font-semibold">
          bajar la ansiedad y aclarar tu propuesta
        </span>
        .
      </p>

      {/* CTA */}
      <div className="mt-6 flex justify-center gap-3">
        <a
          href="https://app.aret3.cl/auth/sign-in?callbackUrl=/"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Comienza tu prueba gratis
        </a>
        <a
          href="#ejemplo"
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Ver ejemplo de informe
        </a>
      </div>

      {/* Frase final con “letra de caricatura” y más aire */}
     <p
  className="
    mx-auto mt-12 max-w-2xl text-center
    text-base sm:text-lg
    leading-relaxed font-bold
  "
  style={{
    fontFamily:
      '"Gloria Hallelujah","Comic Sans MS",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
    color: "#2563eb",
    textShadow: "0.04em 0.04em 0 #1d4ed8", // le da grosor tipo contorno
  }}
>
  ¿Tienes una gran idea, pero no sabes por dónde empezar? En 10 pasos tienes
  un informe claro con la{" "}
  <span className="font-bold">Regla del 8&nbsp;%</span> y un plan de acción
  concreto.
</p>


    </section>
  );
}
