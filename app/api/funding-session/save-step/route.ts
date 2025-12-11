// app/api/funding-session/save-step/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SaveStepBody = {
  sessionId?: string;
  data?: any; // debe incluir al menos { step: "F1" | "F2" | ... }
};

export async function POST(req: Request) {
  // 1) Sesión
  const session = await getServerSession(authOptions).catch(() => null);
  const userId = (session as any)?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  // 2) Body
  let body: SaveStepBody = {};
  try {
    body = (await req.json()) as SaveStepBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_JSON" },
      { status: 400 }
    );
  }

  const { sessionId, data } = body;

  if (!sessionId) {
    return NextResponse.json(
      { ok: false, error: "MISSING_SESSION_ID" },
      { status: 400 }
    );
  }

  if (!data || typeof data !== "object") {
    return NextResponse.json(
      { ok: false, error: "MISSING_DATA" },
      { status: 400 }
    );
  }

  const stepKey =
    (data as any)?.step && typeof (data as any).step === "string"
      ? (data as any).step
      : "extra";

  try {
    // 3) Buscar la sesión y validar dueño
    const fs = await prisma.fundingSession.findUnique({
      where: { id: sessionId },
    });

    if (!fs || fs.userId !== userId) {
      return NextResponse.json(
        { ok: false, error: "SESSION_NOT_FOUND" },
        { status: 404 }
      );
    }

    // 4) Mezclar payload existente con el nuevo paso
    const existingPayload = (fs.payload as any) ?? {};
    const existingSteps = existingPayload.steps ?? {};

    const newPayload = {
      ...existingPayload,
      steps: {
        ...existingSteps,
        [stepKey]: data,
      },
    };

    const updated = await prisma.fundingSession.update({
      where: { id: fs.id },
      data: {
        payload: newPayload,
      },
    });

    console.log(
      "[/api/funding-session/save-step] Paso guardado",
      stepKey,
      "para sesión",
      updated.id
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(
      "[/api/funding-session/save-step] Error actualizando FundingSession:",
      err
    );
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
