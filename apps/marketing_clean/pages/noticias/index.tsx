// apps/marketing_clean/pages/noticias/index.tsx
import Head from "next/head";
import type { GetServerSideProps } from "next";
import Nav from "../../components/Nav";
import Footer from "../../components/sections/Footer";
import Link from "next/link";

const APP = process.env.NEXT_PUBLIC_APP_ORIGIN || "https://app.aret3.cl";

type NewsItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  content: string;
  status: "draft" | "published";
  imageUrl: string | null;
  authorName: string | null;
  publishedAt: string | null;
};

type Props = {
  items: NewsItem[];
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

export default function NewsListPage({ items }: Props) {
  // Por seguridad, solo mostramos noticias publicadas
  const publishedItems = items.filter((item) => item.status === "published");

  return (
    <>
      <Head>
        <title>Noticias para emprendedores — Aret3</title>

        {/* Description principal */}
        <meta
          name="description"
          content="Noticias y análisis breves para emprendedores: contexto económico, político y tecnológico explicado en simple, para tomar mejores decisiones con tu idea o negocio."
        />

        {/* Canonical */}
        <link rel="canonical" href="https://www.aret3.cl/noticias" />

        {/* Open Graph */}
        <meta
          property="og:title"
          content="Noticias para emprendedores — Aret3"
        />
        <meta
          property="og:description"
          content="Archivo de noticias y análisis preparados por el equipo editorial de Aret3 para entender cómo los cambios económicos, políticos y tecnológicos impactan a quienes emprenden."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.aret3.cl/noticias" />
        <meta
          property="og:image"
          content="https://www.aret3.cl/landing-banner.png"
        />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Noticias para emprendedores — Aret3"
        />
        <meta
          name="twitter:description"
          content="Noticias y análisis breves para emprendedores, con foco en decisiones de negocio."
        />
        <meta
          name="twitter:image"
          content="https://www.aret3.cl/landing-banner.png"
        />
      </Head>

      <Nav />

      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-2">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900">
                <img
                  src="/logo-report-2.png"
                  alt="Bot reportero Aret3"
                  className="h-8 w-8 rounded-full"
                  loading="lazy"
                />
              </span>
              <span>Noticias Aret3</span>
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Archivo de noticias y análisis preparados por nuestro equipo
              editorial para ayudarte a leer el contexto y tomar mejores
              decisiones al emprender.
            </p>
          </div>
          <a
            href="/#noticias"
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            ← Volver a la portada
          </a>
        </div>

        {publishedItems.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aún no hay noticias publicadas. Vuelve pronto.
          </p>
        ) : (
          <div className="space-y-3">
            {publishedItems.map((item) => (
              <Link
                key={item.id}
                href={`/noticias/${item.slug}`}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-blue-700">
                  {formatDate(item.publishedAt)}
                </p>
                <h2 className="mt-1 text-base font-semibold text-slate-900">
                  {item.title}
                </h2>
                {item.subtitle && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                    {item.subtitle}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{item.authorName || "Equipo Aret3"}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 group-hover:text-emerald-700">
                    <span>Ver más</span>
                    <span aria-hidden>↗</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const res = await fetch(`${APP}/api/news?limit=50`);
    if (!res.ok) {
      return { props: { items: [] } };
    }
    const data = await res.json();
    return {
      props: {
        items: data.items ?? [],
      },
    };
  } catch (e) {
    console.error("error fetching news list", e);
    return { props: { items: [] } };
  }
};
