// apps/marketing_clean/pages/404.tsx
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1>Página no encontrada</h1>
      <p>Lo sentimos, esta ruta no existe.</p>
      <p>
        <Link href="/">Volver al inicio</Link>
      </p>
    </main>
  );
}
