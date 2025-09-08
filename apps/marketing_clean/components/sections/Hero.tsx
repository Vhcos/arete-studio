// apps/marketing_clean/components/sections/Hero.tsx
import Link from "next/link";

export default function Hero() {
  return (
    <section style={{ padding: "32px 0" }}>
      <h1 style={{ fontSize: 40, margin: 0 }}>Evalúa tu idea de negocio con IA</h1>
      <p style={{ color: "#555" }}>Completa 5 pasos y recibe un informe claro para decidir.</p>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <Link
          href={{ pathname: "/auth/sign-in", query: { callbackUrl: "/" } }}
          style={{ padding: "10px 16px", borderRadius: 8, background: "#111", color: "#fff" }}
        >
          Empieza gratis
        </Link>
        <a href="#producto" style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #111" }}>
          Ver cómo funciona
        </a>
      </div>
    </section>
  );
}
