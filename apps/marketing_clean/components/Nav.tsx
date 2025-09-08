// apps/marketing_clean/components/Nav.tsx
import Link from "next/link";

const wrap: React.CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
  padding: "12px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const nav: React.CSSProperties = { display: "flex", gap: 16, alignItems: "center" };
const btn: React.CSSProperties = {
  padding: "8px 14px", borderRadius: 10, border: "1px solid #111", textDecoration: "none",
};

export default function Nav() {
  return (
    <header style={{ borderBottom: "1px solid #eee", position: "sticky", top: 0, background: "#fff", zIndex: 20 }}>
      <div style={wrap}>
        <Link href="/" style={{ fontWeight: 700, fontSize: 18, textDecoration: "none", color: "#111" }}>
          Areté
        </Link>
        <nav style={nav}>
          <a href="#producto">Producto</a>
          <a href="#precios">Precios</a>
          <Link href="/recursos/centro-de-ayuda">Recursos</Link>
          <Link href="/auth/sign-in" style={btn}>Acceder</Link>
          <Link href="/app" style={{ ...btn, background: "#111", color: "#fff" }}>Usar Areté</Link>
        </nav>
      </div>
    </header>
  );
}
