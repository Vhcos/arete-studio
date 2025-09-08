// apps/marketing_clean/components/Nav.tsx
import Link from "next/link";

export default function Nav() {
  return (
    <header style={{ borderBottom: "1px solid #eee" }}>
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Link href="/" style={{ fontWeight: 600 }}>Areté</Link>

        <nav style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
          <a href="#producto">Producto</a>
          <a href="#precios">Precios</a>
          <Link href="/recursos/centro-de-ayuda">Recursos</Link>

          {/* Acceder (mismo flujo, vuelve a / después de login) */}
          <Link
            href={{ pathname: "/auth/sign-in", query: { callbackUrl: "/" } }}
            style={{ padding: "8px 12px", border: "1px solid #111", borderRadius: 8 }}
          >
            Acceder
          </Link>

          {/* CTA principal */}
          <Link
            href={{ pathname: "/auth/sign-in", query: { callbackUrl: "/" } }}
            style={{ padding: "8px 12px", borderRadius: 8, background: "#111", color: "#fff" }}
          >
            Empieza gratis
          </Link>
        </nav>
      </div>
    </header>
  );
}
