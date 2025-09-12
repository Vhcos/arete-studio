import React from "react";

export default function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-500">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <p>© 2025 ARET3. Todos los derechos reservados.</p>
        <nav className="flex gap-6">
          <a href="/recursos/centro-de-ayuda" className="hover:text-slate-700">Centro de ayuda</a>
          <a href="/recursos/asesorias" className="hover:text-slate-700">Asesorías</a>
        </nav>
      </div>
    </footer>
  );
}
