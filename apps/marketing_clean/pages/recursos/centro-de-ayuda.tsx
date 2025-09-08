// apps/marketing_clean/pages/recursos/centro-de-ayuda.tsx
import Link from "next/link";

export default function CentroDeAyuda() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <h1>Centro de ayuda</h1>
      <p>Artículos y preguntas frecuentes (placeholder).</p>
      <p><Link href="/">← Volver</Link></p>
    </main>
  );
}

