// app/not-found.tsx
export default function NotFound() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Página no encontrada</h1>
      <p className="mt-2 text-slate-600">
        No pudimos encontrar lo que buscas.
      </p>
      <a
        href="/wizard/step-1"
        className="inline-block mt-6 rounded-lg bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
      >
        Ir al asistente (Paso 1)
      </a>
    </main>
  );
}
