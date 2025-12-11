// app/api/funding-session/[sessionId]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";



type FundingStep = "F1" | "F2" | "F3" | "F4" | "F5";

type UpdateFundingSessionBody = {
  step: FundingStep;
  data: unknown;                      // lo que mande cada formulario
  status?: "draft" | "completed";     // opcional: marcar completado al final
};

/**
 * GET /api/funding-session/:sessionId
 * Devuelve la sesión de financiamiento del usuario logueado.
 */
export async function GET(
  _req: Request,
  { params }: { params: { sessionId: string } }
) {
  const session = await getServerSession(authOptions).catch(() => null);
  const userId = (session as any)?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  const fundingSession = await prisma.fundingSession.findFirst({
    where: {
      id: params.sessionId,
      userId,
    },
  });

  if (!fundingSession) {
    return NextResponse.json(
      { ok: false, error: "FUNDING_SESSION_NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    session: {
      id: fundingSession.id,
      reportId: fundingSession.reportId,
      clientId: fundingSession.clientId,
      status: fundingSession.status,
      creditsCharged: fundingSession.creditsCharged,
      payload: (fundingSession as any).payload ?? {},
      createdAt: fundingSession.createdAt,
      updatedAt: fundingSession.updatedAt,
    },
  });
}

/**
 * PATCH /api/funding-session/:sessionId
 * Actualiza el payload de la sesión con las respuestas de un paso (F1–F5).
 * NO toca créditos: eso ya se hizo en /api/funding-session/start.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  const session = await getServerSession(authOptions).catch(() => null);
  const userId = (session as any)?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  let body: UpdateFundingSessionBody;
  try {
    body = (await req.json()) as UpdateFundingSessionBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_JSON_BODY" },
      { status: 400 }
    );
  }

  const { step, data, status } = body;

  if (!step || !data) {
    return NextResponse.json(
      { ok: false, error: "MISSING_STEP_OR_DATA" },
      { status: 400 }
    );
  }

  if (!["F1", "F2", "F3", "F4", "F5"].includes(step)) {
    return NextResponse.json(
      { ok: false, error: "INVALID_STEP" },
      { status: 400 }
    );
  }

  const fundingSession = await prisma.fundingSession.findFirst({
    where: {
      id: params.sessionId,
      userId,
    },
  });

  if (!fundingSession) {
    return NextResponse.json(
      { ok: false, error: "FUNDING_SESSION_NOT_FOUND" },
      { status: 404 }
    );
  }

  // Payload actual como objeto plano
const currentPayload = ((fundingSession as any).payload ?? {}) as Record<
  string,
  any
>;

// Guardamos cada paso en su clave: f1, f2, f3, f4, f5
const newPayload: Record<string, any> = {
  ...currentPayload,
  [step.toLowerCase()]: data,
};

const updated = await prisma.fundingSession.update({
  where: { id: fundingSession.id },
  data: {
    // Prisma lo guarda como JSON; aquí solo silenciamos TS en el borde
    payload: newPayload as any,
    ...(status ? { status } : {}),
  },
});


  return NextResponse.json({
    ok: true,
    session: {
      id: updated.id,
      status: updated.status,
      payload: newPayload,
      updatedAt: updated.updatedAt,
    },
  });
}
