// apps/marketing/app/layout.tsx
import "./globals.css";

export const dynamic = "force-dynamic"; // ⬅️ clave: evita SSG del 404

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
