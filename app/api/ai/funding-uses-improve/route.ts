// app/api/ai/funding-uses-improve/route.ts
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

// Mismos flags que idea-improve / advantage-improve
const SKIP_DEBIT = (process.env.SKIP_DEBIT_INTEL ?? "0") === "1";
const DEBIT =
  Number(process.env.DEBIT_PER_INTEL ?? process.env.DEBIT_PER_EVALUATE ?? "1") || 1;

type FundingUsesBody = {
  requestId?: string;
  current?: string;

  // inputs de F3
  montoSolicitado?: number | null;
  aportePropio?: number | null;
  capitalTrabajo?: number | null;
  totalInversion?: number | null;

  // contexto
  projectName?: string;
  idea?: string;
  ventajaTexto?: string;
  sectorId?: string;
  ubicacion?: string;
  plan?: any;
};

const fmtCLP = (n: number | null | undefined) =>
  typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("es-CL") : "(no especificado)";

function toNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function clampInt(n: number, min = 0) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.round(n));
}

function safeJsonParse(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    // intenta rescatar el primer objeto JSON dentro del texto
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const slice = text.slice(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch {
        return null;
      }
    }
    return null;
  }
}

type UsesItem = {
  concepto: string;
  monto: number;
  detalle?: string;
};

function distributeNegativeDiff(items: UsesItem[], diffNeg: number) {
  // diffNeg es negativo: hay que RESTAR |diffNeg| desde el final hacia atrás
  let remaining = Math.abs(diffNeg);

  for (let i = items.length - 1; i >= 0; i--) {
    const m = clampInt(items[i].monto, 0);
    if (m <= 0) continue;

    const take = Math.min(m, remaining);
    items[i].monto = m - take;
    remaining -= take;

    if (remaining <= 0) break;
  }

  // si no alcanzó, dejamos todo en 0 (no debería pasar si el target era sensato)
  if (remaining > 0) {
    for (let i = 0; i < items.length; i++) items[i].monto = clampInt(items[i].monto, 0);
  }
}

function buildBullets(items: UsesItem[]) {
  return items
    .filter((it) => it && it.concepto && typeof it.monto === "number")
    .map((it) => {
      const concepto = it.concepto.trim().replace(/\s+/g, " ");
      const detalle = (it.detalle ?? "").toString().trim();
      const montoTxt = fmtCLP(it.monto);
      return `- **${concepto}**: ${montoTxt} CLP${detalle ? ` para ${detalle}.` : "."}`;
    })
    .join("\n\n");
}

