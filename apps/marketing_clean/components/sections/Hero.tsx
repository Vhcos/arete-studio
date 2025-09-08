// apps/marketing_clean/components/sections/Hero.tsx
const APP = process.env.NEXT_PUBLIC_APP_ORIGIN || "https://app.aret3.cl";

export default function Hero() {
  const box: React.CSSProperties = { maxWidth: 1120, margin: "0 auto", padding: "0 20px" };
  const btn: React.CSSProperties = { padding: "10px 16px", borderRadius: 8, border: "1px solid #111" };

  return (
    <section style={{ padding: "32px 0" }}>
      <div style={box}>
        <h1 style={{ fontSize: 40, margin: 0 }}>Evalúa tu idea de negocio con IA</h1>
        <p style={{ color: "#555", marginTop: 8 }}>
          Completa 5 pasos y recibe un informe claro para decidir. Rápido, simple y visual.
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          {/* CTA principal: va al dominio del app */}
          <a
            href={`${APP}/auth/sign-in?callbackUrl=/`}
            style={{ ...btn, background: "#111", color: "#fff" }}
            rel="noopener"
          >
            Empieza gratis
          </a>

          {/* Secundario: ancla interna */}
          <a href="#producto" style={btn}>Ver cómo funciona</a>
        </div>
      </div>
    </section>
  );
}
