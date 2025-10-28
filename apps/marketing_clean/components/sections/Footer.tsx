// apps/marketing_clean/components/sections/Footer.tsx
import React from "react";
import SocialLinks from "../common/SocialLinks";

const APP = process.env.NEXT_PUBLIC_APP_ORIGIN || "https://app.aret3.cl";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200/70 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Fila principal: links izq / redes der */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Nav izquierdo (igual que en la app) */}
          <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-slate-700">
            <a
              href={`${APP}/ayuda`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900"
            >
              Guía de uso
            </a>
            <a
              href={`${APP}/privacy`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900"
            >
              Privacidad
            </a>
            <a
              href={`${APP}/terms`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900"
            >
              Términos
            </a>
          </nav>

          {/* Redes a la derecha */}
          <div className="flex items-center gap-4">
            <span className="text-slate-500">Síguenos</span>
            <SocialLinks />
          </div>
        </div>

        {/* Leyenda centrada (igual que en la app) */}
        <p className="mt-6 text-center text-sm text-slate-500">
          © {year} Aret3 — Hecho con cariño para emprendedores.
        </p>
      </div>
    </footer>
  );
}
