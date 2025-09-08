import Head from "next/head";
import Link from "next/link";

export default function HelpCenter() {
  const box: React.CSSProperties = { maxWidth: 960, margin: "0 auto", padding: "24px" };
  const h2: React.CSSProperties = { marginTop: 24 };
  const li: React.CSSProperties = { margin: "6px 0" };

  return (
    <>
      <Head>
        <title>Centro de ayuda | Areté</title>
        <meta
          name="description"
          content="Preguntas frecuentes sobre Areté: cómo funciona, precios, privacidad y contacto."
        />
        <link rel="canonical" href="https://www.aret3.cl/recursos/centro-de-ayuda" />
      </Head>

      <main style={box}>
        <h1>Centro de ayuda</h1>
        <p>Resolvemos las dudas más comunes para empezar rápido.</p>

        <section style={h2}>
          <h2>¿Qué es Areté?</h2>
          <p>
            Areté es una herramienta para <strong>evaluar ideas de negocio</strong>.
            Completa 5 pasos y obtén un informe claro para decidir.
          </p>
        </section>

        <section style={h2}>
          <h2>¿Cómo funciona?</h2>
          <ol>
            <li style={li}>Describe tu idea.</li>
            <li style={li}>Completa 5 pasos guiados.</li>
            <li style={li}>Recibe un informe con puntaje y recomendaciones.</li>
          </ol>
        </section>

        <section style={h2}>
          <h2>¿Cuánto cuesta?</h2>
          <p>
            Comienza <strong>gratis</strong>. Pronto habilitaremos planes Pro por suscripción
            mensual para uso frecuente.
          </p>
        </section>

        <section style={h2}>
          <h2>Privacidad</h2>
          <p>
            Tus datos se usan sólo para generar tu informe. Puedes solicitar su eliminación cuando quieras.
          </p>
        </section>

        <section style={h2}>
          <h2>Contacto</h2>
          <p>
            ¿Dudas? Escríbenos a <a href="mailto:contacto@aret3.cl">contacto@aret3.cl</a>.
          </p>
        </section>

        <p style={{ marginTop: 32 }}>
          <Link href="/">← Volver al inicio</Link>
        </p>
      </main>
    </>
  );
}
