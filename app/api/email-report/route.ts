// app/api/email-report/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { buildInvestorNarrative } from "../../lib/nonAI-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const resend = new Resend(process.env.RESEND_API_KEY || "");
const EMAIL_FROM    = process.env.EMAIL_FROM    || "ARET3 <login@aret3.cl>";
const EMAIL_BCC     = process.env.EMAIL_BCC     || "login@aret3.cl";
const EMAIL_TEST_TO = process.env.EMAIL_TEST_TO || ""; // opcional QA

const isEmail = (s?: string) => !!s && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s || "");

// ---------------- Fallbacks server-side ----------------
function fallbackCompetitiveMap(input: any): string {
  const rubro   = input?.rubro || input?.sectorId || "tu categoría";
  const ticket  = toNum(input?.ticket);
  const mcUnit  = toNum(input?.mcUnit ?? (ticket - toNum(input?.costoUnit)));

  const precio = ticket ? `$${fmtCL(ticket)}` : "precio de lista";
  const mc     = Number.isFinite(mcUnit) ? `$${fmtCL(mcUnit)}` : "margen unitario";

  return [
    `• Segmentos típicos en ${rubro}: low-cost, estándar y premium.`,
    `• Diferénciate por propuesta y experiencia (no solo precio).`,
    `• Rango de ${precio}; destaca tu ${mc} y tiempos de entrega.`,
    `• Ventajas defensibles: canal directo, servicio postventa, casos y reseñas.`,
    `• Evita “competir en todo”; elige 2–3 atributos clave y sé n°1 ahí.`,
  ].join("\n");
}

function fallbackRegulatoryChecklist(input: any): string {
  const rubro = `${input?.rubro || input?.sectorId || "tu giro"}`.toLowerCase();
  const comunes = [
    "• Constitución o formalización (SpA / EIRL).",
    "• Inicio de actividades en SII y emisión electrónica.",
    "• Patente municipal (domicilio comercial).",
    "• Contratos y protección de datos (si captas leads/clientes).",
    "• Prevención de riesgos / seguridad laboral según tamaño.",
  ];
  const extra: string[] = [];

  if (rubro.includes("food") || rubro.includes("alimento") || rubro.includes("rest")) {
    extra.push("• Autorización sanitaria SEREMI (elaboración/venta de alimentos).");
  }
  if (rubro.includes("construction") || rubro.includes("constru") || rubro.includes("realestate")) {
    extra.push("• Permisos DOM / obras menores-mayores; coordinación mutualidad.");
  }
  if (rubro.includes("educa")) extra.push("• Convenios/registro Mineduc/municipal si corresponde.");
  if (rubro.includes("fintech") || rubro.includes("finan")) extra.push("• Revisa normativa CMF / prevención LA/FT.");

  return [...comunes, ...extra].join("\n");
}

const fmtCL = (n: number) =>
  new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 })
    .format(Math.max(0, Math.round(n || 0)));

const toNum = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
// -------------------------------------------------------

