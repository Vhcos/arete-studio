// apps/marketing/app/layout.tsx
// layout raíz: cero metadata aquí
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
