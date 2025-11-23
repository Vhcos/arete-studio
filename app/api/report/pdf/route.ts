// app/api/report/pdf/route.ts
import "server-only";
import { NextResponse } from "next/server";
import { renderReportEmailHtml } from "@/lib/renderReportHtml";
import puppeteer from "puppeteer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Convierte HTML en un Buffer de PDF usando Puppeteer.
 */
async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
        // con "domcontentloaded" cargamos más rápido y evitamos
       // quedarnos esperando requests de Next.js en dev
          waitUntil: "domcontentloaded",
    });


    const pdfUint8Array = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
    });

    // Convert Uint8Array to Buffer for compatibility
    const pdfBuffer = Buffer.from(pdfUint8Array);

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

/**
 * POST /api/report/pdf
 *
 * Espera un JSON con la misma forma que usas para el email:
 * { summary, preAI, report, aiPlan, user, viewUrl? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Usamos EXACTAMENTE el mismo helper que el correo
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

    // 👇 Aquí está el cambio clave: casteamos el Buffer a any
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="informe-aret3.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[report/pdf] Error generando PDF:", err);

    return NextResponse.json(
      {
        error:
          "Ocurrió un error generando el PDF del informe. Revisa los logs del servidor.",
      },
      { status: 500 }
    );
  }
}
