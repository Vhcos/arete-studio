//  components/AppFooter.tsx
import React from "react";
import Link from "next/link";

export default function AppFooter() {
  return (
    <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-500">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <p>© 2025 ARET3. Todos los derechos reservados.</p>
        <nav className="flex flex-wrap gap-6">
          <Link href="/ayuda" className="hover:text-slate-700">Guía de uso</Link>
          <a href="https://app.aret3.cl/privacy" className="hover:text-slate-700">Privacidad</a>
          <a href="https://app.aret3.cl/terms" className="hover:text-slate-700">Términos</a>
        </nav>
      </div>
    </footer>
  );
}
