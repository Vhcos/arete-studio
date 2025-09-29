// app/api/plan/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tryDebitCredit, refundCredit } from "@/lib/credits";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Helper
function toJson<T>(s: string | null | undefined): T {
  if (!s) throw new Error("Respuesta vacía del modelo");
  try { return JSON.parse(s) as T; } catch { throw new Error("JSON inválido desde OpenAI"); }
}

/**
 * Espera algo como:
 * { input: { ... }, objetivo: "6w" }
 * Devuelve plan en JSON (100 palabras) + bullets.
 */
export async function POST(req: Request) {
  // 1) sesión y userId
  const session: any = await getServerSession(authOptions as any);
  const email = session?.user?.email as string | undefined;
  if (!email) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const requestId = body?.requestId || crypto.randomUUID();

  const u = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!u) {
    return new Response(JSON.stringify({ ok: false, error: "no_user" }), { status: 401 });
  }
  const userId = u.id; // 👈 usar en catch

  // 2) debitar (Opción A: 1 crédito por /api/plan)
  const DEBIT = Number(process.env.DEBIT_PER_PLAN ?? "1") || 1;
  const debit = await tryDebitCredit(userId, requestId, DEBIT);
  if (!(debit as any)?.ok) {
    return new Response(JSON.stringify({ ok: false, error: "no_credits" }), { status: 402 });
  }

  // 3) llamar a OpenAI
  try {
    const { input, objetivo = "6w" } = body;

    const system = [
      "Eres un asesor que arma un plan de acción conciso.",
      "Devuelves SOLO JSON con este shape:",
      `{
        "plan100": string,
        "bullets": string[]
      }`,
      "Nada fuera del JSON."
    ].join("\n");

    // evita sombrear 'u'/'user' de la DB
    const userMsg = [
      `Arma un plan de acción para ${objetivo}.`,
      "Contexto del negocio:",
      JSON.stringify(input)
    ].join("\n");

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
      // max_tokens: 600,
    });

    const content = completion.choices[0]?.message?.content ?? "";
    const data = toJson<{ plan100: string; bullets: string[] }>(content);

    return NextResponse.json({
      ok: true,
      data,
      usage: completion.usage,
      model: completion.model,
    });
  } catch (err: unknown) {
    // Reembolso si la IA falla
    await refundCredit(userId, requestId, Number(process.env.DEBIT_PER_PLAN ?? "1") || 1);
    const e = err as Error;
    console.error("[/api/plan] error:", e);
    return NextResponse.json({ ok: false, error: String(e.message ?? e) }, { status: 500 });
  }
}
