"use client";

import Link from "next/link";
import { Button } from "@arete-studio/ui";

const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE_URL!; // ej: https://app.aret3.cl

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo simple por ahora (texto) */}
        <Link href="/" className="text-base font-semibold tracking-tight">
          Areté
        </Link>

        <nav className="hidden gap-6 md:flex">
          <a href="#producto" className="text-sm text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">
            Producto
          </a>
          <a href="#precios" className="text-sm text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">
            Precios
          </a>
          <Link
            href="/recursos/centro-de-ayuda"
            className="text-sm text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          >
            Centro de ayuda
          </Link>
          <Link
            href="/recursos/asesorias"
            className="text-sm text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          >
            Asesorías
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href={`${APP_BASE}/auth/sign-in`} className="text-sm text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">
            Acceso
          </Link>
          <Link href="#cta">
            <Button size="sm">Pruébalo gratis</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
