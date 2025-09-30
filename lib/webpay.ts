type TbkEnv = "integration" | "live";

function baseUrl(env: TbkEnv) {
  return env === "live"
    ? "https://webpay3g.transbank.cl/rswebpaytransaction/api/webpay/v1.2"
    : "https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2";
}

function tbkEnv(): TbkEnv {
  const v = (process.env.TBK_ENV || "integration").toLowerCase();
  return v === "live" ? "live" : "integration";
}

function tbkHeaders() {
  const apiKeyId = process.env.TBK_API_KEY_ID || "";
  const apiKeySecret = process.env.TBK_API_KEY_SECRET || "";
  return {
    "Content-Type": "application/json",
    "Tbk-Api-Key-Id": apiKeyId,
    "Tbk-Api-Key-Secret": apiKeySecret,
  };
}

export async function webpayPlusCreate(input: {
  buyOrder: string;
  sessionId: string;
  amount: number;
  returnUrl: string;
}) {
  const res = await fetch(`${baseUrl(tbkEnv())}/transactions`, {
    method: "POST",
    headers: tbkHeaders(),
    body: JSON.stringify({
      buy_order: input.buyOrder,
      session_id: input.sessionId,
      amount: input.amount,
      return_url: input.returnUrl,
    }),
    // @ts-ignore
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`webpay create failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<{ token: string; url: string }>;
}

export async function webpayPlusCommit(token: string) {
  const res = await fetch(`${baseUrl(tbkEnv())}/transactions/${token}`, {
    method: "PUT",
    headers: tbkHeaders(),
    // @ts-ignore
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`webpay commit failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<{
    buy_order: string;
    session_id: string;
    status: string;
    response_code: number;
    amount: number;
    authorization_code?: string;
    payment_type_code?: string;
    accounting_date?: string;
    transaction_date?: string;
  }>;
}

export function getReturnUrl() {
  return process.env.WEBPAY_RETURN_URL || "https://app.aret3.cl/api/webpay/plus/commit";
}

export function getFinalUrl() {
  return process.env.WEBPAY_FINAL_URL || "https://app.aret3.cl/billing/success";
}

export function packPriceClp() {
  const n = Number(process.env.PACK_200CRED_CLP ?? "5000");
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 5000;
}

export function addonPriceClp() {
  const n = Number(process.env.ADDON_SESSION_30M_CLP ?? "30000");
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 30000;
}

// Utils cortos
function rand4() {
  return Math.random().toString(36).slice(2, 6);
}
function ts36() {
  return Math.floor(Date.now() / 1000).toString(36);
}

// Construye buyOrder corto (<=26 chars). Prefijo identifica concepto.
export function buildBuyOrder(concept: "P200" | "ADD30") {
  // P200 + ts36 + rand4 => ~15-16 chars; garantizamos <=26
  return `${concept}${ts36()}${rand4()}`.slice(0, 26);
}
