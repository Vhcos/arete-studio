// app/api/funding-session/[sessionId]/drafts/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { tryDebitCredit, refundCredit } from "@/lib/credits";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1";

// --- helpers ---

export type FundingDrafts = {
  resumen_ejecutivo: string;
  descripcion_negocio_y_producto: string;
  problema_y_oportunidad: string;
  propuesta_valor_y_solucion: string;
  mercado_y_clientes_objetivo: string;
  traccion_y_estado_actual: string;
  modelo_de_negocio_y_ingresos: string;
  monto_y_uso_de_fondos: string;
  impacto_y_resultados_esperados: string;
  equipo_y_capacidades: string;
};

function toJson<T>(s: string | null | undefined): T {
  if (!s) throw new Error("Respuesta vacía del modelo");
  try {
    return JSON.parse(s) as T;
  } catch {
    throw new Error("JSON inválido desde OpenAI");
  }
}

function buildPrompt(info: any) {
  return `
Eres un experto en postulación a fondos, subsidios y créditos para emprendedores en Latinoamérica.

Con la información que sigue (informe aret3 + respuestas F1–F4), debes preparar borradores de texto listos para copiar/pegar en formularios de Sercotec, Corfo, fondos municipales y bancos.

Entrega la respuesta **únicamente** como un JSON con esta estructura EXACTA:

{
  "resumen_ejecutivo": "texto...",
  "descripcion_negocio_y_producto": "texto...",
  "problema_y_oportunidad": "texto...",
  "propuesta_valor_y_solucion": "texto...",
  "mercado_y_clientes_objetivo": "texto...",
  "traccion_y_estado_actual": "texto...",
  "modelo_de_negocio_y_ingresos": "texto...",
  "monto_y_uso_de_fondos": "texto...",
  "impacto_y_resultados_esperados": "texto...",
  "equipo_y_capacidades": "texto..."
}

Definiciones de cada bloque (piensa en formularios reales de Sercotec, Corfo y bancos):

- "resumen_ejecutivo": síntesis del proyecto considerando problema que resuelve, solución, a quién va dirigida, dónde opera, tamaño de mercado aproximado y cómo piensa comercializar. Es el texto que se pega en el campo "Resumen Ejecutivo".
- "descripcion_negocio_y_producto": descripción clara del negocio y del producto/servicio (qué es, qué hace, cómo funciona, formato de venta).
- "problema_y_oportunidad": explicación del problema o necesidad que existe en el mercado y la oportunidad asociada (territorio donde ocurre, por qué es relevante resolverlo).
- "propuesta_valor_y_solucion": cómo la solución propuesta resuelve ese problema, cuáles son sus atributos diferenciadores frente a la competencia y por qué el cliente la elegiría.
- "mercado_y_clientes_objetivo": descripción del mercado objetivo, tipo de clientes, dónde están, tamaño del mercado, tendencias básicas y competencia relevante.
- "traccion_y_estado_actual": estado de avance del negocio (idea, prototipo, primeras ventas, ventas constantes) e indicadores de tracción (ventas últimos 12 meses, número de clientes, hitos logrados).
- "modelo_de_negocio_y_ingresos": cómo gana plata el negocio (modelo de ingresos principal, precios o rangos, márgenes aproximados si existen, canales de venta y de adquisición de clientes).
- "monto_y_uso_de_fondos": monto de financiamiento solicitado, aporte propio si existe y en qué se usará el dinero (principales ítems de gasto), en un relato coherente con las cifras entregadas.
- "impacto_y_resultados_esperados": resultados comerciales esperados durante el proyecto (ventas, clientes, cobertura, etc.) e impacto positivo esperado (social, ambiental o económico) en el territorio.
- "equipo_y_capacidades": resumen de quiénes lideran el proyecto, sus capacidades principales y por qué están preparados para ejecutarlo.

Reglas generales:
- Idioma: español neutro, cercano pero profesional.
- No adornes en exceso ni vendas humo: escribe de forma realista y concreta.
- Máximo ~200–250 palabras por bloque.
- NO inventes montos numéricos que no aparezcan en los datos. Si faltan cifras, usa frases como "[completar con datos de ventas]" o "[completar con monto exacto]".
- NO inventes experiencia del equipo ni títulos que no se desprendan de la información.
- Si falta información para un bloque (por ejemplo, equipo, impacto o resultados esperados), incluye frases como "[completar con experiencia del equipo]" o "[completar con indicadores de impacto]" en el texto.
- No mezcles proyectos antiguos: usa solo lo que viene en el JSON de abajo.

Datos del proyecto y del postulante (JSON):
${JSON.stringify(info, null, 2)}
`;
}

// --- handler principal ---

export async function POST(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  const session = await getServerSession(authOptions).catch(() => null);
  const userId = (session as any)?.user?.id as string | undefined;
  const clientId = (session as any)?.user?.clientId ?? null;

  if (!userId) {
    return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });
  }

  const fundingSession = await prisma.fundingSession.findFirst({
    where: { id: params.sessionId, userId },
  });

  if (!fundingSession) {
    return NextResponse.json(
      { ok: false, error: "FUNDING_SESSION_NOT_FOUND" },
      { status: 404 }
    );
  }

  let creditTxId: string | null = null;

  try {
    // 1) Cobro de 1 crédito por generar borradores de financiamiento
    const credit = await tryDebitCredit(
      userId,
      `funding_drafts:${fundingSession.id}`,
      1
    );

    if (!credit.ok) {
      return NextResponse.json(
        { ok: false, error: "no_credits" },
        { status: 402 }
      );
    }

    creditTxId = `funding_drafts:${fundingSession.id}`;

    // 2) Preparamos payload para IA
    const payload: any = fundingSession.payload ?? {};
    const steps: any = payload.steps ?? {};

    const info = {
      proyecto: {
        idea: payload.idea ?? null,
        rubro: payload.rubro ?? null,
        ubicacion: payload.ubicacion ?? null,
        countryCode: payload.countryCode ?? null,
      },
      informe: payload.iaReportRaw ?? null,
      plan: payload.aiPlan ?? null,
      pasos: {
        F1: steps.F1 ?? null,
        F2: steps.F2 ?? null,
        F3: steps.F3 ?? null,
        F4: steps.F4 ?? null,
      },
      meta: payload.meta ?? null,
      clientId,
      reportId: payload.reportId ?? null,
    };

    const prompt = buildPrompt(info);

    // 3) Llamada a OpenAI
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "Eres un redactor experto en formularios de financiamiento público y bancario en Latinoamérica.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content;
    const drafts = toJson<FundingDrafts>(raw);

    // 4) Guardamos los borradores dentro de payload.drafts
    const currentPayload: any = fundingSession.payload ?? {};
    const newPayload: any = {
      ...currentPayload,
      drafts,
    };

    await prisma.fundingSession.update({
      where: { id: fundingSession.id },
      data: {
        payload: newPayload as any,
      },
    });

    return NextResponse.json({
      ok: true,
      drafts,
    });
  } catch (err) {
    console.error("[/api/funding-session/:id/drafts] error:", err);

    if (creditTxId) {
      try {
        await refundCredit(userId, `funding_drafts:${fundingSession.id}`, 1);
      } catch (e) {
        console.error("Error al revertir crédito de funding_drafts:", e);
      }
    }

    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
