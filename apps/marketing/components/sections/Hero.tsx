// apps/marketing/components/sections/Hero.tsx
import CTARegister from "../CTARegister";

export default function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-10 pt-12">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <h1 className="text-3xl font-bold leading-tight md:text-4xl">
            Valida tu idea en minutos.
          </h1>
          <p className="mt-3 max-w-prose text-zinc-600 dark:text-zinc-400">
            Ingresa tu idea, responde 5 pasos y recibe un informe claro, visual y listo para compartir.
          </p>
          <div id="cta" className="mt-6">
            <CTARegister />
          </div>
          <p className="mt-2 text-xs text-zinc-500">Sin tarjetas. Solo tu correo para enviarte el acceso.</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 p-6 shadow-sm dark:border-zinc-800">
          {/* placeholder sencillo: captura de pantalla futura / gráfico */}
          <div className="aspect-[16/10] w-full rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-zinc-900 dark:to-zinc-800" />
          <p className="mt-3 text-sm text-zinc-500">Vista previa del informe</p>
        </div>
      </div>
    </section>
  );
}