export async function POST(req: Request) {
  try {
    const body   = await req.json();
    const to     = body?.to as string | undefined;
    const report = body?.report ?? {};
    const aiPlan = body?.aiPlan ?? null;
    const user   = body?.user ?? {};
    const reason = body?.reason || "user-asked";

    const toFinal = isEmail(to) ? to! : (isEmail(EMAIL_TEST_TO) ? EMAIL_TEST_TO : "");
    if (!toFinal) {
      return NextResponse.json({ ok: false, error: "Missing 'to' and EMAIL_TEST_TO not set" }, { status: 400 });
    }

    const project = user?.projectName?.trim?.() || "Tu evaluación";
    const subject = `Informe ARET3 — ${project}`;

    // === mismo resumen que pantalla ===
    let resumen = "";
    try { resumen = buildInvestorNarrative(report?.input || {}, report?.meta || {}); } catch {}

    const sections = report?.sections || {};
    const competitionLocal = sections?.competitionLocal || "—";
    const swotAndMarket    = sections?.swotAndMarket    || "—";
    const finalVerdict     = sections?.finalVerdict     || "—";

    // ← aquí forzamos contenido si no viene en el payload
    const competitiveMap = (sections?.competitiveMap ?? sections?.mapaCompetitivo) || fallbackCompetitiveMap(report?.input || {});
    const regulatoryChecklist = (sections?.regulatoryChecklist ?? sections?.checklistRegulatorio) || fallbackRegulatoryChecklist(report?.input || {});

    const html = renderHtmlEmail({
      project,
      founder:   user?.founderName || "—",
      email:     user?.email || "—",
      rubro:     user?.rubro || "—",
      ubicacion: user?.ubicacion || "—",
      resumen,
      competitionLocal,
      swotAndMarket,
      finalVerdict,
      plan100: aiPlan?.plan100 || "",
      competitiveMap,
      regulatoryChecklist,
      reason,
    });

    const resp = await resend.emails.send({
      from: EMAIL_FROM,
      to:   [toFinal],
      bcc:  isEmail(EMAIL_BCC) ? [EMAIL_BCC] : [],
      subject,
      html,
    });

    if ((resp as any)?.error) {
      console.error("Resend error:", (resp as any).error);
      return NextResponse.json({ ok: false, error: (resp as any).error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, to: toFinal, id: (resp as any)?.data?.id ?? null });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

function renderHtmlEmail(o:{
  project:string; founder:string; email:string; rubro:string; ubicacion:string;
  resumen:string; competitionLocal:string; swotAndMarket:string; finalVerdict:string;
  plan100?:string; competitiveMap?:string; regulatoryChecklist?:string; reason:string;
}) {
  const wrap = (s:string)=> (s || "—").replace(/\n/g, "<br/>");
  const esc  = (s:string)=> s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  return `<!doctype html>
<html>
<head><meta charSet="utf-8"/><title>Informe ARET3 — ${esc(o.project)}</title></head>
<body style="background:#f6f7fb;margin:0;padding:24px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;">
<table role="presentation" width="100%" style="max-width:680px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;">
<tr><td>
  <h1 style="margin:0;font-size:22px;">Informe ARET3 — ${esc(o.project)}</h1>
  <p style="margin:8px 0;color:#444;">Emprendedor/a: <b>${esc(o.founder)}</b> · Email: ${esc(o.email)}<br/>Rubro: <b>${esc(o.rubro)}</b> · Ubicación: <b>${esc(o.ubicacion)}</b></p>

  <h2 style="font-size:16px;margin:16px 0 6px;">Resumen ejecutivo</h2>
  <p style="white-space:pre-wrap;line-height:1.5;margin:0 0 12px;">${wrap(o.resumen)}</p>

  <h2 style="font-size:16px;margin:16px 0 6px;">Competencia local</h2>
  <p style="white-space:pre-wrap;line-height:1.5;margin:0 0 12px;">${wrap(o.competitionLocal)}</p>

  <h2 style="font-size:16px;margin:16px 0 6px;">FODA + Tamaño de mercado</h2>
  <p style="white-space:pre-wrap;line-height:1.5;margin:0 0 12px;">${wrap(o.swotAndMarket)}</p>

  <h2 style="font-size:16px;margin:16px 0 6px;">Veredicto + próximos pasos</h2>
  <p style="white-space:pre-wrap;line-height:1.5;margin:0 0 12px;">${wrap(o.finalVerdict)}</p>

  <h2 style="font-size:16px;margin:16px 0 6px;">Mapa competitivo</h2>
  <p style="white-space:pre-wrap;line-height:1.5;margin:0 0 12px;">${wrap(o.competitiveMap || "—")}</p>

  <h2 style="font-size:16px;margin:16px 0 6px;">Checklist regulatorio</h2>
  <p style="white-space:pre-wrap;line-height:1.5;margin:0 0 12px;">${wrap(o.regulatoryChecklist || "—")}</p>

  ${o.plan100 ? `
  <hr style="border:0;border-top:1px solid #eee;margin:16px 0;"/>
  <h2 style="font-size:16px;margin:16px 0 6px;">Plan de acción (100 palabras)</h2>
  <p style="white-space:pre-wrap;line-height:1.5;margin:0 0 12px;">${wrap(o.plan100)}</p>` : ""}

  <hr style="border:0;border-top:1px solid #eee;margin:16px 0;"/>
  <p style="color:#666;font-size:12px;margin:0;">Enviado por ARET3 · Motivo: ${esc(o.reason)}</p>
</td></tr>
</table>
</body>
</html>`;
}
