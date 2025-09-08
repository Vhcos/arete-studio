// apps/marketing_clean/components/sections/Hero.tsx
import Link from "next/link";

export default function Hero() {
  const box: React.CSSProperties = { maxWidth: 1120, margin: "0 auto", padding: "28px 20px" };

  return (
    <section id="hero" style={{ borderBottom: "1px solid #eee" }}>
      <div style={box}>
        <h1 style={{ fontSize: 40, margin: 0 }}>Evalúa tu idea de negocio con IA</h1>
        <p style={{ color: "#555", marginTop: 8 }}>
          Completa 5 pasos y recibe un informe claro para decidir. Rápido, simple y visual.
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          {/* Empieza gratis -> pasa callbackUrl=/app */}
          <Link
            href={{ pathname: "/auth/sign-in", query: { callbackUrl: "/app" } }}
            style={{ padding: "10px 16px", borderRadius: 8, background: "#111", color: "#fff" }}
          >
            Empieza gratis
          </Link>

          <a href="#producto" style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #111" }}>
            Ver cómo funciona
          </a>
        </div>
      </div>
    </section>
  );
}
