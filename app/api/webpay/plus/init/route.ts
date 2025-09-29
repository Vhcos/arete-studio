import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  addonPriceClp,
  buildBuyOrder,
  getReturnUrl,
  packPriceClp,
  webpayPlusCreate,
} from "@/lib/webpay";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }
  const userId = String(session.user.id);

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