export async function POST(req: Request) {
  // 1) Sesión
  const session: any = await getServerSession(authOptions as any);
  const email = session?.user?.email as string | undefined;
  if (!email) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // 2) Inputs
  const body = (await req.json().catch(() => ({}))) as FundingUsesBody;

  const requestId = body?.requestId || crypto.randomUUID();
  const current = (body?.current ?? "").toString().trim();

  const montoSolicitado = toNumber(body?.montoSolicitado) ?? null;
  const aportePropio = toNumber(body?.aportePropio) ?? null;
  const capitalTrabajo = toNumber(body?.capitalTrabajo) ?? null;
  const totalInversion = toNumber(body?.totalInversion) ?? null;

  const projectName = (body?.projectName ?? "").toString().trim();
  const idea = (body?.idea ?? "").toString().trim();
  const ventajaTexto = (body?.ventajaTexto ?? "").toString().trim();
  const sectorId = (body?.sectorId ?? "").toString().trim();
  const ubicacion = (body?.ubicacion ?? "").toString().trim();
  const plan = body?.plan ?? null;

  // 3) userId
  const u = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!u) {
    return NextResponse.json({ ok: false, error: "no_user" }, { status: 401 });
  }
  const userId = u.id;

  // 4) Cobro de créditos
  if (!SKIP_DEBIT) {
    const debit = await tryDebitCredit(userId, requestId, DEBIT);
    if (!(debit as any)?.ok) {
      return NextResponse.json({ ok: false, error: "no_credits" }, { status: 402 });
    }
  }

  // 5) Elegir TOTAL OBJETIVO (para que la suma cierre)
  // Prioridad:
  //   a) totalInversion (si existe) -> describe el presupuesto total del proyecto
  //   b) montoSolicitado + aportePropio (si ambos existen)
  //   c) montoSolicitado
  const targetTotal =
    (totalInversion ?? 0) > 0
      ? clampInt(totalInversion!)
      : (montoSolicitado ?? 0) > 0 && (aportePropio ?? 0) > 0
        ? clampInt((montoSolicitado ?? 0) + (aportePropio ?? 0))
        : clampInt(montoSolicitado ?? 0);

  // capitalTrabajo no puede exceder el total objetivo
  const capitalTrabajoFixed =
    (capitalTrabajo ?? 0) > 0 ? Math.min(clampInt(capitalTrabajo!), targetTotal) : 0;

  const restante = Math.max(0, targetTotal - capitalTrabajoFixed);

  // 6) IA -> JSON de items (nosotros forzamos que la suma cierre)
  try {
    const system = [
      "Eres experto en formulación de proyectos y postulación a fondos públicos (Corfo, Sercotec, fondos municipales).",
      "Redactas la sección: “¿En qué usarías principalmente estos fondos?” para evaluadores.",
      "",
      "REGLAS OBLIGATORIAS:",
      "1) Responde SOLO con JSON válido (sin markdown, sin texto extra).",
      "2) Debes devolver entre 3 y 6 ítems.",
      "3) Cada ítem debe tener: concepto (string), monto (integer CLP), detalle (string corto).",
      "4) La suma de los montos DEBE ser EXACTAMENTE igual al total objetivo entregado.",
      "5) Si te dan capital de trabajo, el PRIMER ítem debe ser “Capital de trabajo” con ese monto (o muy cercano si el total no alcanza).",
      "6) No inventes categorías raras; usa: capital de trabajo, marketing, equipamiento, tecnología/plataforma, formalización/legal, capacitación, etc.",
    ].join("\n");

    const context: string[] = [];
    context.push(`Total objetivo a distribuir (CLP): ${fmtCLP(targetTotal)}.`);
    if (capitalTrabajoFixed > 0) {
      context.push(`Capital de trabajo (primer ítem, CLP): ${fmtCLP(capitalTrabajoFixed)}.`);
      context.push(`Monto restante a distribuir (CLP): ${fmtCLP(restante)}.`);
    }
    if (montoSolicitado) context.push(`Monto solicitado (CLP): ${fmtCLP(montoSolicitado)}.`);
    if (aportePropio !== null && aportePropio !== undefined)
      context.push(`Aporte propio (CLP): ${fmtCLP(aportePropio)}.`);
    if (totalInversion) context.push(`Inversión total estimada (CLP): ${fmtCLP(totalInversion)}.`);

    if (projectName) context.push(`Proyecto: ${projectName}.`);
    if (idea) context.push(`Idea: ${idea}.`);
    if (ventajaTexto) context.push(`Ventaja: ${ventajaTexto}.`);
    if (sectorId) context.push(`Sector: ${sectorId}.`);
    if (ubicacion) context.push(`Ubicación: ${ubicacion}.`);
    if (current) context.push(`Texto actual del usuario (si sirve como base):\n${current}`);

    if (plan) {
      context.push(
        `Plan financiero (JSON resumido, puede ayudar a priorizar):\n${JSON.stringify(plan, null, 2)}`
      );
    }

    context.push(
      [
        "FORMATO JSON EXACTO:",
        "{",
        '  "items": [',
        '    { "concepto": "Capital de trabajo", "monto": 123, "detalle": "..." },',
        '    { "concepto": "Marketing digital y lanzamiento", "monto": 123, "detalle": "..." }',
        "  ]",
        "}",
      ].join("\n")
    );

    const userMsg = context.join("\n\n");

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const raw = completion.choices?.[0]?.message?.content?.toString().trim() ?? "";
    if (!raw) {
      if (!SKIP_DEBIT) await refundCredit(userId, requestId, DEBIT);
      return NextResponse.json({ ok: false, error: "sin_contenido" }, { status: 500 });
    }

    const parsed = safeJsonParse(raw);

    // Fallback a texto si no pudimos parsear
    if (!parsed || !Array.isArray(parsed.items)) {
      // igual devolvemos lo que vino para no bloquear al usuario
      return NextResponse.json({
        ok: true,
        usos: raw,
        debited: !SKIP_DEBIT ? DEBIT : 0,
        model: completion.model,
        usage: completion.usage ?? null,
      });
    }

    // Normaliza items
    let items: UsesItem[] = parsed.items
      .map((it: any) => ({
        concepto: (it?.concepto ?? "").toString(),
        monto: clampInt(toNumber(it?.monto) ?? 0, 0),
        detalle: (it?.detalle ?? "").toString(),
      }))
      .filter((it: { concepto: any; monto: number; }) => it.concepto && it.monto >= 0);

    // asegura 3..6
    if (items.length < 3) {
      // si vino muy corto, armamos una base mínima
      items = [
        { concepto: "Capital de trabajo", monto: capitalTrabajoFixed, detalle: "insumos, sueldos y gastos fijos iniciales" },
        { concepto: "Marketing digital y lanzamiento", monto: clampInt(restante * 0.35), detalle: "campañas, contenido y anuncios" },
        { concepto: "Equipamiento básico y mejoras", monto: 0, detalle: "herramientas, acondicionamiento y mejoras operativas" },
      ];
    }
    if (items.length > 6) items = items.slice(0, 6);

    // fuerza primer ítem capital trabajo si aplica
    if (capitalTrabajoFixed > 0) {
      items[0] = {
        concepto: "Capital de trabajo",
        monto: capitalTrabajoFixed,
        detalle:
          items[0]?.detalle?.trim() ||
          "insumos, sueldos y gastos fijos durante los primeros meses",
      };
    }

    // Ajusta suma exacta al target
    const sum = items.reduce((acc, it) => acc + clampInt(it.monto, 0), 0);
    let diff = targetTotal - sum;

    if (diff !== 0) {
      // preferimos ajustar el último ítem (siempre)
      const last = items[items.length - 1];
      const newLast = clampInt((last?.monto ?? 0) + diff, 0);
      items[items.length - 1] = { ...last, monto: newLast };

      // recalcula y si quedó pasado (por clamp a 0), distribuimos hacia atrás
      const sum2 = items.reduce((acc, it) => acc + clampInt(it.monto, 0), 0);
      const diff2 = targetTotal - sum2;
      if (diff2 < 0) {
        distributeNegativeDiff(items, diff2); // resta hasta cerrar
      } else if (diff2 > 0) {
        // agrega lo que falta al último ítem
        items[items.length - 1].monto = clampInt(items[items.length - 1].monto + diff2, 0);
      }
    }

    const finalSum = items.reduce((acc, it) => acc + clampInt(it.monto, 0), 0);

    const bullets = buildBullets(items);

    return NextResponse.json({
      ok: true,
      usos: bullets,
      targetTotal,
      sum: finalSum,
      debited: !SKIP_DEBIT ? DEBIT : 0,
      model: completion.model,
      usage: completion.usage ?? null,
    });
  } catch (err: any) {
    if (!SKIP_DEBIT) {
      await refundCredit(userId, requestId, DEBIT);
    }
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
