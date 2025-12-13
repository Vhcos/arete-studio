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

  // meta viene desde wizard / legacy / informe
  // y a veces viene con nesting raro (meta.meta...)
  meta?: any;

  reportId?: string | null;
  forceNew?: boolean; // opcional
};

function sameProject(a: any, b: any) {
  const norm = (x: any) => String(x ?? "").trim().toLowerCase();
  return (
    norm(a?.idea) === norm(b?.idea) &&
    norm(a?.rubro) === norm(b?.rubro) &&
    norm(a?.ubicacion) === norm(b?.ubicacion)
  );
}

/**
 * Extrae el informe/plan desde cualquier forma común en que venga `meta`.
 * Objetivo: dejar SIEMPRE una ruta simple para el backend:
 * payload.meta.iaReportRaw y payload.meta.aiPlan
 */
function extractReportAndPlan(meta: any): { iaReportRaw: any | null; aiPlan: any | null } {
  const iaReportRaw =
    meta?.iaReportRaw ??
    meta?.meta?.iaReportRaw ??
    meta?.report?.iaReportRaw ??
    meta?.reportRaw ??
    null;

  const aiPlan =
    meta?.aiPlan ??
    meta?.meta?.aiPlan ??
    meta?.plan ??
    meta?.meta?.plan ??
    null;

  return { iaReportRaw, aiPlan };
}

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
    forceNew = false,
  } = body;

  const reportId = reportIdRaw ?? null;

  console.log("[/api/funding-session/start] body recibido:", {
    idea,
    rubro,
    ubicacion,
    countryCode,
    source,
    reportId,
    forceNew,
    hasMeta: !!meta,
  });

  // ✅ extraer informe/plan desde meta (en cualquier forma)
  const { iaReportRaw, aiPlan } = extractReportAndPlan(meta);

  console.log("[/api/funding-session/start] informe/plan detectados:", {
    hasIaReportRaw: !!iaReportRaw,
    hasAiPlan: !!aiPlan,
    // si quieres, esto te ayuda a cachar nesting:
    metaKeys: meta && typeof meta === "object" ? Object.keys(meta).slice(0, 12) : null,
  });

  // Bloque de metadatos del proyecto
  // OJO: "meta" queda anidado en payload.meta.meta (lo mantenemos)
  // PERO además guardamos iaReportRaw/aiPlan en payload.meta.iaReportRaw / payload.meta.aiPlan
  const metaBlock = {
    idea: idea ?? null,
    rubro: rubro ?? null,
    ubicacion: ubicacion ?? null,
    countryCode,
    source,

    // ✅ “atajos” server-side (para drafts y para debug en Prisma)
    iaReportRaw: iaReportRaw ?? null,
    aiPlan: aiPlan ?? null,

    // ✅ mantenemos el meta original completo (por compatibilidad)
    meta: meta ?? null,

    // útil para debugging
    reportId: reportId ?? null,
  };

  // 3) Buscar si YA existe una FundingSession para este user (+ opcionalmente reportId)
  // Regla:
  // - Si viene reportId: reutiliza SOLO esa sesión
  // - Si NO viene reportId: reutiliza solo si el proyecto coincide (idea/rubro/ubicación)
  // - Si forceNew=true: nunca reutiliza
  let existing: any = null;

  if (!forceNew) {
    try {
      if (reportId) {
        existing = await prisma.fundingSession.findFirst({
          where: { userId, reportId },
        });
      } else {
        const candidate = await prisma.fundingSession.findFirst({
          where: { userId },
          orderBy: { updatedAt: "desc" as any }, // si tu modelo no tiene updatedAt, esto fallará
        });

        if (candidate) {
          const basePayload = (candidate.payload as any) ?? {};
          const baseMeta = basePayload?.meta ?? {};
          if (sameProject(baseMeta, metaBlock)) {
            existing = candidate;
          }
        }
      }
    } catch (err) {
      console.error(
        "[/api/funding-session/start] error buscando FundingSession existente:",
        err
      );
    }
  }

  // 4) Payload combinado (meta + steps)
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

  // 5) Si existe y corresponde reutilizar, actualizamos
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
      updated.id,
      {
        hasIaReportRaw: !!metaBlock.iaReportRaw,
        hasAiPlan: !!metaBlock.aiPlan,
      }
    );

    return NextResponse.json({
      ok: true,
      fundingSessionId: updated.id,
      debug: {
        hasIaReportRaw: !!metaBlock.iaReportRaw,
        hasAiPlan: !!metaBlock.aiPlan,
        reportId: reportId ?? null,
      },
    });
  }

  // 6) Si no existe, creamos una nueva
  const createData: any = {
    userId,
    clientId,
    creditsCharged: false,
    status: "draft",
    payload: payloadUpdate,
  };
  if (reportId) createData.reportId = reportId;

  const fs = await prisma.fundingSession.create({
    data: createData,
  });

  console.log("[/api/funding-session/start] FundingSession creada", fs.id, {
    userId,
    clientId,
    hasIaReportRaw: !!metaBlock.iaReportRaw,
    hasAiPlan: !!metaBlock.aiPlan,
    reportId,
  });

  return NextResponse.json({
    ok: true,
    fundingSessionId: fs.id,
    debug: {
      hasIaReportRaw: !!metaBlock.iaReportRaw,
      hasAiPlan: !!metaBlock.aiPlan,
      reportId: reportId ?? null,
    },
  });
}
