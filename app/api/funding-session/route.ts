// app/api/funding-session/route.ts
import "server-only";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/funding-session?id=xxxx
 * Devuelve la FundingSession del usuario autenticado.
 */
export async function GET(req: Request) {
  const session: any = await getServerSession(authOptions as any);
  const userId = session?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHENTICATED" },
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

  const fs = await prisma.fundingSession.findFirst({
    where: { id, userId },
  });

  if (!fs) {
    return NextResponse.json(
      { ok: false, error: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, session: fs });
}

/**
 * Por ahora no usamos POST aquí: la creación se hace en /api/funding-session/start.
 * Esto es solo para que no haya errores de tipo si alguien hace POST.
 */
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Use /api/funding-session/start para crear sesiones" },
    { status: 405 }
  );
}
