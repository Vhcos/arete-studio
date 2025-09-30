import Head from "next/head";
import dynamic from "next/dynamic";
import Nav from "../components/Nav";
import Hero from "../components/sections/Hero";
import Footer from "../components/sections/Footer";

const NewsletterForm = dynamic(() => import("../components/NewsletterForm"), {
  ssr: false,
});

const APP = process.env.NEXT_PUBLIC_APP_ORIGIN || "https://app.aret3.cl";

export default function Home() {
  return (
    <>
      <Head>
        <title>Areté — Evalúa tu idea de negocio con IA</title>
        <meta
          name="description"
          content="Completa 5 pasos y recibe un informe claro para decidir. Rápido, simple y visual."
        />
        <link rel="canonical" href="https://www.aret3.cl/" />
      </Head>

      <Nav />

      <main>
        <Hero />

        {/* ¿Cómo funciona? */}
        <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-xl font-semibold text-slate-900">¿Cómo funciona?</h2>
          <hr className="my-4 border-slate-200" />
          <ol className="list-decimal space-y-2 pl-6 text-slate-700">
            <li>Describe tu idea</li>
            <li>Completa 5 pasos</li>
            <li>Obtén tu informe</li>
          </ol>
        </section>

{/* Tutorial en video */}
<section className="mx-auto max-w-6xl px-4 py-12">
  <h2 className="text-xl font-semibold text-slate-900">Aprende a usar Aret3</h2>
  <hr className="my-4 border-slate-200" />
  <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-200">
    <iframe
      className="h-full w-full"
      src="https://www.youtube.com/embed/jwvs4DB22ug"
      title="Tutorial Aret3"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  </div>
</section>


        {/* Precios (placeholder) */}
        <section id="precios" className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-xl font-semibold text-slate-900">Precios</h2>
          <hr className="my-4 border-slate-200" />
        <p className="text-slate-700">
          Comienza gratis. con 10 consultas a la IA. Incluye tu guia para el plan financiero.
        </p>
        <p className="text-slate-700">
          Luego plan Proposito desde $5.000 (USD$5) dolares mensuales.
        </p>
        <p className="text-slate-700">
          Si quieres agendar una reunion online conmigo desde los $30.000 (USD$30) para que te ayude a evaluar tu idea, puedes hacerlo{" "}
          <a href="/billing" className="text-blue-600 hover:underline">aquí</a>.
        </p>
        <p className="text-slate-700">
          Si tienes una idea de negocio que quieres evaluar, pero no tienes claro si es viable o no, 
          puedes escribirme a <a href="mailto:vhc@aret3.cl" className="text-blue-600 hover:underline">vhc@aret3.cl</a>.
        </p>
        </section>

        {/* Para instituciones */}
<section id="instituciones" className="mx-auto max-w-6xl px-4 py-12">
  <div className="mt-6 rounded-xl border border-amber-500 bg-amber-50 p-4">
    <h2 className="text-xl font-semibold text-slate-900">¿Eres una universidad, incubadora o cowork?</h2>
    <p className="mt-2 text-slate-700">
      Cultive la innovación y fomente el espíritu emprendedor con nuestra plataforma de desarrollo de ideas sencilla e intuitiva.
    </p>
    <p className="mt-2 text-slate-700">
      Enseñe a sus estudiantes a dominar la planificación empresarial y financiera paso a paso con una guía divertida y práctica.
    </p>
    <p className="mt-2 text-slate-700">
     Si estás generando un impacto positivo, nos gustaría apoyarte. Ofrecemos un descuento especial 
     para escuelas de negocios, universidades, empresas B y organizaciones sin fines de lucro.
    </p>
    <a
      href="mailto:vhc@aret3.cl?subject=Licencia%20ARET3%20para%20institución"
      className="mt-4 inline-block rounded-xl border border-blue-600 px-4 py-2 font-medium text-blue-700 hover:bg-blue-50"
    >
      Contáctanos
    </a>
  </div>
</section>

        {/* Newsletter */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-xl font-semibold text-slate-900">Recibe novedades</h2>
          <hr className="my-4 border-slate-200" />
          <div className="max-w-xl">
            <NewsletterForm />
          </div>
        </section>

        {/* Imagen full width bajo newsletter */}
        <section className="px-4 pb-16">
          <div className="mx-auto max-w-3xl">
            <img
              src="/landing-banner.png"
              alt="Vista del producto"
              className="w-full rounded-2xl border border-slate-200 object-cover"
            />
          </div>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">¿Listo para empezar?</h3>
                <p className="text-slate-600">
                  Te toma 2 minutos crear tu acceso y comenzar el recorrido.
                </p>
              </div>
              <div className="flex gap-3">
                <a
                  href={`${APP}/auth/sign-in?callbackUrl=/`}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Empieza gratis
                </a>
                <a
                  href={`${APP}/auth/sign-in?callbackUrl=/`}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Acceder
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
