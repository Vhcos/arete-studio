// components/FooterApp.tsx
"use client";

import Link from "next/link";
import SocialLinks from "@/components/common/SocialLinks";

export default function FooterApp() {
  return (
    <footer className="mt-12 border-t bg-white">
      <div className="mx-auto max-w-screen-lg px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Navegación legal / guía */}
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
            <Link
              href="/guia"
              className="rounded-md px-1 py-0.5 hover:text-slate-900 hover:underline focus:outline-none focus:ring"
            >
              Guía de uso
            </Link>
            <Link
              href="/privacidad"
              className="rounded-md px-1 py-0.5 hover:text-slate-900 hover:underline focus:outline-none focus:ring"
            >
              Privacidad
            </Link>
            <Link
              href="/terminos"
              className="rounded-md px-1 py-0.5 hover:text-slate-900 hover:underline focus:outline-none focus:ring"
            >
              Términos
            </Link>
          </nav>

          {/* Redes */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Síguenos</span>
            <SocialLinks />
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Aret3 — Hecho con cariño para emprendedores.
        </p>
      </div>
    </footer>
  );
}
