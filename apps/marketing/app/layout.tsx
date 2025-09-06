// apps/marketing/app/layout.tsx
import "./globals.css";

// FORZAR DINÁMICO EN TODO EL ÁRBOL DE MARKETING
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
