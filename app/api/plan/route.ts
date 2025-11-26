// app/api/plan/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tryDebitCredit, refundCredit } from "@/lib/credits";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1";

// Helper
function toJson<T>(s: string | null | undefined): T {
  if (!s) throw new Error("Respuesta vacía del modelo");
  try {
    return JSON.parse(s) as T;
  } catch {
    throw new Error("JSON inválido desde OpenAI");
  }
}

/**
 * Espera algo como:
 * { input: { ... }, objetivo: "6w" }
 * Devuelve plan en JSON (100 palabras) + bullets.
 */
export async function POST(req: Request) {
  // 1) sesión y userId
  const session: any = await getServerSession(authOptions as any);

  const userId = session?.user?.id as string | undefined;
  const clientId = (session?.user as any)?.clientId as string | null | undefined;

  if (!userId) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
    });
  }

  const body = await req.json().catch(() => ({}));
  const requestId = body?.requestId || crypto.randomUUID();


  // 2) debitar (Opción A: 1 crédito por /api/plan)
  const DEBIT = Number(process.env.DEBIT_PER_PLAN ?? "1") || 1;
  const debit = await tryDebitCredit(userId, requestId, DEBIT);
  if (!(debit as any)?.ok) {
    return new Response(
      JSON.stringify({ ok: false, error: "no_credits" }),
      { status: 402 }
    );
  }

  // 3) llamar a OpenAI
  try {
    const { input = {}, objetivo = "6w" } = body ?? {};

    // ---------- País / ubicación ----------
    const rawCountryCode = body?.country ?? body?.pais;
    let countryCode =
      rawCountryCode && String(rawCountryCode).trim() !== ""
        ? String(rawCountryCode).toUpperCase()
        : "";

    const ubicRaw =
      (input as any)?.ubicacion ||
      (input as any)?.ubicacionTexto ||
      (input as any)?.ubicacionEs ||
      "";

    const loc = String(ubicRaw || "").toLowerCase();

    // Inferir país desde la ubicación si no vino country/pais
    if (!countryCode) {
      if (
        loc.includes("colombia") ||
        loc.includes("medellín") ||
        loc.includes("medellin") ||
        loc.includes("bogotá") ||
        loc.includes("bogota")
      ) {
        countryCode = "CO";
      } else if (
        loc.includes("méxico") ||
        loc.includes("mexico") ||
        loc.includes("cdmx") ||
        loc.includes("ciudad de méxico")
      ) {
        countryCode = "MX";
      } else if (
        loc.includes("argentina") ||
        loc.includes("buenos aires") ||
        loc.includes("cordoba") ||
        loc.includes("córdoba")
      ) {
        countryCode = "AR";
      } else if (
        loc.includes("perú") ||
        loc.includes("peru") ||
        loc.includes("lima")
      ) {
        countryCode = "PE";
      } else if (loc.includes("uruguay") || loc.includes("montevideo")) {
        countryCode = "UY";
      } else if (
        loc.includes("paraguay") ||
        loc.includes("asunción") ||
        loc.includes("asuncion")
      ) {
        countryCode = "PY";
      } else if (
        loc.includes("bolivia") ||
        loc.includes("la paz") ||
        loc.includes("santa cruz")
      ) {
        countryCode = "BO";
      } else if (
        loc.includes("ecuador") ||
        loc.includes("quito") ||
        loc.includes("guayaquil")
      ) {
        countryCode = "EC";
      } else if (loc.includes("chile") || loc.includes("santiago")) {
        countryCode = "CL";
      }
    }

    if (!countryCode) {
      countryCode = "CL"; // fallback duro
    }

    const COUNTRY_NAMES: Record<string, string> = {
      CL: "Chile",
      CO: "Colombia",
      MX: "México",
      AR: "Argentina",
      PE: "Perú",
      UY: "Uruguay",
      PY: "Paraguay",
      BO: "Bolivia",
      EC: "Ecuador",
    };

    const countryName =
      COUNTRY_NAMES[countryCode] ||
      `tu país o región objetivo (${countryCode})`;

    const ubicacionTexto =
      String(ubicRaw || "").trim() || `una ciudad de ${countryName}`;

    const system = [
      "Eres un asesor que arma un plan de acción conciso EN ESPAÑOL.",
      `Contexto geográfico: el negocio opera en ${countryName}.`,
      `Ubicación específica del proyecto: ${ubicacionTexto}.`,
      "Cuando hables de competencia y regulación, céntrate en la realidad de ese país y esa ciudad.",
      "Si el país objetivo no es Chile, no hables de Chile ni uses Chile como caso por defecto.",
      "Devuelves SOLO JSON con este shape:",
      `{
  "plan100": string,
  "bullets": string[],
  "competencia": string[],
  "regulacion": string[]
}`,
      "Reglas:",
      "- Nada fuera del JSON.",
      "- No inventes datos numéricos que no estén en el contexto.",
      "- En 'plan100' menciona explícitamente el país y la ciudad objetivo (por ejemplo, 'en Medellín, Colombia').",
      "- 'bullets' deben ser SEMANALES (no meses): etiqueta cada ítem como 'Semana N: …'.",
    ].join("\n");

    const userMsg = [
      `Arma un plan de acción para ${objetivo}.`,
      `El negocio está pensado para operar en ${countryName}, específicamente en ${ubicacionTexto}.`,
      "Contexto del negocio (usa solo lo que veas aquí, no inventes estructura nueva):",
      JSON.stringify(
        { countryCode, countryName, ubicacion: ubicacionTexto, input },
        null,
        2
      ),
    ].join("\n");

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "";
    let data: any = toJson<any>(content);

    // Normalización: aceptar variantes EN y forzar arrays
    data.competencia = Array.isArray(data?.competencia)
      ? data.competencia
      : Array.isArray(data?.competition)
      ? data.competition
      : [];
    data.regulacion = Array.isArray(data?.regulacion)
      ? data.regulacion
      : Array.isArray(data?.regulation)
      ? data.regulation
      : [];

    // Asegura 6 bullets y las etiqueta SEMANA 1..6
        // Asegura 6 bullets y las etiqueta SEMANA 1..6
    if (Array.isArray(data?.bullets)) {
      data.bullets = data.bullets
        .filter(Boolean)
        .slice(0, 6)
        .map((t: any, i: number) => {
          let s = String(t || "")
            .trim()
            .replace(/^semana\s*\d+:\s*/i, "")
            .replace(/^mes(es)?\s*\d+:\s*/i, "")
            .replace(/^m\s*\d+[:\-]\s*/i, "")
            .replace(/^m\d+[:\-]\s*/i, "")
            .replace(/^paso\s*\d+:\s*/i, "")
            .replace(/^\d+[\.\-:]\s*/, "");
          return `Semana ${i + 1}: ${s}`;
        });
    }

    // Guardar informe tipo “plan” si el usuario pertenece a un cliente
    if (clientId) {
      try {
        const projectName =
          (input as any)?.ideaName ??
          (input as any)?.nombre ??
          (input as any)?.name ??
          null;

        const summary =
          typeof data?.plan100 === "string"
            ? data.plan100.slice(0, 400)
            : null;

        await prisma.report.create({
          data: {
            clientId,
            userId,
            projectName,
            kind: "plan",
            summary,
            driveFileId: null,
          },
        });
      } catch (e) {
        console.error("[/api/plan] error al crear Report:", e);
      }
    }

    return NextResponse.json({
      ok: true,
      data,
      usage: completion.usage,
      model: completion.model,
    });


  } catch (err: unknown) {
    // Reembolso si la IA falla
    await refundCredit(
      userId,
      requestId,
      Number(process.env.DEBIT_PER_PLAN ?? "1") || 1
    );
    const e = err as Error;
    console.error("[/api/plan] error:", e);
    return NextResponse.json(
      { ok: false, error: String(e.message ?? e) },
      { status: 500 }
    );
  }
}
