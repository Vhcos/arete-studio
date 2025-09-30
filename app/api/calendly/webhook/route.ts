import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { consumeSessionEntitlement } from "@/lib/credits";

/**
 * Webhook Calendly:
 * - Eventos: invitee.created / invitee.canceled
 * - Firma: header "Calendly-Webhook-Signature" (v1 basado en HMAC-SHA256)
 * - Mapeo: user por email del invitee (User.email)
 */
export async function POST(req: NextRequest) {
  const text = await req.text(); // leer cuerpo crudo para firma
  const signature = req.headers.get("calendly-webhook-signature") || "";
  const allowUnverified = (process.env.CALENDLY_ALLOW_UNVERIFIED || "") === "1";
  const signingKey = process.env.CALENDLY_SIGNING_KEY || "";

  // Verificación de firma (si está configurada)
  if (!allowUnverified && signingKey) {
    try {
      // Formato header: "t=timestamp,v1=hexdigest"
      const parts = signature.split(",").reduce((acc: Record<string,string>, kv) => {
        const [k, v] = kv.trim().split("=");
        if (k && v) acc[k] = v;
        return acc;
      }, {});
      const t = parts["t"];
      const v1 = parts["v1"];
      if (!t || !v1) {
        return NextResponse.json({ ok: false, error: "bad_signature_header" }, { status: 401 });
      }
      const payload = `${t}.${text}`;
      const hmac = crypto.createHmac("sha256", signingKey);
      hmac.update(payload, "utf8");
      const digest = hmac.digest("hex");
      if (digest !== v1) {
        return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
      }
    } catch (e) {
      return NextResponse.json({ ok: false, error: "signature_check_failed" }, { status: 401 });
    }
  }

  // Parse JSON una vez validada la firma
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // Calendly payload (simplificado)
  // {
  //   event: "invitee.created" | "invitee.canceled",
  //   payload: {
  //     event: "invitee.created",
  //     invitee: { email, uri, ... },
  //     event_type: { uri, name },
  //     event: { uri, start_time, end_time, ... },
  //     ... // según docs Calendly
  //   }
  // }
  const event = body.event || body?.payload?.event;
  const pl = body.payload || {};
  const invitee = pl.invitee || {};
  const email = (invitee.email || "").toString().trim().toLowerCase();
  const inviteeUri = (invitee.uri || "").toString();
  const eventUri = (pl.event?.uri || "").toString();

  if (!email) {
    // Nada que mapear
    return NextResponse.json({ ok: true, skipped: "no_email" });
  }

  // Busca el usuario por email
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user?.id) {
    // No tenemos ese usuario
    return NextResponse.json({ ok: true, skipped: "user_not_found" });
  }

  // Construimos requestId único por evento+invitee para idempotencia
  const baseId = eventUri || inviteeUri || `cal:${email}`;
  const requestId = `cal:${event}:${baseId}`;

  try {
    if (event === "invitee.created") {
      // consumir 1 (si no existe requestId, se descuenta; si existe, se omite)
      await consumeSessionEntitlement(user.id, requestId, 1);
    } else if (event === "invitee.canceled") {
      // devolver 1 (negativo) — quedará reflejado en el aggregate
      await consumeSessionEntitlement(user.id, requestId, -1);
    }
  } catch (e) {
    console.error("[calendly webhook] error:", e);
    // No devolvemos 500 a Calendly para no reintentar indefinidamente
    return NextResponse.json({ ok: false, error: "processing_error" }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}
