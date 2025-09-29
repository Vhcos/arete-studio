// app/components/BillingBadge.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";

const MARKETING_URL =
  process.env.NEXT_PUBLIC_MARKETING_URL || "https://aret3.cl";

export default function BillingBadge() {
  const [count, setCount] = useState<number | null>(null);
  const [plan, setPlan] = useState<string | null | undefined>(undefined);
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

  return (
  <div className="flex items-center gap-2">
    <div className="rounded-full bg-slate-100 text-slate-700 text-xs px-3 py-1">
      {plan ? `⭐ PRO · IA: ${count}` : <>IA disponibles: <strong>{count}</strong></>}
    </div>

    {/* CTA: Mejora tu plan */}
    <a
      href="/billing"
      className="text-xs px-2 py-1 rounded border border-red-600 text-blue-700 hover:bg-blue-50"
      title="Mejorar plan"
    >
      Mejora tu plan
    </a>

    <button
      onClick={handleSignOut}
      className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
      title="Cerrar sesión"
    >
      Salir
    </button>
  </div>
);
}
