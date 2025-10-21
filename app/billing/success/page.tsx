// app/billing/success/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function BillingSuccess() {
  const [sessionCredits, setSessionCredits] = useState<number>(0);
  const sp = useSearchParams();
  const status = (sp?.get("status") ?? "approved") as "approved" | "rejected" | "cancelled";

  // Solo consultamos créditos cuando realmente hubo aprobación
  useEffect(() => {
    if (status !== "approved") return;
    (async () => {
      try {
        const r = await fetch("/api/billing/me", { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        setSessionCredits(Number(j?.sessionCredits ?? 0));
      } catch {
        /* ignore */
      }
    })();
  }, [status]);

  const title =
    status === "approved"
      ? "¡Listo! Pago procesado ✅"
      : status === "rejected"
      ? "Pago rechazado ❌"
      : "Pago cancelado 🟡";

  const subtitle =
    status === "approved"
      ? "Si tu pago fue aprobado, tus créditos ya fueron asignados a tu cuenta."
      : status === "rejected"
      ? "Tu banco o el emisor rechazó esta transacción. Intenta nuevamente o usa otro medio de pago."
      : "Cancelaste el pago en Webpay. No se realizaron cargos.";

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-gray-600">{subtitle}</p>

      <div className="mt-6 flex items-center justify-center gap-3">
        {/* 👇 botón a Informe, como pediste */}
        <a
          href="/informe"
          className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
        >
          Ir al Informe
        </a>

        {/* CTA de asesoría solo si hubo aprobación y hay saldo */}
        {status === "approved" && sessionCredits > 0 && (
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
