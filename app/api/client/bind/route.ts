// app/api/client/bind/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Vincula al usuario logueado con un Client usando el slug (org).
 *
 * Espera body: { org: string }
 * - Si el usuario ya tiene ese mismo clientId => ok, no hace nada.
 * - Si no tiene clientId => se lo asigna.
 * - Si tiene otro clientId distinto => deja el que tenía y devuelve ok igual.
 */
export async function POST(req: Request) {
  try {
         const session = await getServerSession(authOptions);
         const s: any = session;

         if (!s?.user?.id) {
             return NextResponse.json(
                 { ok: false, error: "UNAUTHENTICATED" },
                 { status: 401 }
             );
         }


    const { org } = (await req.json().catch(() => ({}))) as {
      org?: string;
    };

    const slug = (org || "").trim();
    if (!slug) {
      return NextResponse.json(
        { ok: false, error: "Falta org (slug de Client)" },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true },
    });

    if (!client) {
      return NextResponse.json(
        { ok: false, error: `Client no encontrado para slug=${slug}` },
        { status: 404 }
      );
    }

    const userId = (s.user.id as string);


    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clientId: true },
    });

    // Si ya está ligado a este mismo cliente, no hacemos nada
    if (user?.clientId === client.id) {
      return NextResponse.json({
        ok: true,
        clientId: client.id,
        slug: client.slug,
        alreadyLinked: true,
      });
    }

    // Si está ligado a otro cliente, NO lo cambiamos (por seguridad)
    if (user?.clientId && user.clientId !== client.id) {
      return NextResponse.json({
        ok: true,
        clientId: user.clientId,
        slug: client.slug,
        alreadyLinked: true,
        note:
          "Usuario ya estaba vinculado a otro clientId; se mantiene el original.",
      });
    }

    // Caso normal: usuario sin clientId => lo vinculamos
    await prisma.user.update({
      where: { id: userId },
      data: { clientId: client.id },
    });

    return NextResponse.json({
      ok: true,
      clientId: client.id,
      slug: client.slug,
      linkedNow: true,
    });
  } catch (err: any) {
    console.error("[client/bind] error:", err);
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
