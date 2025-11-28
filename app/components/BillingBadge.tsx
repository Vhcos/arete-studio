// app/components/BillingBadge.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

const MARKETING_URL =
  process.env.NEXT_PUBLIC_MARKETING_URL || "https://aret3.cl";

export default function BillingBadge() {
  const [count, setCount] = useState<number | null>(null);
  const [plan, setPlan] = useState<string | null | undefined>(undefined);
  const [showUpsell, setShowUpsell] = useState(false);
  const pathname = usePathname();
  const search = useSearchParams();

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/billing/me", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) {
        setCount(j.creditsRemaining as number);
        setPlan(j.plan ?? undefined);
      }
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    const onFocus = () => load();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    load();
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [load, pathname, search?.toString()]);

  if (count === null) return null;

  const handleSignOut = async () => {
    try {
      // Evita la redirección de NextAuth (que te manda a app.aret3.cl)
      await signOut({ redirect: false });
    } finally {
      // Y redirige manualmente al sitio público
      window.location.replace(MARKETING_URL);
    }
  };

  const goAdvisory = async () => {
    try {
      const r = await fetch("/api/billing/me", { cache: "no-store" });
      const j = await r.json();
      const sc = Number(j?.sessionCredits ?? 0);
      if (j?.ok && sc > 0) {
        window.location.href = "/advisory";
      } else {
        setShowUpsell(true); // <- muestra popup en vez de redirigir directo
      }
    } catch {
      setShowUpsell(true);
    }
  };
  
    return (
    <>
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-slate-100 text-slate-900 text-xs px-3 py-1">
          {plan ? `⭐ Créditos·IA: ${count}` : <>IA disponibles: <strong>{count}</strong></>}
        </div>

        
       {/* Caluga compacta hacia billing */}
        <Link
          href="/billing"
          className="inline-flex items-center rounded-xl border border-red-600 text-blue-700 px-3 py-1.5 text-xs sm:text-sm font-semibold hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 whitespace-nowrap"
        >
          <span className="sm:hidden">Mejora tu plan</span>
          <span className="hidden sm:inline">
            Revisa nuestros planes y asesorías 1:1
          </span>
        </Link>

        <button
          onClick={handleSignOut}
          className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
          title="Cerrar sesión"
        >
          Salir
        </button>
      </div>

      {/* Popup Upsell (simple, sin dependencias) */}
      {showUpsell && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-900">Asesoría 30 min</h3>
            <p className="mt-2 text-sm text-slate-600">
              Aún no tienes asesorías disponibles. Contrata para habilitar la agenda.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowUpsell(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Ahora no
              </button>
              <a
                href="/billing?upsell=advisory"
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Contratar asesoría
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
