//app/api/funding-session/[sessionId]/drafts-from-report/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** JsonValue-safe: normaliza a objeto plano */
function asObject(v: unknown): Record<string, any> {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, any>;
  return {};
}

/** Si viene como string JSON, intenta parsearlo */
function maybeParseJson(v: any): any {
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (!s) return v;
  // heurística simple: solo intentamos si parece JSON
  if (!(s.startsWith("{") || s.startsWith("["))) return v;
  try {
    return JSON.parse(s);
  } catch {
    return v;
  }
}

function firstDefined<T>(...vals: T[]): T | undefined {
  for (const v of vals) if (v !== null && v !== undefined) return v;
  return undefined;
}

/** Convierte algo “section-ish” en texto usable */
function toText(v: any): string {
  if (typeof v === "string") {
    const t = v.trim();
    return t.length ? t : "[completar]";
  }
  if (v === null || v === undefined) return "[completar]";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  // Si es objeto/array: mejor algo legible que reventar
  try {
    const s = JSON.stringify(v, null, 2);
    return s && s !== "{}" && s !== "[]" ? s : "[completar]";
  } catch {
    return "[completar]";
  }
}

export async function POST(
  _req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    // 1) Auth
    const session = await getServerSession(authOptions).catch(() => null);
    const userId = (session as any)?.user?.id as string | undefined;

    if (!userId) {
      return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });
    }

    // 2) Load FundingSession
    const fundingSession = await prisma.fundingSession.findFirst({
      where: { id: params.sessionId, userId },
      select: { id: true, payload: true },
    });

    if (!fundingSession) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    // 3) Payload safe + encontrar iaReportRaw con tolerancia a nesting
    const payloadObj = asObject(fundingSession.payload);
    const metaObj = asObject((payloadObj as any).meta);
    const dataObj = asObject((payloadObj as any).data);

    const rawCandidate = firstDefined(
      (payloadObj as any).iaReportRaw,
      (metaObj as any).iaReportRaw,
      (metaObj as any).data?.iaReportRaw,
      (dataObj as any).iaReportRaw
    );

    const raw = maybeParseJson(rawCandidate);
    const rawObj = asObject(raw);

    // 4) sections (también tolerante a raw.data.sections)
    const sectionsCandidate = firstDefined(
      (rawObj as any).sections,
      (rawObj as any).data?.sections
    );

    const sectionsParsed = maybeParseJson(sectionsCandidate);
    const sections = asObject(sectionsParsed);

    if (!Object.keys(sections).length) {
      return NextResponse.json({ ok: false, error: "NO_REPORT" }, { status: 400 });
    }

    // 5) Map a FundingDrafts (sin IA)
    const drafts = {
      resumen_ejecutivo: toText((sections as any).finalVerdict),
      descripcion_negocio_y_producto: toText((sections as any).industryBrief),
      problema_y_oportunidad: toText((sections as any).swotAndMarket),
      propuesta_valor_y_solucion: toText((sections as any).competitionLocal),
      mercado_y_clientes_objetivo: toText((sections as any).swotAndMarket), // temporal
      traccion_y_estado_actual: "[completar según F2]",
      modelo_de_negocio_y_ingresos: "[completar según plan]",
      monto_y_uso_de_fondos: "[completar según F3]",
      impacto_y_resultados_esperados: "[completar según F4]",
      equipo_y_capacidades: "[completar según F5]",
    };

    return NextResponse.json({ ok: true, drafts }, { status: 200 });
  } catch (err: any) {
    console.error("[drafts-from-report] error", err);
    // Importante: SIEMPRE JSON (evita “Respuesta no-JSON…”)
    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL",
        message: err?.message ? String(err.message) : "Unknown error",
      },
      { status: 500 }
    );
  }
}
