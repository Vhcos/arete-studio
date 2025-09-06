// apps/marketing/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Areté — Valida tu idea en minutos",
  description:
    "Inputs simples + IA + informe friendly para inversores, con plan de acción, mapa competitivo y checklist regulatorio.",
  metadataBase: new URL("https://www.aret3.cl"),
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}