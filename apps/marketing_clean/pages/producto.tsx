// pages/producto/index.tsx
import Head from "next/head";
import Nav from "../components/Nav";
import Footer from "../components/sections/Footer";
import Link from "next/link";

const APP = process.env.NEXT_PUBLIC_APP_ORIGIN || "https://app.aret3.cl";

export default function ProductoPage() {
  return (
    <>
      <Head>
        <title>Producto — Aret3</title>
        <meta
          name="description"
          content="Conoce cómo funciona Aret3: 10 pasos simples, informes con IA, Regla del 8 % y herramientas para bajar la ansiedad al emprender."
        />
        <link rel="canonical" href="https://www.aret3.cl/producto" />
      </Head>

      <Nav />

      <main className="bg-white">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pt-10 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Producto
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Cómo funciona Aret3 por dentro
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-600">
            Aret3 une números, historia y emociones: en 10 pasos pasas de
            “tengo una idea” o “tengo un negocio en marcha” a un informe claro,
            con la Regla del 8&nbsp;% y un plan de acción concreto.
          </p>
        </section>

        {/* 1. Cómo funciona */}
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Paso a paso, sin perderte
              </h2>
              <ol className="mt-4 space-y-3 text-sm text-slate-700">
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                    1
                  </span>
                  Describe tu idea o tu negocio con tus palabras. Aret3 te ayuda
                  a pulir la propuesta y encontrar el foco.
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                    2
                  </span>
                  Ingresas datos simples: precio, clientela, costos principales.
                  No necesitas ser experta/o en finanzas.
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                    3
                  </span>
                  La IA de Aret3 arma tu informe: diagnóstico con la Regla del
                  8&nbsp;%, riesgos, oportunidades y un plan de acción de
                  6 semanas.
                </li>
              </ol>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={`${APP}/auth/sign-in?callbackUrl=/`}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  <span>Empieza gratis</span>
                  <span aria-hidden>🚀</span>
                </a>
                <a
                  href="https://youtu.be/czo1ekVG5hY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <span>Ver tutorial en video</span>
                  <span aria-hidden>▶</span>
                </a>
              </div>
            </div>

            <div className="relative isolate">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] opacity-40 blur-2xl"
                style={{
                  background:
                    "radial-gradient(40% 40% at 20% 30%, #bfdbfe 0%, rgba(191,219,254,0) 70%), radial-gradient(40% 40% at 80% 70%, #fee2e2 0%, rgba(254,226,226,0) 70%)",
                }}
              />
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/95 p-4 text-left text-sm text-slate-100 shadow-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
                  Vista rápida
                </p>
                <p className="mt-2 text-sm">
                  • 10 pasos guiados con ejemplos.  
                  • IA que sugiere mejoras, pero tú mandas.  
                  • Indicadores clave explicados en lenguaje simple.
                </p>
                <p className="mt-4 text-xs text-slate-400">
                  Ideal para emprendedoras/es que se sienten perdidos entre
                  tantas planillas, consejos y opiniones distintas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Qué resuelve / habilidades blandas */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Más que números: baja de ansiedad y claridad mental
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-700 leading-relaxed">
                Aret3 no pretende reemplazar tu intuición. La idea es
                ordenarla:&nbsp;
                <span className="font-semibold">
                  te obliga a poner en palabras tu propuesta, tu cliente y tu
                  ventaja diferenciadora
                </span>
                , mientras los números te muestran si el esfuerzo vale la pena.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li>• Ayuda a ponerle foco a tu oferta y decir mejor qué vendes.</li>
                <li>• Te obliga a elegir un tipo de cliente, no “todo el mundo”.</li>
                <li>• Convierte la angustia de “no sé por dónde partir” en un plan de 6 semanas.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm text-indigo-900">
              <p className="text-xs font-semibold uppercase tracking-[0.16em]">
                Para quién es Aret3
              </p>
              <ul className="mt-3 space-y-2">
                <li>• Personas con una idea nueva que quieren “aterrizarla”.</li>
                <li>• Negocios MIPYMES que ya venden, pero sin claridad de números.</li>
                <li>• Programas de emprendimiento que necesitan una herramienta simple para muchos participantes.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Características clave */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-xl font-semibold text-slate-900">
            Lo que hace distinto a Aret3
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "IA que guía, no complica",
                desc: "Usamos IA para ordenar tu historia y tus números, pero tú decides qué se queda y qué se va.",
              },
              {
                title: "Regla del 8 %",
                desc: "Indicador simple: ¿tu negocio puede dejar al menos 1 mes de ventas al año como utilidad?",
              },
              {
                title: "Enfocado en habilidades blandas",
                desc: "Te ayuda a explicar mejor tu idea, tu propuesta de valor y tu ventaja diferenciadora.",
              },
              {
                title: "Sirve para ideas y negocios en marcha",
                desc: "Puedes usarlo antes de lanzar o cuando ya estás vendiendo y quieres ordenar la casa.",
              },
              {
                title: "Diseñado para programas MIPYME",
                desc: "Perfecto para trabajar con grupos de 20, 50 o 200 emprendedores a la vez.",
              },
              {
                title: "Privacidad real",
                desc: "Tus datos son tuyos. Puedes borrar tu información cuando quieras.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm"
              >
                <h3 className="text-sm font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Comparativa vs Excel */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-xl font-semibold text-slate-900">
            Aret3 vs planillas de Excel
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            No queremos pelear con Excel: lo usamos todos los días. La diferencia
            es que Aret3 está pensado para personas que no viven en la planilla.
          </p>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tema</th>
                  <th className="px-4 py-3">Excel clásico</th>
                  <th className="px-4 py-3">Aret3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    Entrada de datos
                  </td>
                  <td className="px-4 py-3 text-slate-700">Celdas, fórmulas, formatos.</td>
                  <td className="px-4 py-3 text-slate-700">
                    Preguntas guiadas, lenguaje simple y ayudas con IA.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    Habilidades blandas
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    No incluye historia ni propuesta de valor.
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    Te ayuda a contar mejor tu idea y tu ventaja diferenciadora.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    Salida
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    Números en tablas y gráficos.
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    Informe listo para compartir: diagnóstico, riesgos,
                    oportunidades y plan de acción.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Regla del 8 % */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                La Regla del 8&nbsp;%
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-700 leading-relaxed">
                No todos los emprendimientos tienen que ser unicornios. Pero
                sí deberían, al menos, dejar{" "}
                <span className="font-semibold">
                  un mes de ventas al año como utilidad neta
                </span>
                . Esa es la idea detrás de la Regla del 8&nbsp;%.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li>• Te dice rápidamente si el esfuerzo compensa.</li>
                <li>• Es fácil de explicar a tu socio, pareja o inversionista.</li>
                <li>• Puede coexistir con métricas más avanzadas (TIR, VAN, etc.).</li>
              </ul>
            </div>
            <div className="flex justify-center">
              <img
                src="/regla-8.svg"
                alt="Visual de la Regla del 8 %"
                className="mx-auto h-auto w-3/4 md:w-2/3 lg:w-1/2"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* 6. Bloque instituciones */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Pensado también para instituciones
              </h2>
              <p className="mt-2 text-sm text-slate-700">
                Universidades, incubadoras, municipios, programas MIPYME: Aret3
                permite que cada participante genere su propio informe mientras
                el equipo coordinador ve el avance general.
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Podemos ajustar créditos, sesiones de acompañamiento y reportes
                para tu programa específico.
              </p>
              <a
                href="mailto:vhc@aret3.cl?subject=Licencia%20ARET3%20para%20programa%20de%20emprendimiento"
                className="mt-4 inline-block rounded-xl border border-amber-600 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
              >
                Conversemos para tu programa
              </a>
            </div>
            <div className="flex justify-center">
              <img
                src="/universidad.svg"
                alt="Aret3 en universidades e incubadoras"
                className="mx-auto h-auto w-3/4 md:w-2/3 lg:w-1/2"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  ¿Quieres probar cómo se siente usar Aret3?
                </h3>
                <p className="text-sm text-slate-600">
                  Crea tu acceso, usa los créditos de prueba y si te sirve,
                  escala con el pack emprendedor.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`${APP}/auth/sign-in?callbackUrl=/`}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  <span>Empieza gratis</span>
                  <span aria-hidden>🚀</span>
                </a>
                <Link
                  href="/noticias"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <span>Ver noticias y contexto</span>
                  <span aria-hidden>↗</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
