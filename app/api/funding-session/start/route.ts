// app/api/funding-session/start/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type FundingSessionPayloadInput = {
  idea?: string;
  rubro?: string;
  ubicacion?: string;
  countryCode?: string | null;
  source?: string;
  meta?: any;
  reportId?: string | null;
};

export async function POST(req: Request) {
  // 1) Sesión y userId
  const session = await getServerSession(authOptions).catch(() => null);
  const userId = (session as any)?.user?.id as string | undefined;
  const clientId = (session as any)?.user?.clientId ?? null;

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  // 2) Body
  let body: FundingSessionPayloadInput = {};
  try {
    body = (await req.json()) as FundingSessionPayloadInput;
  } catch {
    // body vacío si falla el parse
  }

  const {
    idea,
    rubro,
    ubicacion,
    countryCode = null,
    source = "evaluate",
    meta,
    reportId: reportIdRaw,
  } = body;

  const reportId = reportIdRaw ?? null;

  console.log("[/api/funding-session/start] body recibido:", body);

  // 3) Buscar si YA existe una FundingSession para este user (+ opcionalmente reportId)
  const existingWhere: any = { userId };
  if (reportId) existingWhere.reportId = reportId;

  let existing = null;
  try {
    existing = await prisma.fundingSession.findFirst({
      where: existingWhere,
    });
  } catch (err) {
    console.error(
      "[/api/funding-session/start] error buscando FundingSession existente:",
      err
    );
  }

  // Bloque de metadatos del proyecto (lo que viene del informe)
  const metaBlock = {
    idea: idea ?? null,
    rubro: rubro ?? null,
    ubicacion: ubicacion ?? null,
    countryCode,
    source,
    meta: meta ?? null,
  };

  // Payload combinado (meta + steps)
  const basePayload = (existing?.payload as any) ?? {};
  const prevSteps = basePayload.steps ?? {};

  const payloadUpdate = {
    ...basePayload,
    meta: {
      ...(basePayload.meta ?? {}),
      ...metaBlock,
    },
    steps: prevSteps,
  };

  // 4) Si existe, reutilizamos (NO cobramos de nuevo créditos)
  if (existing) {
    const updated = await prisma.fundingSession.update({
      where: { id: existing.id },
      data: {
        payload: payloadUpdate,
        status: existing.status ?? "draft",
      },
    });

    console.log(
      "[/api/funding-session/start] Reutilizando FundingSession existente",
      updated.id
    );

    return NextResponse.json({
      ok: true,
      fundingSessionId: updated.id,
    });
  }

  // 5) Si no existe, creamos una nueva
  const createData: any = {
    userId,
    clientId,
    creditsCharged: false, // lo cambiaremos a true cuando metamos créditos
    status: "draft",
    payload: payloadUpdate,
  };
  if (reportId) {
    createData.reportId = reportId;
  }

  const fs = await prisma.fundingSession.create({
    data: createData,
  });

  console.log("[/api/funding-session/start] FundingSession creada", fs.id, {
    userId,
    clientId,
  });

  return NextResponse.json({
    ok: true,
    fundingSessionId: fs.id,
  });
}
