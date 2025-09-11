/** apps/marketing_clean/pages/index.tsx */
import type { NextPage } from "next";
import Head from "next/head";
import Nav from "../components/Nav";
import Hero from "../components/sections/Hero";
import Footer from "../components/Footer";
import dynamic from "next/dynamic";

// Evita hidratar de más: el form se monta solo en el cliente
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

        <section id="como-funciona" style={{ ...box, borderTop: "1px solid #e5e7eb" }}>
          <h2 className="text-xl font-semibold text-slate-900">¿Cómo funciona?</h2>
          <ol className="mt-2 list-decimal pl-5 text-slate-700 space-y-1">
            <li>Describe tu idea</li>
            <li>Completa 5 pasos</li>
            <li>Obtén tu informe</li>
          </ol>
        </section>

        <section id="precios" style={{ ...box, borderTop: "1px solid #e5e7eb" }}>
          <h2 className="text-xl font-semibold text-slate-900">Precios</h2>
          <p className="mt-2 text-slate-700">
            Comienza gratis. Pro desde US$8/mes (placeholder).
          </p>
        </section>

        <section style={{ ...box, borderTop: "1px solid #e5e7eb" }}>
          <h2 className="text-xl font-semibold text-slate-900">Recibe novedades</h2>
          <div className="mt-3">
            <NewsletterForm />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Home;
