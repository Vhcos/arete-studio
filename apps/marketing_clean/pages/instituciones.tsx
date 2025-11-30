// apps/marketing_clean/pages/instituciones.tsx
import Head from "next/head";
import Nav from "../components/Nav";
import Footer from "../components/sections/Footer";

export default function InstitucionesPage() {
  return (
    <>
      <Head>
        <title>
          Aret3 para instituciones — incubadoras, centros de emprendimiento y
          programas municipales
        </title>

        <meta
          name="description"
          content="Implementa Aret3 en tu incubadora, centro de emprendimiento o programa municipal para evaluar ideas en menos de 30 minutos, con informes comparables para cada emprendedor."
        />

        <link rel="canonical" href="https://www.aret3.cl/instituciones" />

        {/* Open Graph */}
        <meta
          property="og:title"
          content="Aret3 para instituciones — incubadoras, centros de emprendimiento y programas municipales"
        />
        <meta
          property="og:description"
          content="Llega a más emprendedores sin ahogarte en planillas: Aret3 transforma ideas sueltas en informes comparables para comités, fondos y programas públicos."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://www.aret3.cl/instituciones"
        />
        <meta
          property="og:image"
          content="https://www.aret3.cl/landing-banner.png"
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Aret3 para instituciones — incubadoras, centros de emprendimiento y programas municipales"
        />
        <meta
          name="twitter:description"
          content="Evalúa ideas y negocios en menos de 30 minutos y sigue la evolución de tus emprendedores con informes comparables."
        />
        <meta
          name="twitter:image"
          content="https://www.aret3.cl/landing-banner.png"
        />
      </Head>

      <Nav />

      <main className="mx-auto max-w-4xl px-4 py-10">
        {/* Hero */}
        <section className="mb-10">
          <h1 className="text-3xl font-semibold text-slate-900">
            Aret3 para instituciones de emprendimiento
          </h1>
          <p className="mt-3 text-sm text-slate-700">
            Si diriges una incubadora, un centro de emprendimiento o un programa
            municipal, probablemente te pasa algo así: llegan muchas ideas,
            pero no tienes una forma simple de evaluarlas y seguirlas en el
            tiempo. Para eso existe Aret3.
          </p>
          <p className="mt-3 text-sm text-slate-700">
            Aret3 es una aplicación web que, en menos de 30 minutos, lleva a
            cualquier persona desde una idea suelta hasta un informe completo,
            listo para revisar en comité o presentar a un fondo.
          </p>
        </section>

        {/* Cómo funciona para la institución */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-slate-900">
            ¿Cómo funciona para tu institución?
          </h2>
          <p className="mt-3 text-sm text-slate-700">
            El flujo para instituciones es simple y está pensado para que no
            tengas que cambiar tu programa ni tu forma de trabajar:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>
              <span className="font-medium">1. Creamos tu organización</span>{" "}
              dentro de Aret3, por ejemplo: Ruta N, Innovación Providencia o
              Jaku Emprende.
            </li>
            <li>
              <span className="font-medium">
                2. Te entregamos un enlace exclusivo
              </span>{" "}
              para tu programa. Ese link lleva un código de organización, de
              modo que todo lo que pase ahí queda automáticamente asociado a
              ustedes.
            </li>
            <li>
              <span className="font-medium">
                3. Cada emprendedor entra con su correo
              </span>{" "}
              y recibe un enlace de acceso seguro. Desde ahí completa un
              recorrido guiado: datos del proyecto, rubro, clientes, parte
              emocional, parte económica, flujo de caja básico y un plan de
              acción.
            </li>
          </ul>
        </section>

        {/* Qué recibe cada uno */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-slate-900">
            Qué recibe el emprendedor y qué recibe la institución
          </h2>
          <p className="mt-3 text-sm text-slate-700">
            Cuando un emprendedor termina el recorrido, Aret3 genera un informe
            en PDF con toda la información organizada.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>
              <span className="font-medium">El emprendedor</span> recibe el
              informe directamente en su correo, para que pueda revisarlo,
              compartirlo y seguir trabajando.
            </li>
            <li>
              <span className="font-medium">La institución</span> recibe una
              copia en una casilla institucional que definimos juntos.
            </li>
            <li>
              Además, guardamos cada PDF en una{" "}
              <span className="font-medium">carpeta segura en la nube</span>,
              organizada por programa y por usuario, de modo que puedas ver la
              evolución de cada persona: primer informe, segundo, tercer avance…
              sin perder nada.
            </li>
          </ul>
        </section>

        {/* Seguridad y datos */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-slate-900">
            Seguridad y tratamiento de datos
          </h2>
          <p className="mt-3 text-sm text-slate-700">
            Sabemos que trabajas con información sensible de personas y
            emprendimientos. Por eso:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Usamos proveedores con estándares de seguridad internacionales.</li>
            <li> Ciframos la información en tránsito.</li>
            <li>
              Contamos con un{" "}
              <span className="font-medium">
                acuerdo de tratamiento de datos
              </span>{" "}
              donde nos comprometemos a:
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  Usar la información solo para prestar el servicio que acordemos
                  contigo.
                </li>
                <li>
                  No vender ni compartir los datos con terceros ajenos al
                  programa.
                </li>
                <li>Respetar la confidencialidad y los derechos de los usuarios.</li>
              </ul>
            </li>
          </ul>
        </section>

        {/* Cierre y llamada a la acción */}
        <section className="mb-14 rounded-2xl bg-slate-900 px-6 py-8 text-sm text-slate-100">
          <h2 className="text-xl font-semibold">
            Conversemos sobre tu programa
          </h2>
          <p className="mt-3">
            Si quieres evaluar mejor tus programas, acompañar a más
            emprendedores sin ahogarte en planillas y tener informes comparables
            para la toma de decisiones, hablemos.
          </p>
          <p className="mt-3">
            Podemos revisar juntos tu contexto, ver cómo encaja Aret3 en tu
            institución y preparar un piloto con tus propias cohortes.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href="mailto:vhc@aret3.cl?subject=Demo%20Aret3%20para%20instituciones"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-emerald-400"
            >
              <span>Agendar demo de 30 minutos</span>
              <span aria-hidden>↗</span>
            </a>
            <p className="text-[11px] text-slate-300">
              Demo online, sin compromiso. 30 minutos para ver la herramienta y
              resolver dudas.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
