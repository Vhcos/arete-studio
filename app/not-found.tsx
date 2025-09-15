// app/not-found.tsx  (Server Component, sin hooks)
import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl p-8 text-center">
      <h1 className="text-2xl font-semibold">Página no encontrada</h1>
      <p className="mt-2 text-slate-600">No pudimos encontrar lo que buscabas.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/tablero" className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
          Ir al Tablero
        </Link>
        <Link href="/formulario" className="rounded-md border px-4 py-2 hover:bg-slate-50">
          Ir al Formulario
        </Link>
      </div>
    </section>
  );
}

