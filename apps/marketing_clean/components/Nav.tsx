//apps/marketing_clean/components/Nav.tsx
import React from "react";
import Logo from "./Logo";

const APP = process.env.NEXT_PUBLIC_APP_ORIGIN || "https://app.aret3.cl";

export default function Nav() {
  return (
    <header className="mx-auto max-w-6xl px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        {/* Logo: que no se achique ni empuje el resto */}
        <div className="shrink-0">
          <Logo />
          <a href="https://youtube.com/shorts/jwvs4DB22ug?feature=share" target="_blank" rel="noreferrer"  className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">Tutorial</a>
            <a href={`${APP}/billing`}  className="rounded-lg bg-white-600 px-3 py-1.5 text-sm font-medium text-black hover:opacity-90">Precios</a>

        </div>

        {/* Navegación */}
        <nav className="flex items-center gap-2">
          {/* Links secundarios: ocultos en móvil */}
          <div className="hidden sm:flex items-center gap-4 text-sm">
                        <a
              href={`${APP}/auth/sign-in?callbackUrl=/`}
               className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              Acceder
            </a>
          </div>

          {/* CTA siempre visible (también en móvil) */}
          <a
            href={`${APP}/auth/sign-in?callbackUrl=/`}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Empieza gratis
          </a>
        </nav>
      </div>
    </header>
  );
}
