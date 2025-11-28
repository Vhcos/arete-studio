// app/api/news/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function toInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function ensureUniqueSlug(base: string, existingId?: string | null) {
  let slug = slugify(base || "noticia");
  let candidate = slug;
  let counter = 2;

  // Permite reutilizar el mismo slug si es el mismo registro
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const found = await prisma.newsPost.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!found || (existingId && found.id === existingId)) {
      return candidate;
    }
    candidate = `${slug}-${counter++}`;
  }
}

// ---------- GET: lista de noticias o una por slug ----------
// - Landing lista: /api/news?limit=3
// - Panel lista:   /api/news?admin=1
// - Detalle:       /api/news?slug=kast-vs-jara
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    // Caso detalle por slug
    if (slug) {
      const item = await prisma.newsPost.findUnique({
        where: { slug },
      });
      if (!item) {
        return NextResponse.json(
          { ok: false, error: "NOT_FOUND" },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, item });
    }

    // Caso lista
    const limit = toInt(searchParams.get("limit"), 3);
    const admin = searchParams.get("admin") === "1";

    const where = admin
      ? {}
      : {
          status: "published",
          publishedAt: {
            lte: new Date(),
          },
        };

    const items = await prisma.newsPost.findMany({
      where,
      orderBy: {
        publishedAt: "desc",
      },
      take: admin ? Math.min(limit, 100) : limit,
    });

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("GET /api/news error", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// ---------- POST: crear / actualizar noticia ----------
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const data = (await req.json().catch(() => null)) as any;
    if (!data || !data.title || !data.status) {
      return NextResponse.json(
        { ok: false, error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    const {
      id,
      title,
      subtitle,
      content,
      status,
      imageUrl,
      authorName,
      slug: incomingSlug,
      publishedAt,
    } = data;

    const slugBase = incomingSlug || title;
    const slug = await ensureUniqueSlug(slugBase, id);

    let publishedAtValue: Date | null = null;
    if (publishedAt) {
      const d = new Date(publishedAt);
      publishedAtValue = Number.isNaN(d.getTime()) ? null : d;
    } else if (!id && status === "published") {
      // si es nueva y publicada, fecha = ahora
      publishedAtValue = new Date();
    }

    if (!id) {
      const created = await prisma.newsPost.create({
        data: {
          title,
          subtitle: subtitle || null,
          content: content || "",
          status,
          imageUrl: imageUrl || null,
          authorName: authorName || null,
          slug,
          publishedAt: publishedAtValue,
        },
      });

      return NextResponse.json({ ok: true, item: created });
    } else {
      const updated = await prisma.newsPost.update({
        where: { id },
        data: {
          title,
          subtitle: subtitle || null,
          content: content || "",
          status,
          imageUrl: imageUrl || null,
          authorName: authorName || null,
          slug,
          publishedAt: publishedAtValue,
        },
      });

      return NextResponse.json({ ok: true, item: updated });
    }
  } catch (error) {
    console.error("POST /api/news error", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// ---------- DELETE: borrar noticia ----------
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "MISSING_ID" },
        { status: 400 }
      );
    }

    await prisma.newsPost.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/news error", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
