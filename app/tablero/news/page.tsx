// app/tablero/news/page.tsx
"use client";

import { useEffect, useState } from "react";

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
  createdAt: string;
  updatedAt: string;
};

type Status = "draft" | "published";

const EMPTY_FORM: Partial<NewsItem> = {
  title: "",
  subtitle: "",
  content: "",
  status: "draft",
  imageUrl: "",
  authorName: "",
  publishedAt: "",
};

function formatDate(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NewsDashboardPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<NewsItem>>(EMPTY_FORM);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Cargar noticias
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/news?admin=1&limit=100");
        if (!res.ok) throw new Error("No se pudieron cargar las noticias");
        const data = await res.json();
        setItems(data.items ?? []);
      } catch (e: any) {
        console.error(e);
        setError(e.message ?? "Error al cargar noticias");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSelect = (item: NewsItem) => {
    setSelectedId(item.id);
    setForm({
      ...item,
      publishedAt: item.publishedAt ? item.publishedAt.slice(0, 16) : "",
    });
  };

  const handleNew = () => {
    setSelectedId(null);
    setForm(EMPTY_FORM);
  };

  const updateField = (field: keyof NewsItem, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (statusOverride?: Status) => {
    try {
      if (!form.title || !(form.title ?? "").trim()) {
        alert("La noticia necesita un título.");
        return;
      }

      const payload: any = {
        id: selectedId ?? undefined,
        title: form.title,
        subtitle: form.subtitle,
        content: form.content ?? "",
        status: (statusOverride ?? form.status ?? "draft") as Status,
        imageUrl: form.imageUrl || null,
        authorName: form.authorName || null,
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
        slug: (form as any).slug, // por si quieres editarlo luego
      };

      setSaving(true);
      setError(null);

      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Error al guardar la noticia");
      }

      const saved: NewsItem = data.item;

      // Actualiza lista en memoria
      setItems((prev) => {
        const exists = prev.find((i) => i.id === saved.id);
        if (exists) {
          return prev.map((i) => (i.id === saved.id ? saved : i));
        }
        return [saved, ...prev];
      });

      setSelectedId(saved.id);
      setForm({
        ...saved,
        publishedAt: saved.publishedAt ? saved.publishedAt.slice(0, 16) : "",
      });
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    const ok = window.confirm("¿Eliminar esta noticia? Esta acción no se puede deshacer.");
    if (!ok) return;

    try {
      setDeleting(true);
      setError(null);
      const res = await fetch(`/api/news?id=${encodeURIComponent(selectedId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Error al eliminar");
      }

      setItems((prev) => prev.filter((i) => i.id !== selectedId));
      handleNew();
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 lg:flex-row">
      {/* Columna izquierda: lista */}
      <div className="w-full lg:w-1/3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-semibold text-slate-900">Noticias</h1>
          <button
            type="button"
            onClick={handleNew}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
          >
            + Nueva noticia
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Aquí David puede crear, editar y publicar noticias para la portada.
        </p>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          {loading ? (
            <p className="px-2 py-3 text-sm text-slate-500">Cargando noticias…</p>
          ) : items.length === 0 ? (
            <p className="px-2 py-3 text-sm text-slate-500">
              Aún no hay noticias. Crea la primera desde el panel de la derecha.
            </p>
          ) : (
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                      selectedId === item.id
                        ? "bg-slate-900 text-white"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="line-clamp-1 font-medium">
                        {item.title || "(Sin título)"}
                      </span>
                      <span
                        className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          item.status === "published"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.status === "published" ? "Publicada" : "Borrador"}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                      {item.publishedAt ? formatDate(item.publishedAt) : "Sin fecha"}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Columna derecha: formulario */}
      <div className="w-full lg:w-2/3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">
              {selectedId ? "Editar noticia" : "Nueva noticia"}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={saving || deleting}
                onClick={() => handleSave("draft")}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Guardar borrador
              </button>
              <button
                type="button"
                disabled={saving || deleting}
                onClick={() => handleSave("published")}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Publicar
              </button>
              {selectedId && (
                <button
                  type="button"
                  disabled={saving || deleting}
                  onClick={handleDelete}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>

          {error && (
            <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Título
              </label>
              <input
                type="text"
                value={form.title ?? ""}
                onChange={(e) => updateField("title", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="Ej: Cómo la inflación está cambiando la forma de emprender"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Subtítulo (opcional)
              </label>
              <input
                type="text"
                value={form.subtitle ?? ""}
                onChange={(e) => updateField("subtitle", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="Una frase corta que explique el foco de la noticia"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Autor (opcional)
                </label>
                <input
                  type="text"
                  value={form.authorName ?? ""}
                  onChange={(e) => updateField("authorName", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  placeholder="Ej: David, equipo editorial Aret3"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Fecha de publicación (opcional)
                </label>
                <input
                  type="datetime-local"
                  value={form.publishedAt ?? ""}
                  onChange={(e) => updateField("publishedAt", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Si dejas esto vacío y publicas, se usará la fecha y hora actuales.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Imagen (URL opcional)
              </label>
              <input
                type="text"
                value={form.imageUrl ?? ""}
                onChange={(e) => updateField("imageUrl", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="https://…"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Más adelante podemos conectar un uploader; por ahora es solo URL.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Contenido (texto largo, para SEO)
              </label>
              <textarea
                value={form.content ?? ""}
                onChange={(e) => updateField("content", e.target.value)}
                className="mt-1 h-40 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="Escribe aquí la noticia. Puedes usar párrafos cortos, subtítulos y datos que ayuden al SEO."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
