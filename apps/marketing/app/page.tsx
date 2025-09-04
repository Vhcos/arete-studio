// apps/marketing/app/page.tsx
export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-24">
      <h1 className="text-5xl font-extrabold tracking-tight">
        Valida tu idea en minutos
      </h1>

      <p className="mt-4 text-xl text-gray-600">
        Inputs simples + Inteligencia Artificial → informe “inversor-friendly” con plan de acción, mapa competitivo y checklist regulatorio.
      </p>

      <div className="mt-10 flex gap-4">
        <a
          href="https://app.aret3.cl/auth/sign-in"
          className="rounded bg-black px-6 py-3 text-white"
        >
          Pruébalo gratis
        </a>
        <a href="#como-funciona" className="rounded border px-6 py-3">
          Ver cómo funciona
        </a>
      </div>

      {/* TODO: secciones de features, screenshots, pricing, FAQs, testimonios */}
    </main>
  );
}
