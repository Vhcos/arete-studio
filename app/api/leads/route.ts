export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let email = "";
    let source = "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      email = body?.email ?? "";
      source = body?.source ?? "";
    } else {
      const form = await req.formData();
      email = String(form.get("email") || "");
      source = String(form.get("source") || "");
    }

    if (!isEmail(email)) {
      return NextResponse.json({ ok: false, error: "EMAIL_INVALID" }, { status: 400 });
    }

    // idempotente por email
    await prisma.lead.upsert({
      where: { email },
      update: { source },
      create: { email, source },
    });

    // Redirige al sign-in con email prellenado
    const url = new URL(`/auth/sign-in`, req.url);
    url.searchParams.set("email", email);
    return NextResponse.redirect(url.toString(), { status: 303 });
  } catch (err) {
    console.error("POST /api/leads", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
