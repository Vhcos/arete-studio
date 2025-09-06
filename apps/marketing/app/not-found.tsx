/* eslint-disable @next/next/no-html-link-for-pages */
// apps/marketing/app/not-found.tsx

export default function NotFound() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
      <h1 className="text-3xl font-semibold">Página no encontrada</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        La página que buscas no existe.
      </p>

      {/* Usamos <a> simple para evitar que next/link meta un elemento complejo en prerender */}
      <a
        href="/"
        className="mt-6 inline-flex items-center rounded-xl px-5 py-3 ring-1 ring-slate-300 hover:bg-slate-50"
      >
        Volver al inicio
      </a>
    </main>
  );
}
