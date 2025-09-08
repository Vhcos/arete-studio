// apps/marketing_clean/components/sections/Hero.tsx
import Link from "next/link";

const wrap: React.CSSProperties = { maxWidth: 1120, margin: "0 auto", padding: "32px 20px" };
const btn: React.CSSProperties = { padding: "12px 18px", borderRadius: 12, border: "1px solid #111", display: "inline-block" };

export default function Hero() {
  return (
    <section style={wrap}>
      <h1 style={{ fontSize: 40, lineHeight: 1.1, margin: "0 0 12px" }}>
        Evalúa tu idea de negocio con IA
      </h1>
      <p style={{ color: "#555", margin: "0 0 18px" }}>
        Completa 5 pasos y recibe un informe claro para decidir. Rápido, simple y visual.
      </p>

      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/auth/sign-in" style={{ ...btn, background: "#111", color: "#fff" }}>Empieza gratis</Link>
        <a href="#producto" style={btn}>Ver cómo funciona</a>
      </div>
    </section>
  );
}
