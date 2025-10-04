// apps/marketing_clean/app/layout.tsx
import "../styles/globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Nav from "../components/Nav";
import Script from "next/script";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ARET3 — Valida tu idea en minutos",
  description: "Completa 5 pasos y recibe un informe claro para decidir. Rápido, simple y visual.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Google Tag Manager */}
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
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        {/* noscript recomendado */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WN7QD875"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <header className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <Nav />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4">{children}</main>

        <footer className="border-t">
          <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-500">
            © {new Date().getFullYear()} ARET3. Todos los derechos reservados.
          </div>
        </footer>
      </body>
    </html>
  );
}

