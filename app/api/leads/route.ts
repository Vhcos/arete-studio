// apps/marketing_clean/app/api/leads/route.ts
import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

function isEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let email = "";
    let source = "";
    let utmSource = "";
    let utmMedium = "";
    let utmCampaign = "";
    const ip =
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for") ??
      "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      email = body?.email ?? "";
      source = body?.source ?? "";
      utmSource = body?.utmSource ?? "";
      utmMedium = body?.utmMedium ?? "";
      utmCampaign = body?.utmCampaign ?? "";
    } else {
      const form = await req.formData();
      email = String(form.get("email") || "");
      source = String(form.get("source") || "");
      utmSource = String(form.get("utmSource") || "");
      utmMedium = String(form.get("utmMedium") || "");
      utmCampaign = String(form.get("utmCampaign") || "");
    }

    if (!isEmail(email)) {
      return NextResponse.json({ ok: false, error: "EMAIL_INVALID" }, { status: 400 });
    }

    // Idempotente por email+source (usa el @@unique "email_source")
    await prisma.lead.upsert({
      where: { email_source: { email, source } },
      update: { utmSource, utmMedium, utmCampaign, ip, userAgent: req.headers.get("user-agent") ?? "" },
      create: { email, source, utmSource, utmMedium, utmCampaign, ip, userAgent: req.headers.get("user-agent") ?? "" },
    });

    // (opcional) redirigir al sign-in con email prellenado
    const url = new URL("/auth/sign-in", req.url);
    url.searchParams.set("email", email);
    return NextResponse.redirect(url.toString(), { status: 303 });
  } catch (err) {
    console.error("POST /api/leads", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
