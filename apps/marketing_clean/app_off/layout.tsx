import "../styles/globals.css";
import type { Metadata } from "next";
import Logo from "../components/Logo";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "ARET3 — Evalúa tu idea de negocio con IA",
  description: "Completa 5 pasos y recibe un informe claro para decidir. Rápido, simple y visual.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased text-slate-900">
        <header className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Logo />
          {/* Si quieres nav aquí, puedes importar y poner <Nav /> */}
        </header>

        <main className="mx-auto max-w-6xl px-4">{children}</main>

        <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-500">
          © {new Date().getFullYear()} ARET3. Todos los derechos reservados.
        </footer>
      </body>
    </html>
  );
}
