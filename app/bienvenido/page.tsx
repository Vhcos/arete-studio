import { Suspense } from "react";
import BienvenidoClient from "./BienvenidoClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-[70vh] place-items-center px-6 py-14">
          <div className="text-center">
            <div className="mx-auto mb-6 h-24 w-24 animate-pulse rounded-full bg-slate-200" />
            <p className="text-slate-600">Cargando…</p>
          </div>
        </main>
      }
    >
      <BienvenidoClient />
    </Suspense>
  );
}
