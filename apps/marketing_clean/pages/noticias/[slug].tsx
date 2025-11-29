// apps/marketing_clean/pages/noticias/[slug].tsx
import Head from "next/head";
import type { GetServerSideProps } from "next";
import Nav from "../../components/Nav";
import Footer from "../../components/sections/Footer";

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
  item: NewsItem;
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

export default function NewsDetailPage({ item }: Props) {
  const dateLabel = formatDate(item.publishedAt);

  const description =
    item.subtitle ||
    (item.content || "").slice(0, 150).replace(/\s+\S*$/, "") + "…";

  return (
          <>
      <Head>
        <title>{item.title} — Noticias Aret3</title>

        {/* Description principal */}
        <meta name="description" content={description} />

        {/* Canonical */}
        <link
          rel="canonical"
          href={`https://www.aret3.cl/noticias/${item.slug}`}
        />

        {/* Opcional: no indexar si no está publicada (por seguridad) */}
        {item.status !== "published" && (
          <meta name="robots" content="noindex" />
        )}

        {/* Open Graph para compartir como artículo */}
        <meta
          property="og:title"
          content={`${item.title} — Noticias Aret3`}
        />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta
          property="og:url"
          content={`https://www.aret3.cl/noticias/${item.slug}`}
        />
        {item.publishedAt && (
          <meta
            property="article:published_time"
            content={item.publishedAt}
          />
        )}
        {item.authorName && (
          <meta name="author" content={item.authorName} />
        )}

        {/* Imagen OG / Twitter: usa la de la noticia o un fallback */}
        {item.imageUrl ? (
          <>
            <meta property="og:image" content={item.imageUrl} />
            <meta name="twitter:image" content={item.imageUrl} />
          </>
        ) : (
          <>
            <meta
              property="og:image"
              content="https://www.aret3.cl/landing-banner.png"
            />
            <meta
              name="twitter:image"
              content="https://www.aret3.cl/landing-banner.png"
            />
          </>
        )}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`${item.title} — Noticias Aret3`}
        />
        <meta name="twitter:description" content={description} />
      </Head>


      <Nav />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-4 text-xs text-slate-500">
          <a
            href="/#noticias"
            className="rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50"
          >
            ← Volver a noticias
          </a>
        </div>

        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            {dateLabel}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            {item.title}
          </h1>
          {item.subtitle && (
            <p className="mt-2 text-base text-slate-700">{item.subtitle}</p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            {item.authorName || "Equipo editorial Aret3"}
          </p>
        </header>

        {item.imageUrl && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="h-auto w-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <article className="prose prose-slate max-w-none text-sm">
          <p className="whitespace-pre-line">{item.content}</p>
        </article>
      </main>

      <Footer />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const slug = ctx.params?.slug as string;

  try {
    const res = await fetch(`${APP}/api/news?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) {
      return { notFound: true };
    }
    const data = await res.json();
    if (!data?.ok || !data.item) {
      return { notFound: true };
    }

    return {
      props: {
        item: data.item,
      },
    };
  } catch (e) {
    console.error("error fetching news detail", e);
    return { notFound: true };
  }
};
