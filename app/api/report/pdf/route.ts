// app/api/report/pdf/route.ts
import "server-only";
import { NextResponse } from "next/server";
import { renderReportEmailHtml } from "@/lib/renderReportHtml";
import chromium from "@sparticuz/chromium-min";
import puppeteerCore, { type Browser } from "puppeteer-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lanza un navegador:
 * - En producción / Vercel: puppeteer-core + chromium-min (bin empaquetado)
 * - En local: puppeteer normal (Chrome local)
 */
async function launchBrowser(): Promise<Browser> {
  const isServerless =
    !!process.env.VERCEL || !!process.env.AWS_REGION || process.env.NODE_ENV === "production";

  if (isServerless) {
    const executablePath = await chromium.executablePath();

    if (!executablePath) {
      throw new Error("No se encontró executablePath de chromium en entorno serverless.");
    }

    return await puppeteerCore.launch({
      args: chromium.args,
      executablePath,
      headless: true,
      // 👇 nada más, sin defaultViewport ni ignoreHTTPSErrors
    });
  }

  // Modo local: usamos puppeteer completo (trae su propio Chrome)
  const puppeteerLocal = await import("puppeteer");
  return (await puppeteerLocal.default.launch({
    headless: true,
  })) as unknown as Browser;
}


/**
 * Convierte HTML en Buffer de PDF
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

