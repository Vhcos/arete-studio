// apps/marketing_clean/pages/instituciones.tsx
import Head from "next/head";
import Nav from "../components/Nav";
import Footer from "../components/sections/Footer";

export default function InstitucionesPage() {
  return (
    <>
      <Head>
        <title>
          Aret3 para instituciones — incubadoras, universidades y programas
          municipales
        </title>

        <meta
          name="description"
          content="Implementa Aret3 en tu incubadora, universidad o programa municipal para evaluar ideas y negocios en funcionamiento en menos de 30 minutos, con informes comparables y apoyo para financiamiento."
        />

        <link rel="canonical" href="https://www.aret3.cl/instituciones" />

        {/* Open Graph */}
        <meta
          property="og:title"
          content="Aret3 para instituciones — incubadoras, universidades y programas municipales"
        />
        <meta
          property="og:description"
          content="Haz tus programas de emprendimiento más claros y medibles: Aret3 transforma ideas y negocios en informes comparables y prepara borradores para Sercotec, Corfo y fondos locales."
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
          content="Aret3 para instituciones — incubadoras, universidades y programas municipales"
        />
        <meta
          name="twitter:description"
          content="Evalúa ideas y negocios en funcionamiento en menos de 30 minutos y apoya la postulación a fondos públicos con borradores listos para revisar."
        />
        <meta
          name="twitter:image"
          content="https://www.aret3.cl/landing-banner.png"
        />
      </Head>

      <Nav />

      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* HERO */}
        <section className="grid gap-8 md:grid-cols-2 md:items-center md:gap-10">
          <div>
            <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
              Para incubadoras, universidades y programas municipales
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">
              Haz tus programas de emprendimiento más claros y medibles
            </h1>
            <p className="mt-4 text-sm text-slate-700">
              Aret3 ayuda a que tus emprendedores —con ideas o con negocios en
              funcionamiento— pasen de la cabeza al papel en menos de 30
              minutos, con informes comparables para comité, fondos y
              seguimiento.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="mailto:vhc@aret3.cl?subject=Demo%20Aret3%20para%20instituciones"
                className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-500"
              >
                <span>Agendar demo de 30 minutos</span>
                <span aria-hidden>↗</span>
              </a>
              <a
                href="/#ejemplo"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <span>Ver ejemplo de informe</span>
              </a>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative w-full max-w-md rounded-3xl bg-slate-900 p-4 text-xs text-slate-100 shadow-xl">
              <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-300">
                Vista de informe
              </p>
              <p className="mt-2 text-sm font-semibold">
                Cohorte &quot;Semilla 2025&quot;
              </p>
              <p className="mt-1 text-[11px] text-slate-300">
                Idea vs. negocio en marcha, margen esperado, riesgo y
                recomendación en un solo lugar.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
                <div className="rounded-2xl bg-slate-800/80 p-3">
                  <p className="font-semibold text-emerald-300">
                    Idea: Food Truck
                  </p>
                  <p className="mt-1 text-slate-200">
                    Utilidad esperada 9,2 % · margen sano.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-800/80 p-3">
                  <p className="font-semibold text-sky-300">
                    Negocio: Café de barrio
                  </p>
                  <p className="mt-1 text-slate-200">
                    Ventas constantes · mejora de costos sugerida.
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[11px] text-slate-400">
                Informe comparable para cada proyecto, listo para comité o
                financiamiento.
              </p>
            </div>
          </div>
        </section>

        {/* BLOQUE PROBLEMA */}
        <section className="mt-16 grid gap-8 md:grid-cols-[1.1fr,0.9fr] md:items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Defiende mejores programas sin ahogarte en planillas
            </h2>
            <p className="mt-3 text-sm text-slate-700">
              Dejas de recibir PDFs y planillas distintas por cada persona.
              Aret3 ordena la información de tus emprendedores en el mismo
              esquema: clientes, propuesta de valor, números básicos, flujo de
              caja y nivel de riesgo.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>• Ideas y negocios en marcha con el mismo formato.</li>
              <li>• Un informe por emprendedor que se puede actualizar.</li>
              <li>• Menos tiempo leyendo documentos, más tiempo acompañando.</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800">
            <p className="text-[11px] font-medium uppercase tracking-wide text-sky-700">
              Vista de cohorte
            </p>
            <p className="mt-2 text-sm font-semibold">
              24 proyectos · Programa &quot;Incuba 2025&quot;
            </p>
            <ul className="mt-3 space-y-1.5">
              <li>• 10 ideas en etapa temprana.</li>
              <li>• 14 negocios en funcionamiento.</li>
              <li>• 8 sobre la Regla del 8 %, 6 en alerta, 10 en trabajo.</li>
            </ul>
          </div>
        </section>

        {/* BLOQUE LO QUE PASA CON LOS EMPRENDEDORES */}
        <section className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Enseña a tus emprendedores a pensar como negocios
            </h2>
            <p className="mt-3 text-sm text-slate-700">
              El wizard de Aret3 les explica, paso a paso, conceptos como
              precio, margen, clientes y flujo de caja sin tecnicismos. Sirve
              igual para una idea nueva y para un negocio que ya factura.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>• 10 pasos simples, lenguaje cotidiano.</li>
              <li>• Ayudas visuales para entender precios, costos y utilidad.</li>
              <li>• Plan de acción concreto para los próximos meses.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Modelación financiera sin hojas de cálculo
            </h2>
            <p className="mt-3 text-sm text-slate-700">
              Aret3 toma lo que responde el emprendedor y arma proyecciones
              básicas: cuánto debería vender, qué margen necesita y cómo se ve
              un flujo de caja realista.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>• Proyecciones automáticas con supuestos simples.</li>
              <li>• Foco en la Regla del 8 % de utilidad neta.</li>
              <li>• Informe en PDF para el emprendedor y para la institución.</li>
            </ul>
          </div>
        </section>

        {/* BLOQUE FINANCIAMIENTO */}
        <section className="mt-16 grid gap-6 md:grid-cols-[1.1fr,0.9fr] md:items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Del informe interno a borradores para Sercotec, Corfo y fondos
              locales
            </h2>
            <p className="mt-3 text-sm text-slate-700">
              Después del informe, muchos quieren postular a fondos. El módulo
              de financiamiento toma la información del proyecto —idea o negocio
              en funcionamiento— y hace algunas preguntas extra: perfil del
              postulante, estado del negocio, monto a solicitar, uso de los
              recursos y fondos objetivo.
            </p>
            <p className="mt-3 text-sm text-slate-700">
              Con eso, Aret3 arma borradores de respuestas para formularios de
              financiamiento, listos para copiar/pegar y revisar con tu equipo.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>• Borradores para Sercotec, Corfo, programas municipales.</li>
              <li>• Preguntas guiadas para monto, uso de fondos y tracción.</li>
              <li>
                • Mejores postulaciones sin que tu equipo escriba todo desde
                cero.
              </li>
            </ul>
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
            <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
              Módulo de financiamiento
            </p>
            <p className="mt-2 text-sm font-semibold">
              Un mismo proyecto, varios borradores
            </p>
            <ul className="mt-3 space-y-1.5">
              <li>• Capital Semilla / Abeja.</li>
              <li>• Semilla Inicia / Expande.</li>
              <li>• Programas municipales o regionales.</li>
            </ul>
            <p className="mt-3 text-[11px] text-emerald-800">
              El emprendedor responde una vez; tú obtienes textos alineados al
              lenguaje de cada fondo.
            </p>
          </div>
        </section>

        {/* BLOQUE PILOTO */}
        <section className="mt-16">
          <h2 className="text-xl font-semibold text-slate-900">
            Cómo se ve un piloto de 4–8 semanas
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                Semana 1
              </p>
              <p className="mt-1 font-semibold">Onboarding</p>
              <p className="mt-1 text-xs">
                Configuramos tu organización, definimos cohortes y preparamos el
                acceso para tu equipo.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                Semanas 2–3
              </p>
              <p className="mt-1 font-semibold">
                Uso en talleres o de forma autónoma
              </p>
              <p className="mt-1 text-xs">
                Los emprendedores completan el wizard y generan sus primeros
                informes con acompañamiento de tu equipo.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                Semana 4
              </p>
              <p className="mt-1 font-semibold">Revisión de informes</p>
              <p className="mt-1 text-xs">
                Comités, mentores y equipo técnico usan los informes para tomar
                decisiones y dar feedback específico.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                Semanas 6–8
              </p>
              <p className="mt-1 font-semibold">
                Ajustes y módulo de financiamiento
              </p>
              <p className="mt-1 text-xs">
                Uso opcional del módulo de financiamiento y revisión de
                métricas: participación, avance y calidad de proyectos.
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-600">
            Al final del piloto, te entregamos un reporte con uso de la
            herramienta, ejemplos de informes y sugerencias para escalar al
            resto de tus programas.
          </p>
        </section>

        {/* CTA FINAL */}
        <section className="mt-16 mb-14 rounded-2xl bg-slate-900 px-6 py-8 text-sm text-slate-100">
          <h2 className="text-xl font-semibold">
            Conversemos sobre tu programa
          </h2>
          <p className="mt-3">
            Si quieres acompañar mejor a tus emprendedores —tanto con ideas como
            con negocios en funcionamiento—, medir mejor tus programas y preparar
            mejores postulaciones a fondos, hablemos.
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
