//app/advisory/page.tsx
"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export default function AdvisoryPage() {
  const [sessionCredits, setSessionCredits] = useState<number | null>(null);

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

    // ↓↓↓ NUEVO: escucha el evento del embed de Calendly y confirma en backend ↓↓↓
  useEffect(() => {
    async function onMsg(e: MessageEvent) {
      if (!e?.data || typeof e.data !== "object") return;
      if (e.data.event !== "calendly.event_scheduled") return;

      const inviteeUri = e?.data?.payload?.invitee?.uri || "";
      const eventUri   = e?.data?.payload?.event?.uri   || "";
      if (!inviteeUri) return;

      try {
        const r = await fetch("/api/calendly/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inviteeUri, eventUri }),
        });
        const j = await r.json();

        // si el backend devuelve el saldo, refrescamos el badge localmente
        if (j?.ok && typeof j?.sessionCredits === "number") {
          setSessionCredits(j.sessionCredits);
        } else {
          // fallback: re-consulta /api/billing/me
          const rr = await fetch("/api/billing/me", { cache: "no-store" });
          const jj = await rr.json();
          setSessionCredits(Number(jj?.sessionCredits ?? 0));
        }
      } catch (err) {
        console.error("[/advisory] calendly confirm error:", err);
      }
    }

    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);
  // ↑↑↑ FIN NUEVO


  // Calendly embed URL (tu evento 30min)
  const calendly = "https://calendly.com/arete-studio/30min?hide_gdpr_banner=1&embed_domain=localhost&embed_type=Inline";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="afterInteractive" />
      <h1 className="text-2xl font-bold text-slate-900">Agenda tu asesoría 1:1</h1>
      <p className="mt-2 text-slate-600">
        Reunión de 30 minutos para revisar tu idea, explicar el informe ARETE y definir próximos pasos.
      </p>

      {sessionCredits === null ? (
        <div className="mt-6 text-slate-600">Cargando…</div>
      ) : sessionCredits > 0 ? (
        <div className="mt-6">
          <div className="mb-3 text-sm text-slate-700">
            Saldo de asesorías: <strong>{sessionCredits}</strong>
          </div>
          <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <iframe
              title="Calendly - Asesoría 30 min"
              src={calendly}
              className="h-full w-full"
              frameBorder="0"
            />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Al agendar, recibirás la confirmación por email con el enlace de la reunión.
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            Aún no tienes asesorías disponibles. Contrata para habilitar tu agenda.
          </p>
          <a
            href="/billing?upsell=advisory"
            className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Comprar asesoría $30.000 (usd$30)
          </a>
        </div>
      )}
    </div>
  );
}
