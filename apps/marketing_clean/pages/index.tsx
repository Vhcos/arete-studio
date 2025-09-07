import { FormEvent, useState } from "react";
import Link from "next/link";
import Nav from "../components/Nav";
import Hero from "../components/sections/Hero";
import Footer from "../components/Footer";

export default function Home() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          source: "marketing_clean",
          utm_source: "landing",
        }),
      });
      if (res.ok) {
        setStatus("ok");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const box: React.CSSProperties = { maxWidth: 960, margin: "0 auto", padding: "24px" };
  const btn: React.CSSProperties = { padding: "10px 16px", borderRadius: 8, border: "1px solid #111", cursor: "pointer" };

  return (
    <>
      <Nav />

      <main style={box}>
        <Hero />

        <section id="producto" style={{ padding: "24px 0", borderTop: "1px solid #eee" }}>
          <h2>¿Cómo funciona?</h2>
          <ol>
            <li>Describe tu idea</li>
            <li>Completa 5 pasos</li>
            <li>Obtén tu informe</li>
          </ol>
        </section>

        <section id="precios" style={{ padding: "24px 0", borderTop: "1px solid #eee" }}>
          <h2>Precios</h2>
          <p>Comienza gratis. Pro desde US$8/mes (placeholder).</p>
        </section>

        <section id="recursos" style={{ padding: "24px 0", borderTop: "1px solid #eee" }}>
          <h2>Recursos</h2>
          <ul>
            <li><Link href="/recursos/centro-de-ayuda">Centro de ayuda</Link></li>
            <li><Link href="/recursos/asesorias">Asesorías</Link></li>
          </ul>
        </section>

        <section style={{ padding: "24px 0", borderTop: "1px solid #eee" }}>
          <h2>Recibe novedades</h2>
          <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc" }}
            />
            <button disabled={status === "loading"} style={btn}>
              {status === "loading" ? "Enviando…" : "Quiero probar"}
            </button>
          </form>
          <div aria-live="polite" style={{ minHeight: 22, marginTop: 8 }}>
            {status === "ok" && <span style={{ color: "green" }}>¡Listo! Te avisaremos.</span>}
            {status === "error" && <span style={{ color: "crimson" }}>Ups, intenta de nuevo.</span>}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
