// apps/marketing_clean/components/Footer.tsx
import Link from "next/link";

const wrap: React.CSSProperties = {
  maxWidth: 1120, margin: "0 auto", padding: "20px",
  display: "flex", alignItems: "center", justifyContent: "space-between",
};

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid #eee", marginTop: 20 }}>
      <div style={wrap}>
        <small>© {new Date().getFullYear()} Aret3</small>
        <nav style={{ display: "flex", gap: 16 }}>
          <Link href="/recursos/centro-de-ayuda">Centro de ayuda</Link>
          <Link href="/recursos/asesorias">Asesorías</Link>
        </nav>
      </div>
    </footer>
  );
}
