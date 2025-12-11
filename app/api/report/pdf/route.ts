// app/api/report/pdf/route.ts
import "server-only";
import { NextResponse } from "next/server";
import { renderReportEmailHtml } from "@/lib/renderReportHtml";

import chromium from "@sparticuz/chromium";
import puppeteerCore, { type Browser } from "puppeteer-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Solo usamos chromium + puppeteer-core en entorno serverless real (Vercel prod / AWS)
function isServerlessRuntime() {
  const isProd = process.env.NODE_ENV === "production";
  const isVercel = process.env.VERCEL === "1";
  const isAws = !!process.env.AWS_REGION;
  return isProd && (isVercel || isAws);
}

/**
 * Lanza un navegador:
 * - En Vercel / serverless PROD: puppeteer-core + @sparticuz/chromium
 * - En local / dev: puppeteer normal (con Chrome que trae puppeteer)
 */
async function launchBrowser(): Promise<Browser> {
  if (isServerlessRuntime()) {
    const executablePath = await chromium.executablePath();

    if (!executablePath) {
      throw new Error(
        "chromium.executablePath() devolvió null/undefined en entorno serverless"
      );
    }

    const chromiumAny = chromium as any;

    return (await puppeteerCore.launch({
      args: chromium.args,
      executablePath,
      defaultViewport:
        chromiumAny.defaultViewport ?? { width: 1280, height: 720 },
      headless: chromiumAny.headless ?? true,
      ignoreHTTPSErrors: true,
    } as any)) as Browser;
  }

  // ---- Modo local / no serverless: puppeteer completo ----
  const puppeteer = (await import("puppeteer")).default;

  return await puppeteer.launch({
    headless: true,
  });
}

/**
 * Convierte HTML en un Buffer de PDF usando el navegador anterior.
 */
async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
    });

    const pdfUint8 = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
    });

    return Buffer.from(pdfUint8);
  } finally {
    await browser.close();
  }
}

/**
 * POST /api/report/pdf
 * Body esperado: { summary, preAI, report, aiPlan, user, viewUrl? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const html = renderReportEmailHtml({
      summary: body.summary,
      preAI: body.preAI,
      report: body?.report ?? null,
      aiPlan: body?.aiPlan ?? null,
      user: body?.user ?? {},
      viewUrl: body?.viewUrl,
    });

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "No se pudo generar el HTML del informe" },
        { status: 500 }
      );
    }

    const pdfBuffer = await htmlToPdfBuffer(html);

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="informe-aret3.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[pdf-report] error en servidor:", err);

    return NextResponse.json(
      {
        error:
          err?.message ||
          "Ocurrió un error generando el PDF del informe en el servidor.",
        stack: err?.stack || null,
      },
      { status: 500 }
    );
  }
}
