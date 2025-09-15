import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import  Logo  from "@/components/Logo";
import NavApp from "./components/NavApp"; // <- importa así (relativo)





const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ARET3 — Evalúa tu idea de negocio con IA",
  description: "Rápido, simple y visual.",
  icons: { icon: "/favicon.ico" },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-slate-900">
        <header className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Logo />
          <NavApp />
        </header>
        <main className="mx-auto max-w-6xl px-4">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-500">
          © {new Date().getFullYear()} ARET3. Todos los derechos reservados.
        </footer>
      </body>
    </html>
  );
}