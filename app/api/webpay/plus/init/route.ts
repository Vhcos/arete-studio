import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import {
  addonPriceClp,
  buildBuyOrder,
  getReturnUrl,
  packPriceClp,
  webpayPlusCreate,
} from "@/lib/webpay";

export async function POST(req: NextRequest) {
  const session: any = await getServerSession(authOptions as any);
  if (!(session?.user && (session.user as any)?.id)) {
  return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
}
const userId = String((session.user as any).id);

  let body: any = {};
  try { body = await req.json(); } catch {}

  const concept = (body?.concept ?? "").toString(); // 'pack200' | 'addon30m'
  if (concept !== "pack200" && concept !== "addon30m") {
    return NextResponse.json({ ok: false, error: "INVALID_CONCEPT" }, { status: 400 });
  }

  try {
    const amount = concept === "pack200" ? packPriceClp() : addonPriceClp();
    const prefix = concept === "pack200" ? "P200" : "ADD30";
    const buyOrder = buildBuyOrder(prefix);
    const sessionId = userId;


        // ---- MODO MOCK: atajo sin Webpay (para pruebas locales) ----
    if ((process.env.TBK_ENV || "").toLowerCase() === "mock") {
      // token de la forma: mockP200_<userId> o mockADD30_<userId>
      const token = `${prefix === "P200" ? "mockP200" : "mockADD30"}_${userId}`;
      // Devolvemos nuestra propia URL de commit; el front seguirá posteando token_ws allí
      return NextResponse.json({
        ok: true,
        url: "/api/webpay/plus/commit",
        token,
        buyOrder
      });
    }
    // ------------------------------------------------------------


    // Crear transacción en Webpay
    const created = await webpayPlusCreate({
      buyOrder,
      sessionId,
      amount,
      returnUrl: getReturnUrl(),
    });

    // El front debe POSTear token_ws a created.url (form auto-submit)
    return NextResponse.json({ ok: true, url: created.url, token: created.token, buyOrder });
  } catch (err: any) {
    console.error("webpay init error", err?.message || err);
    return NextResponse.json({ ok: false, error: "INIT_FAILED" }, { status: 500 });
  }
}
