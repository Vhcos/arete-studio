// apps/marketing_clean/components/Nav.tsx
import React, { useEffect } from "react";
import Logo from "./Logo";
import { gtmPush } from "../lib/gtm";

const APP = process.env.NEXT_PUBLIC_APP_ORIGIN || "https://app.aret3.cl";

export default function Nav() {
  useEffect(() => {
  gtmPush("view_content", { page_type: "landing", path: window.location.pathname });
}, []);

  return (
    <header className="mx-auto max-w-6xl px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="shrink-0">
          <Logo />
          <a
            href="https://www.youtube-nocookie.com/embed/MF9b8ChhaXA"
            target="_blank"
            rel="noreferrer"
            onClick={() => gtmPush("start_test", { source: "nav_tutorial" })}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Tutorial
          </a>

          <a
            href={`${APP}/billing`}
            onClick={() => gtmPush("start_test", { source: "nav_prices" })}
            className="rounded-lg bg-white-600 px-3 py-1.5 text-sm font-medium text-black hover:opacity-90"
          >
            Precios
          </a>
        </div>

        <nav className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-4 text-sm">
            <a
              href={`${APP}/auth/sign-in?callbackUrl=/`}
              onClick={() => gtmPush("start_test", { source: "nav_login" })}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              Acceder
            </a>
          </div>

          <a
            href={`${APP}/auth/sign-in?callbackUrl=/`}
            onClick={() => gtmPush("start_test", { source: "nav_cta" })}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Empieza gratis
          </a>
        </nav>
      </div>
    </header>
  );
}
