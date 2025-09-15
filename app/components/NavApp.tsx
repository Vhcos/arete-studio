"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

function isActiveTab(
  pathname: string | null,
  tabParam: string | null,
  target: "board" | "explain" | "form"
) {
  if (pathname === "/tablero" && target === "board") return true;
  if (pathname === "/informe" && target === "explain") return true;
  if (pathname === "/formulario" && target === "form") return true;
  if (pathname === "/") return (tabParam ?? "form") === target;
  return false;
}

export default function NavApp() {
  const pathname = usePathname();              // string | null
  const search = useSearchParams();            // ... | null (según versión)
  const tabParam = search?.get("tab") ?? null; // string | null

  const baseItem =
    "px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap";
  const active = "bg-slate-900 text-white";
  const idle   = "text-slate-600 hover:text-slate-900 hover:bg-slate-100";

  return (
    <nav className="flex items-center gap-2">
      {/* Tabs principales */}
      <Link
        href="/tablero"
        className={`${baseItem} ${isActiveTab(pathname, tabParam, "board") ? active : idle}`}
      >
        Tablero
      </Link>
      <Link
        href="/informe"
        className={`${baseItem} ${isActiveTab(pathname, tabParam, "explain") ? active : idle}`}
      >
        Informe
      </Link>
      <Link
        href="/formulario"
        className={`${baseItem} ${isActiveTab(pathname, tabParam, "form") ? active : idle}`}
      >
        Formulario
      </Link>

      {/* Guía de uso – siempre visible (después de Formulario) */}
      <Link
        href="/ayuda"
        className="ml-2 inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Guía de uso"
      >
        Guía de uso
      </Link>
    </nav>
  );
}
