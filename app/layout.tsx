import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Logo from "../components/Logo";
import NavApp from "./components/NavApp";
import { Suspense } from "react";
import Script from "next/script";
import CreditsRefreshHook from "./components/CreditsRefreshHook";
import Providers from "./providers";
import Link from "next/link";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ARET3 — Evalúa tu idea de negocio con IA",
  description: "Rápido, simple y visual.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Google Tag Manager (HEAD) */}
        <Script id="gtm-base" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-WN7QD875');
          `}
        </Script>
      </head>

      <body className="min-h-screen bg-white text-slate-900">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WN7QD875"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <Providers>
          {/* Header */}
          <header className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <Logo />
            <Suspense fallback={<div className="h-9 w-40" />}>
              <NavApp />
            </Suspense>
          </header>

          {/* Main */}
          <main className="mx-auto max-w-6xl px-4">
            <Suspense fallback={<div className="py-10 text-sm text-slate-500">Cargando…</div>}>
              {children}
            </Suspense>
          </main>

          {/* Footer (marketing_clean + Guía de uso) */}
          <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-500">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
              <p>© {new Date().getFullYear()} ARET3. Todos los derechos reservados.</p>
              <nav className="flex flex-wrap gap-6">
                <Link href="/ayuda" className="hover:text-slate-700">
                  Guía de uso
                </Link>
                <a href="https://app.aret3.cl/privacy" className="hover:text-slate-700" target="_blank" rel="noopener noreferrer">
                  Privacidad
                </a>
                <a href="https://app.aret3.cl/terms" className="hover:text-slate-700" target="_blank" rel="noopener noreferrer">
                  Términos
                </a>
              </nav>
            </div>
          </footer>

          <CreditsRefreshHook />
        </Providers>
      </body>
    </html>
  );
}
