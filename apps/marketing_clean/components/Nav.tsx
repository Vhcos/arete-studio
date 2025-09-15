import React from "react";
import Logo from "./Logo";

const APP = process.env.NEXT_PUBLIC_APP_ORIGIN || "https://app.aret3.cl";

export default function Nav() {
  return (
    <header className="mx-auto max-w-6xl px-4 py-4">
      <div className="flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-4 text-sm">
          <a href="#producto" className="text-slate-700 hover:text-slate-900">Producto</a>
          <a href="#precios" className="text-slate-700 hover:text-slate-900">Precios</a>
          <a
            href={`${APP}/auth/sign-in?callbackUrl=/`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
          >
            Acceder
          </a>
          <a
            href={`${APP}/auth/sign-in?callbackUrl=/`}
            className="rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white hover:opacity-90"
          >
            Empieza gratis
          </a>
        </nav>
      </div>
    </header>
  );
}
