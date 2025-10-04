//app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Logo from "../components/Logo";
import NavApp from "./components/NavApp"; // <- importa así (relativo)
import { Suspense } from "react";
import Script from "next/script";
import CreditsRefreshHook from "./components/CreditsRefreshHook";





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
          <Suspense fallback={<div className="h-9 w-40" />}>
            <NavApp />
          </Suspense>
          <Script id="gtm-base" strategy="afterInteractive">
          {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-WN7QD875');
          `}
        </Script>
        </header>

        <main className="mx-auto max-w-6xl px-4">
          {/* 👇 Suspense global que cubre /, /bienvenido, /wizard/*, etc. */}
          <Suspense fallback={<div className="py-10 text-sm text-slate-500">Cargando…</div>}>
            {children}
          </Suspense>
        </main>

         

        <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-500">
          © {new Date().getFullYear()} ARET3. Todos los derechos reservados.
        </footer>
          <CreditsRefreshHook />
      </body>
    </html>
  );
}