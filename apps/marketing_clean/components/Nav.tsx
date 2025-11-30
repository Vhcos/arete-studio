// apps/marketing_clean/components/Nav.tsx
"use client";

import React, { useEffect } from "react";
import Logo from "./Logo";
import { gtmPush } from "../lib/gtm";

const APP = process.env.NEXT_PUBLIC_APP_ORIGIN || "https://app.aret3.cl";

export default function Nav() {
  useEffect(() => {
    try {
      gtmPush("view_content", {
        page_type: "landing",
        path: window.location.pathname,
      });
    } catch {
      // silencioso
    }
  }, []);

  return (
    <header className="mx-auto max-w-6xl px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* IZQUIERDA: logo + menú principal */}
        <div className="flex flex-wrap items-center gap-4">
          <a
            href="/"
            aria-label="Aret3 (inicio)"
            className="inline-flex items-center"
          >
            <Logo />
          </a>

          {/* Menú principal */}
          <nav className="hidden text-sm font-medium text-slate-700 sm:flex sm:items-center sm:gap-4">
            <a
              href="/"
              className="rounded-full px-2 py-1 hover:bg-slate-100"
            >
              Inicio
            </a>
            <a
              href="/producto"
              onClick={() =>
                gtmPush("click_nav", { link: "producto", source: "nav_main" })
              }
              className="rounded-full px-2 py-1 hover:bg-slate-100"
            >
              Producto
            </a>
            <a
              href="/instituciones"
              onClick={() =>
                gtmPush("click_nav", {
                  link: "instituciones",
                  source: "nav_main",
                })
              }
              className="rounded-full px-2 py-1 hover:bg-slate-100"
            >
              Instituciones
            </a>
            <a
              href={`${APP}/billing`}
              onClick={() => gtmPush("start_test", { source: "nav_prices" })}
              className="rounded-full px-2 py-1 hover:bg-slate-100"
            >
              Precios
            </a>
            <a
              href="/noticias"
              onClick={() =>
                gtmPush("click_nav", { link: "noticias", source: "nav_main" })
              }
              className="rounded-full px-2 py-1 hover:bg-slate-100"
            >
              Noticias
            </a>
            <a
              href="mailto:vhc@aret3.cl?subject=Contacto%20Aret3"
              onClick={() =>
                gtmPush("click_nav", { link: "contacto", source: "nav_main" })
              }
              className="rounded-full px-2 py-1 hover:bg-slate-100"
            >
              Contacto
            </a>
          </nav>
        </div>

        {/* DERECHA: botones rápidos */}
        <div className="flex items-center gap-2">
          {/* Tutorial */}
          <a
            href="https://youtu.be/czo1ekVG5hY"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => gtmPush("start_test", { source: "nav_tutorial" })}
            className={`
              hidden sm:inline-flex items-center gap-1.5
              rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700
              px-3.5 py-1.5 text-xs font-medium text-white shadow-sm
              transition-all duration-200
              hover:from-emerald-400 hover:to-emerald-700
              active:scale-[0.98]
            `}
          >
            <span className="text-[13px]">▶</span>
            <span>Tutorial</span>
          </a>

          {/* CTA principal: Empieza gratis */}
          <a
            href={`${APP}/auth/sign-in?callbackUrl=/`}
            onClick={() => gtmPush("start_test", { source: "nav_cta" })}
            className={`
              inline-flex items-center gap-1.5
              rounded-full bg-gradient-to-r from-sky-600 via-indigo-600 to-slate-900
              px-4 py-1.75 text-xs font-semibold text-white shadow-md
              transition-all duration-200
              hover:from-sky-500 hover:via-indigo-500 hover:to-slate-800
              active:scale-[0.98]
            `}
          >
            <span className="text-[13px]">🚀</span>
            <span>Empieza gratis</span>
          </a>
        </div>
      </div>

      {/* Menú compacto para móvil (solo enlaces principales) */}
      <nav className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-700 sm:hidden">
        <a href="/" className="rounded-full bg-slate-50 px-3 py-1">
          Inicio
        </a>
        <a href="/producto" className="rounded-full bg-slate-50 px-3 py-1">
          Producto
        </a>
        <a href="/instituciones" className="rounded-full bg-slate-50 px-3 py-1">
          Instituciones
        </a>
        <a
          href={`${APP}/billing`}
          className="rounded-full bg-slate-50 px-3 py-1"
        >
          Precios
        </a>
        <a href="/noticias" className="rounded-full bg-slate-50 px-3 py-1">
          Noticias
        </a>
        <a
          href="mailto:vhc@aret3.cl?subject=Contacto%20Aret3"
          className="rounded-full bg-slate-50 px-3 py-1"
        >
          Contacto
        </a>
      </nav>
    </header>
  );
}
