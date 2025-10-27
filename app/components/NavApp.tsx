//  app/components/NavApp.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BillingBadge from "./BillingBadge";

export default function NavApp() {
  const pathname = usePathname();

  const base =
    "px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap";
  const active = "border border-sky-300 bg-sky-50 text-sky-800 shadow-sm";
  const idle = "text-slate-600 hover:text-slate-900 hover:bg-slate-100";

  const isInforme = pathname === "/informe";
  const isStep1 = pathname?.startsWith("/wizard/step-1");

  return (
    <div className="flex items-center justify-between gap-3 w-full">
      <nav className="flex flex-wrap items-center gap-3 text-sm">
        <Link
          href="/informe"
          className={`${base} ${isInforme ? "bg-slate-900 text-white" : idle}`}
        >
          Informe
        </Link>

        {/* Paso 1 con borde azul claro + sombra */}
        <Link
          href="/wizard/step-1"
          className={`${base} ${isStep1 ? active : idle}`}
        >
          Paso 1
        </Link>
      </nav>

      <BillingBadge />
    </div>
  );
}
