// apps/marketing/app/page.tsx

import CTARegister from "../../components/CTARegister";
import Hero from "../../components/sections/Hero";
import ProductGrid from "../../components/sections/ProductGrid";
import Pricing from "../../components/sections/Pricing";

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
        Valida tu idea en minutos
      </h1>

      <p className="mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
        Inputs simples + IA → informe “investor-friendly” con plan de acción,
        mapa competitivo y checklist regulatorio.
      </p>

      {/* CTA con captura de email (postea a /api/leads y redirige al login) */}
      <div className="mt-8">
        <CTARegister />
      </div>

      <div className="mt-6">
        <a
          href="#como-funciona"
          className="inline-flex items-center rounded-xl px-5 py-3 text-base font-medium ring-1 ring-slate-300 hover:bg-slate-50"
        >
          Ver cómo funciona
        </a>
      </div>

      {/* ancla para la siguiente sección (puedes reemplazar por tu grid de producto) */}
      <section id="como-funciona" className="py-16">
        <h2 className="text-2xl font-semibold">Cómo funciona</h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Completa 5 pasos, guardado automático por sección y revisión final con IA.
        </p>
    </section>
    <Hero />
    <ProductGrid />
    <Pricing />
    </main>
  );
}

