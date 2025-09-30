"use client";

import { useEffect, useState } from "react";

export default function BillingSuccess() {
  const [sessionCredits, setSessionCredits] = useState<number>(0);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/billing/me", { cache: "no-store" });
        const j = await r.json();
        setSessionCredits(Number(j?.sessionCredits ?? 0));
      } catch {
        setSessionCredits(0);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">¡Listo! Pago procesado ✅</h1>
      <p className="mt-2 text-gray-600">
        Si tu pago fue aprobado, tus créditos ya fueron asignados a tu cuenta.
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <a
          href="/"
          className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
        >
          Volver a ARETE
        </a>

        {sessionCredits > 0 && (
          <a
            href="/advisory"
            className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Agenda tu asesoría
          </a>
        )}
      </div>
    </div>
  );
}
