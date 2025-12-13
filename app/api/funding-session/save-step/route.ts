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

function getStepKey(raw: any): string {
  return raw && typeof raw === "string" && raw.trim() ? raw.trim() : "extra";
}

/**
 * GET /api/funding-session/save-step?sessionId=...&step=F6
 * Devuelve data = payload.steps[step]
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions).catch(() => null);
  const userId = (session as any)?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId") ?? "";
  const step = getStepKey(url.searchParams.get("step"));

  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "MISSING_SESSION_ID" }, { status: 400 });
  }

  const looksLikeInstrumentStep = (x: any) =>
    x &&
    typeof x === "object" &&
    typeof x.tipoInstrumento === "string" &&
    Array.isArray(x.institucionesPreferidas);

  const looksLikeLinksStep = (x: any) =>
    x &&
    typeof x === "object" &&
    (x.links || x.webUrl || x.deckUrl || x.videoUrl || x.instagramUrl || x.linkedinUrl);

  try {
    const fs = await prisma.fundingSession.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true, payload: true, updatedAt: true },
    });

    if (!fs || fs.userId !== userId) {
      return NextResponse.json({ ok: false, error: "SESSION_NOT_FOUND" }, { status: 404 });
    }

    const payload: any = (fs.payload as any) ?? {};
    const steps: any = payload.steps ?? {};

    // 1) lectura normal
    let data: any = steps?.[step] ?? null;

    // 2) compat renumeración: F6 (instrumento) antes vivía en F4
    if (!data && step === "F6" && looksLikeInstrumentStep(steps?.F4)) {
      data = { ...(steps.F4 as any), step: "F6" };
    }

    // 3) compat renumeración: F7 (links/drafts) antes vivía en F5
    if (!data && step === "F7" && looksLikeLinksStep(steps?.F5)) {
      data = { ...(steps.F5 as any), step: "F7" };
    }

    // 4) compat: si piden F7 y no hay step guardado, pero sí hay payload.drafts,
    // devolvemos un “F7 mínimo” para que el front rehidrate igual
    if (!data && step === "F7" && payload?.drafts) {
      data = {
        step: "F7",
        links: {
          webUrl: null,
          deckUrl: null,
          videoUrl: null,
          instagramUrl: null,
          linkedinUrl: null,
        },
        drafts: payload.drafts,
        draftsGeneratedAt: payload.draftsGeneratedAt ?? null,
      };
    }

    return NextResponse.json({
      ok: true,
      sessionId: fs.id,
      step,
      savedAt: fs.updatedAt,
      data,
      postulante: payload.postulante ?? null,
    });
  } catch (err) {
    console.error("[/api/funding-session/save-step][GET] Error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}


export async function POST(req: Request) {
  // 1) Sesión
  const session = await getServerSession(authOptions).catch(() => null);
  const userId = (session as any)?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  // 2) Body
  let body: SaveStepBody = {};
  try {
    body = (await req.json()) as SaveStepBody;
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const { sessionId, data } = body;

  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "MISSING_SESSION_ID" }, { status: 400 });
  }

  if (!data || typeof data !== "object") {
    return NextResponse.json({ ok: false, error: "MISSING_DATA" }, { status: 400 });
  }

  const stepKey = getStepKey((data as any)?.step);

  // ✅ Fuerza consistencia
  (data as any).step = stepKey;

  try {
    // 3) Buscar la sesión y validar dueño
    const fs = await prisma.fundingSession.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true, payload: true },
    });

    if (!fs || fs.userId !== userId) {
      return NextResponse.json({ ok: false, error: "SESSION_NOT_FOUND" }, { status: 404 });
    }

    // 4) Mezclar payload existente con el nuevo paso
    const existingPayload = ((fs.payload as any) ?? {}) || {};
    const existingSteps = (existingPayload.steps as any) ?? {};

    let newPayload: any = {
      ...existingPayload,
      steps: {
        ...existingSteps,
        [stepKey]: data,
      },
    };

    // 5) Si es F1, mantenemos también un bloque normalizado `postulante`
    if (stepKey === "F1") {
      const prevPostulante = (existingPayload.postulante as any) ?? {};
      const d: any = data || {};

      const tipoPostulante = d.tipoPostulante ?? prevPostulante.tipoPostulante ?? null;
      const countryCode = d.countryCode ?? prevPostulante.countryCode ?? null;

      const mergedPostulante = {
        ...prevPostulante,

        tipoPostulante,
        countryCode,

        // Persona natural
        nombreCompleto: d.nombreCompleto ?? prevPostulante.nombreCompleto ?? null,
        rut: d.rut ?? prevPostulante.rut ?? null,
        fechaNacimiento: d.fechaNacimiento ?? prevPostulante.fechaNacimiento ?? null,
        genero: d.genero ?? prevPostulante.genero ?? null,
        region: d.region ?? prevPostulante.region ?? null,
        comuna: d.comuna ?? prevPostulante.comuna ?? null,
        telefono:
          d.telefono ??
          d.telefonoContacto ??
          prevPostulante.telefono ??
          prevPostulante.telefonoContacto ??
          null,

        // Empresa
        razonSocial: d.razonSocial ?? prevPostulante.razonSocial ?? null,
        rutEmpresa: d.rutEmpresa ?? prevPostulante.rutEmpresa ?? null,
        fechaInicioActividades:
          d.fechaInicioActividades ?? prevPostulante.fechaInicioActividades ?? null,
        giroPrincipal: d.giroPrincipal ?? prevPostulante.giroPrincipal ?? null,
        representanteNombre: d.representanteNombre ?? prevPostulante.representanteNombre ?? null,
        representanteRut: d.representanteRut ?? prevPostulante.representanteRut ?? null,
        telefonoContacto: d.telefonoContacto ?? prevPostulante.telefonoContacto ?? null,
      };

      newPayload.postulante = mergedPostulante;
    }

    const updated = await prisma.fundingSession.update({
      where: { id: fs.id },
      data: {
        payload: newPayload,
      },
      select: {
        id: true,
        payload: true,
        updatedAt: true,
      },
    });

    console.log(
      "[/api/funding-session/save-step] Paso guardado",
      stepKey,
      "para sesión",
      updated.id
    );

    return NextResponse.json({
      ok: true,
      sessionId: updated.id,
      step: stepKey,
      savedAt: updated.updatedAt,
      data: (updated.payload as any)?.steps?.[stepKey] ?? null,
      postulante: (updated.payload as any)?.postulante ?? null,
    });
  } catch (err) {
    console.error("[/api/funding-session/save-step] Error actualizando FundingSession:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
