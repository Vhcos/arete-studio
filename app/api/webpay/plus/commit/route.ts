import { NextRequest, NextResponse } from "next/server";
import { getFinalUrl, webpayPlusCommit } from "@/lib/webpay";
import { grantCredits, incrementSessionEntitlement } from "@/lib/credits";

// Webpay retorna por POST (token_ws en form-data). Aceptamos también GET/JSON.
export async function POST(req: NextRequest) {
  try {
    let token = "";
    const ctype = req.headers.get("content-type") || "";
    if (ctype.includes("application/x-www-form-urlencoded") || ctype.includes("multipart/form-data")) {
      const fd = await req.formData();
      token = (fd.get("token_ws") ?? "").toString();
    } else {
      const url = new URL(req.url);
      token = (url.searchParams.get("token_ws") ?? "").toString();
      if (!token) {
        try { const body = await req.json(); token = (body?.token_ws ?? "").toString(); } catch {}
      }
    }
    if (!token) return NextResponse.json({ ok: false, error: "MISSING_TOKEN" }, { status: 400 });

    const data = await webpayPlusCommit(token);
    if (data.response_code !== 0) {
      // Rechazado / no autorizado
      return NextResponse.redirect(getFinalUrl(), { status: 302 });
    }

    const userId = data.session_id?.toString() || "";
    const buyOrder = data.buy_order?.toString() || "";
    if (!userId || !buyOrder) {
      return NextResponse.redirect(getFinalUrl(), { status: 302 });
    }

    // Idempotencia: token es único por transacción
    const requestId = `tbk:${token}`;

    try {
      if (buyOrder.startsWith("P200")) {
        await grantCredits(userId, requestId, 200);
      } else if (buyOrder.startsWith("ADD30")) {
        await incrementSessionEntitlement(userId, requestId, 1);
      }
    } catch (e) {
      console.error("grant credits error", e);
    }

    return NextResponse.redirect(getFinalUrl(), { status: 302 });
  } catch (err: any) {
    console.error("webpay commit error", err?.message || err);
    return NextResponse.redirect(getFinalUrl(), { status: 302 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
