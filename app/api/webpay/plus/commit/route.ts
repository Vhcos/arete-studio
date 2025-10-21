// app/api/webpay/plus/commit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { webpayPlusCommit, packPriceClp, addonPriceClp } from "@/lib/webpay";
import { grantCredits, incrementSessionEntitlement } from "@/lib/credits";

// ---- helpers de URL de salida ----
function successBaseUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://app.aret3.cl";
  return process.env.WEBPAY_FINAL_URL || new URL("/billing/success", base).toString();
}
function withStatus(
  status: "approved" | "rejected" | "cancelled",
  extra?: Record<string, string | number>
) {
  const u = new URL(successBaseUrl());
  u.searchParams.set("status", status);
  if (extra) Object.entries(extra).forEach(([k, v]) => u.searchParams.set(k, String(v)));
  return u.toString();
}
function getCancelUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://app.aret3.cl";
  return new URL("/billing/cancel", base).toString();
}

export async function POST(req: NextRequest) {
  try {
    let token = "";
    const ctype = req.headers.get("content-type") || "";
    const url = new URL(req.url);

    // 1) Cancelación/back: Webpay vuelve con TBK_TOKEN (sin token_ws)
    const tbkToken = url.searchParams.get("TBK_TOKEN");
    if (tbkToken && !url.searchParams.get("token_ws")) {
      return NextResponse.redirect(withStatus("cancelled"), { status: 302 });
    }

    // 2) Éxito: Webpay hace POST con token_ws en form-data (aceptamos GET/JSON también)
    if (ctype.includes("application/x-www-form-urlencoded") || ctype.includes("multipart/form-data")) {
      const fd = await req.formData();
      token = (fd.get("token_ws") ?? "").toString();
    } else {
      token = (url.searchParams.get("token_ws") ?? "").toString();
      if (!token) {
        try {
          const body = await req.json();
          token = (body?.token_ws ?? "").toString();
        } catch { /* ignore */ }
      }
    }

    // Si no hay token_ws y no fue TBK_TOKEN, tratamos como cancelado
    if (!token) {
      return NextResponse.redirect(withStatus("cancelled"), { status: 302 });
    }

    const GRANT_IN_INTEGRATION = process.env.GRANT_IN_INTEGRATION === "1";

    // 3) MODO MOCK (tokens "mock..." simulan aprobación)
    if (token.startsWith("mock")) {
      const isPack = token.startsWith("mockP200_");
      const isAddon = token.startsWith("mockADD30_");
      const userIdMock = token.split("_")[1] || "";

      if (!userIdMock || (!isPack && !isAddon)) {
        return NextResponse.redirect(withStatus("rejected"), { status: 302 });
      }

      const requestId = `tbk:${token}:${isPack ? "P200" : "A30"}`;
      try {
        if (isPack) await grantCredits(userIdMock, requestId, 200);
        if (isAddon) await incrementSessionEntitlement(userIdMock, requestId, 1);
      } catch (e) {
        console.error("[webpay:commit:mock-grant:error]", e);
      }
      return NextResponse.redirect(withStatus("approved", { product: isPack ? "P200" : "A30" }), { status: 302 });
    }

    // 4) FLUJO REAL: PUT /transactions/{token_ws}
    const commit = await webpayPlusCommit(token);
    const {
      response_code,     // 0 = autorizado
      status,            // "AUTHORIZED"
      amount,            // CLP devuelto
      buy_order,         // ej: "P200..." o "ADD30..."
      session_id,        // userId
    } = commit as any;

    // Resultado de autorización
    const authorized = response_code === 0 || status === "AUTHORIZED";
    if (!authorized) {
      return NextResponse.redirect(withStatus("rejected"), { status: 302 });
    }

    // Campos mínimos
    const userId = session_id?.toString() || "";
    const buyOrderStr = buy_order?.toString() || "";
    if (!userId || !buyOrderStr) {
      console.error("[webpay:commit] missing fields", { hasUser: !!userId, hasOrder: !!buyOrderStr });
      return NextResponse.redirect(withStatus("rejected"), { status: 302 });
    }

    // Deducción de producto + validación de monto
    let product: "pack-200" | "addon_session_30m";
    let expectedAmount = 0;
    let code: "P200" | "A30";

    if (buyOrderStr.startsWith("P200")) {
      product = "pack-200";
      code = "P200";
      expectedAmount = packPriceClp();
    } else if (buyOrderStr.startsWith("ADD30")) {
      product = "addon_session_30m";
      code = "A30";
      expectedAmount = addonPriceClp();
    } else {
      console.error("[webpay:commit] unknown buy_order prefix", { buyOrder: buyOrderStr });
      return NextResponse.redirect(withStatus("rejected"), { status: 302 });
    }

    if (Number(amount) !== Number(expectedAmount)) {
      console.error("[webpay:commit:monto-mismatch]", { amount, expectedAmount, product, buyOrder: buyOrderStr });
      return NextResponse.redirect(withStatus("rejected"), { status: 302 });
    }

    // Idempotencia
    const requestId = `tbk:${token}:${code}`;

    // Otorgamiento sólo en prod (o si habilitas GRANT_IN_INTEGRATION)
    const env = (process.env.TBK_ENV || "").toLowerCase();
    const isProd = env === "production" || env === "live";

    try {
      if (isProd || GRANT_IN_INTEGRATION) {
        if (product === "pack-200") {
          await grantCredits(userId, requestId, 200);
        } else {
          await incrementSessionEntitlement(userId, requestId, 1);
        }
        console.info("[webpay:commit:granted]", { userId, product, amount, requestId });
      } else {
        console.info("[webpay:commit:integration-no-grant]", { userId, product, amount, requestId });
      }
    } catch (e) {
      console.warn("[webpay:commit:idempotente]", (e as any)?.message || e);
    }

    // 5) happy-path
    return NextResponse.redirect(withStatus("approved", { product: code }), { status: 302 });
  } catch (err: any) {
    console.error("[webpay:commit:error]", err?.message || err);
    // En error inesperado, mejor ir a cancel page (no success)
    return NextResponse.redirect(getCancelUrl(), { status: 302 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
