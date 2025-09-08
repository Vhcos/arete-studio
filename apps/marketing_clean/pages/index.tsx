// apps/marketing_clean/pages/index.tsx
import type { NextPage } from "next";
import Head from "next/head";
import Nav from "../components/Nav";
import Hero from "../components/sections/Hero";
import Footer from "../components/Footer";
import dynamic from "next/dynamic";

// Carga dinámica del formulario (evita hidratar demasiado en la primera pintura)
const NewsletterForm = dynamic(() => import("../components/NewsletterForm"), { ssr: false });

const box: React.CSSProperties = { maxWidth: 1120, margin: "0 auto", padding: "20px" };



const Home: NextPage = () => {
  return (
    <>
      <Head>
            <title>Areté · Evalúa tu idea de negocio con IA</title>
            <meta
              name="description"
              content="Completa 5 pasos y recibe un informe claro para decidir. Rápido, simple y visual."
            />
           <link rel="canonical" href="https://www.aret3.cl/" />
      </Head>


      <Nav />
      <main>
        <Hero />

        <section id="producto" style={{ ...box, borderTop: "1px solid #eee" }}>
          <h2>¿Cómo funciona?</h2>
          <ol>
            <li>Describe tu idea</li>
            <li>Completa 5 pasos</li>
            <li>Obtén tu informe</li>
          </ol>
        </section>

        <section id="precios" style={{ ...box, borderTop: "1px solid #eee" }}>
          <h2>Precios</h2>
          <p>Comienza gratis. Pro desde US$8/mes (placeholder).</p>
        </section>

        <section style={{ ...box, borderTop: "1px solid #eee" }}>
          <h2>Recibe novedades</h2>
          <NewsletterForm />
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Home;
