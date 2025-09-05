// apps/marketing/app/page.tsx
export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
        Valida tu idea en minutos
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-slate-600">
        Inputs simples + IA → informe “investor-friendly” con plan de acción,
        mapa competitivo y checklist regulatorio.
      </p>

      <div className="mt-8 flex gap-3">
        <a
          href="https://app.aret3.cl/auth/sign-in"
          className="inline-flex items-center rounded-xl bg-black px-5 py-3 text-base font-medium text-white hover:bg-black/90"
        >
          Pruébalo gratis
        </a>
        <a
          href="#como-funciona"
          className="inline-flex items-center rounded-xl px-5 py-3 text-base font-medium ring-1 ring-slate-300 hover:bg-slate-50"
        >
          Ver cómo funciona
        </a>
      </div>
    </main>
  );
}
