/** apps/marketing_clean/components/sections/Hero.tsx */
import Link from "next/link";

const APP = process.env.NEXT_PUBLIC_APP_ORIGIN || "https://app.aret3.cl";

export default function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <p className="text-xs font-medium text-slate-500">ARET3</p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900">
        Evalúa tu idea de negocio con IA
      </h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Completa 5 pasos y recibe un informe claro para decidir. Rápido, simple y visual.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={`${APP}/auth/sign-in?callbackUrl=/`}
          className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Empieza gratis
        </Link>
        <Link
          href="/#como-funciona"
          className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Ver cómo funciona
        </Link>
      </div>
    </section>
  );
}
