import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Areté Marketing",
  description: "Valida tu idea en minutos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-black antialiased">
        {children}
      </body>
    </html>
  );
}
