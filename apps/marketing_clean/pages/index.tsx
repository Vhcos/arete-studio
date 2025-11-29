// apps/marketing_clean/pages/index.tsx
import Head from "next/head";
import type { GetStaticProps } from "next";
import dynamic from "next/dynamic";
import Nav from "../components/Nav";
import Hero from "../components/sections/Hero";
import Footer from "../components/sections/Footer";
import React from "react";
import ReportExample from "../components/sections/ReportExample";
import Link from "next/link";



const NewsletterForm = dynamic(() => import("../components/NewsletterForm"), { ssr: false });

const APP = process.env.NEXT_PUBLIC_APP_ORIGIN || "https://app.aret3.cl";

type NewsItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
  authorName: string | null;
};

type HomeProps = {
  news: NewsItem[];
};

function formatDate(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Home({ news }: HomeProps) {
  return (
    <>
      <Head>
        <title>Aret3 — Evalúa tu idea o negocio con IA</title>
        <meta
         name="description"
         content="Evalúa una idea nueva o un negocio en marcha sin saber finanzas. 10 pasos simples, informe visual y guía con IA para tomar mejores decisiones."
       />

        <link rel="canonical" href="https://www.aret3.cl/" />
      </Head>

      <Nav />

      {/* Sticky CTA siempre visible */}
                  {/* Sticky CTA siempre visible */}
      <aside className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Recuadro de mensaje, estilo tarjeta */}
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <p className="text-[11px] leading-snug text-slate-600">
              <span className="font-medium text-slate-900">Imagina una buena idea sin barreras: aret3 
                convierte sueños en realidad con planes de negocio rápidos y sencillos.</span>{" "}
              y es perfecto para instituciones {" "}
              <span className="font-medium">con programas de emprendimiento.</span>
            </p>
          </div>

          {/* Botones: Noticias + Acceder */}
          <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
            {/* Botón Noticias (con bot reportero) */}
            <a
              href="#noticias"
              className={`
                flex flex-col items-center justify-center gap-0.5
                rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-slate-900
                px-3.5 py-1.5 text-[11px] font-medium text-white shadow-md
                transition-all duration-300
                hover:from-emerald-500 hover:to-emerald-700
                active:scale-[0.98]
                sm:flex-row sm:gap-2
              `}
            >
              <div className="flex items-center gap-1.5">
                <img
                  src="/logo-report-2.png"
                  alt="Bot reportero Aret3"
                  className="h-8 w-8 rounded-full shadow-[0_0_6px_rgba(56,189,248,0.9)]"
                  loading="lazy"
                />
                <span className="whitespace-nowrap">Noticias Aret3</span>
              </div>
              <span className="mt-0.5 text-[10px] font-light text-amber-200 sm:mt-0">
                IA con ojos de reportero
              </span>
            </a>

                        {/* Botón Acceder (look azul) */}
            <a
              href={`${APP}/auth/sign-in?callbackUrl=/`}
              className={`
                flex flex-col items-center justify-center gap-0.5
                rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-slate-900
                px-3.5 py-1.5 text-[11px] font-medium text-white shadow-md
                transition-all duration-300
                hover:from-sky-400 hover:via-blue-500 hover:to-slate-800
                active:scale-[0.98]
                sm:flex-row sm:gap-2
              `}
            >
              <div className="flex items-center gap-1.5">
                {/* Icono A de acceso: cuando tengas el nuevo PNG, usa esa ruta */}
                <img
                  src="/icon-acceso.png"
                  alt="Acceder a tu cuenta Aret3"
                  className="h-8 w-8 rounded-full shadow-[0_0_6px_rgba(59,130,246,0.9)]"
                  loading="lazy"
                />
                <span className="whitespace-nowrap">Acceso</span>
              </div>
              <span className="mt-0.5 text-[10px] font-light text-sky-100 sm:mt-0">
                Entra a Aret3 y haz tu informe
              </span>
            </a>

          </div>
        </div>
      </aside>



      <main>
        {/* Hero existente */}
        <Hero />

        {/* Micro-beneficios muy claros */}
        <section className="mx-auto max-w-6xl px-4 pb-6 pt-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-2xl">🎯</div>
              <h3 className="mt-1 text-base font-semibold text-slate-900">10 pasos simples</h3>
              <p className="mt-1 text-sm text-slate-600">Para evaluar una idea o tu negocio en marcha,  de manera global y sin jerga financiera.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-2xl">⏱️</div>
              <h3 className="mt-1 text-base font-semibold text-slate-900">Menos de 15 minutos</h3>
              <p className="mt-1 text-sm text-slate-600">Termina con un informe visual que puedes compartir con socios, equipo o banco.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-2xl">🧠</div>
              <h3 className="mt-1 text-base font-semibold text-slate-900">IA que guía, no complica</h3>
              <p className="mt-1 text-sm text-slate-600">Visualizas si debes mejorar  precio, costos y clientes para acercarte al 8 % de utilidad.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-2xl">🔒</div>
              <h3 className="mt-1 text-base font-semibold text-slate-900">Privacidad real</h3>
              <p className="mt-1 text-sm text-slate-600">Tus datos son tuyos. Puedes borrarlos cuando quieras.</p>
            </div>
          </div>
        </section>

        {/* Cómo funciona en 60 segundos (demo rápida) */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">¿Cómo funciona?</h2>
              <ol className="mt-4 space-y-3 text-slate-700">
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    1
                  </span>
                  Describe tu idea con tus palabras. Si quieres, la IA la mejora.
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    2
                  </span>
                  Completa 2 datos económicos básicos (precio y clientes). Aret3 calcula el resto o si prefieres la IA puede ayudarte.
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    3
                  </span>
                  Recibe tu informe con recomendaciones y la <span className="font-medium">Regla del 8 %</span>.
                </li>
              </ol>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={`${APP}/auth/sign-in?callbackUrl=/`}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
                >
                  Empieza gratis
                </a>
                <a
                  href="#ejemplo"
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Ver ejemplo de informe
                </a>
              </div>
            </div>

            <div className="relative isolate">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] opacity-40 blur-2xl"
                style={{
                  background:
                    "radial-gradient(40% 40% at 20% 30%, #c7d2fe 0%, rgba(199,210,254,0) 70%), radial-gradient(40% 40% at 80% 70%, #fde68a 0%, rgba(253,230,138,0) 70%)",
                }}
              />
              <div className="aspect-video w-full overflow-hidden rounded-2xl ring-1 ring-black/5 shadow-xl">
                <iframe
                  className="h-full w-full"
                  src="https://www.youtube-nocookie.com/embed/dCrQAvtYTu8"
                  title="Aret3 — demo actualizada"
                  loading="lazy"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>
         
                 {/* Producto: idea vs negocio en marcha */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              Un mismo plan para ideas y negocios en marcha
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Aret3 traduce tu idea o tus números actuales en un plan simple: 
              cuánto deberías vender, qué margen necesitas y si vale la pena seguir, 
              ajustar o frenar.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Columna: etapa idea */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    IDEA
                  </span>
                  <span>Si estás en la etapa de idea 💡</span>
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>• Escribes tu idea con tus palabras, sin tecnicismos.</li>
                  <li>• Definimos un precio estimado y cuántos clientes podrías conseguir.</li>
                  <li>• Aret3 muestra si tiene sentido seguir, mejorarla o descartarla.</li>
                  <li>• Te deja un plan de acción de 6 semanas para avanzar sin perderte.</li>
                </ul>
              </div>

              {/* Columna: negocio funcionando */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    MIPYME
                  </span>
                  <span>Si ya tienes un negocio funcionando 📊</span>
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>• Ingresas ventas promedio, costos y precios actuales.</li>
                  <li>• Aret3 recalcula tu punto de equilibrio y la “Regla del 8 %”.</li>
                  <li>• Ves dónde se está yendo la plata: volumen, precios o costos.</li>
                  <li>• Sugiere ajustes concretos para mejorar tu utilidad.</li>
                </ul>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              En menos de 30 minutos tienes un diagnóstico numérico y un plan concreto, 
              sin ser experto en finanzas.
            </p>
          </div>
        </section>

        {/* La Regla del 8 % (compacta) */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <div className="flex justify-center">
              <img
                src="/regla-8.svg"
                alt="La Regla del 8 % (visual)"
                className="mx-auto h-auto w-3/4 md:w-2/3 lg:w-1/2"
                loading="lazy"
              />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">La Regla del 8 %</h2>
              <p className="mt-3 text-slate-700">
                Apuntamos a una utilidad neta anual mínima de <span className="font-medium">8 %</span> (≈ un mes de ventas).
                Si estás bajo ese umbral, te sugerimos ajustes de precio, costos o clientes para mejorar.
              </p>
            </div>
          </div>
        </section>

        <ReportExample />

        {/* Testimonio simple y visual */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <img
                src="/avatar-claudia.png"
                alt="Claudia, emprendedora"
                className="h-16 w-16 rounded-full border border-slate-200 object-cover"
                loading="lazy"
              />
              <blockquote className="text-slate-700">
                <p className="text-base">
                  “Con Aret3 entendí mis números sin saber finanzas. Ajusté precios, llegué al 8 % y lancé con confianza.”
                </p>
                <footer className="mt-1 text-sm text-slate-500">Claudia — Pastelería artesanal</footer>
              </blockquote>
              <div className="grow" />
              <a
                href={`${APP}/auth/sign-in?callbackUrl=/`}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Quiero mi informe
              </a>
            </div>
          </div>
        </section>

        {/* Bloque instituciones (B2B) */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">¿Universidad, incubadora o cowork?</h2>
              <p className="mt-2 text-slate-700">
                Enseña planificación y finanzas de forma práctica. Licencias educativas y para ONGs con descuento.
              </p>
              <p className="mt-2 text-slate-700">
                Si estás generando un impacto positivo, nos gustaría apoyarte. Ofrecemos un descuento especial para escuelas de negocios,
                universidades, empresas B y organizaciones sin fines de lucro.
              </p>
              <a
                href="mailto:vhc@aret3.cl?subject=Licencia%20ARET3%20para%20instituci%C3%B3n"
                className="mt-5 inline-block rounded-xl border border-amber-600 px-5 py-2 font-medium text-amber-700 hover:bg-amber-50"
              >
                Contáctanos
              </a>
            </div>
            <div className="flex justify-center">
              <img
                src="/universidad.svg"
                alt="Universidades e incubadoras"
                className="mx-auto h-auto w-3/4 md:w-2/3 lg:w-1/2"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* Seguridad / privacidad compacta */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-xl border border-amber-400/70 bg-amber-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">Tu idea, segura con Aret3</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Privacidad primero: no vendemos tus datos.</li>
              <li>Encriptado en tránsito y base de datos protegida.</li>
              <li>Puedes borrar tu información cuando quieras.</li>
            </ul>
            <a
              href="https://app.aret3.cl/privacy"
              className="mt-3 inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Términos y Privacidad
            </a>
          </div>
        </section>

                {/* Noticias para SEO / contenido dinámico */}
        {news && news.length > 0 && (
          <section id="noticias" className="mx-auto max-w-6xl px-4 py-12">
            {/* Título + logo bot */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-300">
                    <img
                      src="/logo-report-2.png"
                      alt="Bot reportero Aret3"
                      className="h-9 w-9 rounded-full"
                      loading="lazy"
                    />
                  </span>
                  <span>Noticias y análisis para emprendedores</span>
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Contexto breve para entender qué está pasando y cómo puede impactar tus decisiones al emprender.
                </p>
              </div>
              {/* Botón "Ver todas" */}
                    <a
                     href="/noticias"
                       className={`
                         inline-flex flex-col items-center justify-center gap-0.5
                         rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-slate-900
                         px-3.5 py-1.5 text-[11px] font-medium text-white shadow-md
                         transition-all duration-300
                         hover:from-emerald-500 hover:to-emerald-700
                         active:scale-[0.98]
                         sm:flex-row sm:gap-2
                       `}
                     >
                       <div className="flex items-center gap-1.5">
                       <img
                       src="/logo-report-2.png"
                       alt="Bot reportero Aret3"
                       className="h-7 w-7 rounded-full shadow-[0_0_6px_rgba(56,189,248,0.9)]"
                       loading="lazy"
                     />
                       <span className="whitespace-nowrap">Ver todas las noticias</span>
                       </div>
                    </a>
            </div>

            {/* Tarjetas */}
                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {news.map((item) => (
                <Link
                  key={item.id}
                  href={`/noticias/${item.slug}`}
                  className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg"
                >
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                  <p className="text-[11px] font-medium uppercase tracking-wide text-blue-700">
                    {formatDate(item.publishedAt)}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                      {item.subtitle}
                    </p>
                  )}

                  <div className="mt-3 flex-1" />

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{item.authorName || "Equipo Aret3"}</span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 group-hover:text-emerald-700">
                      <span>Ver más</span>
                      <span aria-hidden>↗</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>

          </section>
        )}


        {/* FAQ breve para no expertos */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-xl font-semibold text-slate-900">Preguntas frecuentes</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <details className="rounded-lg border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-900">¿Debo pagar para probar?</summary>
              <div className="mt-2 text-sm text-slate-700">No. Puedes empezar gratis y luego escalar cuando quieras.</div>
            </details>
            <details className="rounded-lg border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-900">¿Necesito saber finanzas?</summary>
              <div className="mt-2 text-sm text-slate-700">No. Te guiamos con IA y ejemplos. Son pasos simples.</div>
            </details>
            <details className="rounded-lg border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-900">¿Funciona sólo en Chile?</summary>
              <div className="mt-2 text-sm text-slate-700">No. Puedes usarlo en tu país; los conceptos son universales.</div>
            </details>
            <details className="rounded-lg border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-900">¿Qué pasa si no llego al 8 %?</summary>
              <div className="mt-2 text-sm text-slate-700">
                Te sugerimos ajustes (precio, costos, volumen) para mejorar tu resultado.
              </div>
            </details>
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

        {/* Ejemplo de informe (ancla para el CTA) */}
        <section id="ejemplo" className="px-4 pb-16">
          <div className="mx-auto max-w-3xl">
            <img
              src="/landing-banner.png"
              alt="Ejemplo de secciones del informe"
              className="w-full rounded-2xl border border-slate-200 object-cover"
              loading="lazy"
            />
          </div>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">¿Listo para empezar?</h3>
                <p className="text-slate-600">Crea tu acceso y comienza el recorrido ahora mismo.</p>
              </div>
              <div className="flex gap-3">
                <a
                  href={`${APP}/auth/sign-in?callbackUrl=/`}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Empieza gratis
                </a>
                <a
                  href="#ejemplo"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Ver ejemplo
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

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const base =
    process.env.NEXT_PUBLIC_APP_ORIGIN ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://app.aret3.cl");

  try {
    const res = await fetch(`${base}/api/news?limit=3`);
    if (!res.ok) {
      throw new Error(`Error al obtener noticias: ${res.status}`);
    }
    const data = await res.json();
    return {
      props: {
        news: (data.items ?? []) as NewsItem[],
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Error en getStaticProps de marketing /:", error);
    return {
      props: {
        news: [],
      },
      revalidate: 60,
    };
  }
};
