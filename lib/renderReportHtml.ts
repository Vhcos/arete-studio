/* Render común (email) para que el informe sea idéntico al de la pantalla */

type AnyObj = Record<string, any>;

export type EmailUser = {
  projectName?: string;
  founderName?: string;
  email?: string;
};

export type RenderEmailArgs = {
  user?: EmailUser;
  report?: AnyObj;   // tu objeto StandardReport / nonAI-report
  aiPlan?: AnyObj;   // { plan100?: string, plan6m?: string[] | string, competencia?: string[] | AnyObj[], regulacion?: string[] | AnyObj[] }
  summary?: string;  // resumen ejecutivo tal como lo ves en pantalla (opcional)
  preAI?: string;    // HTML del tablero/panel de navegación (opcional)
  viewUrl?: string;  // link “Ver informe en el navegador” (opcional)
};

const css = `
  body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;color:#0f172a;margin:0;padding:0;background:#ffffff}
  .wrap{max-width:720px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:14px;background:#ffffff}
  h3{font-size:16px;margin:16px 0 8px}
  table{margin-top:4px;margin-bottom:8px;border-collapse:collapse;width:100%}
  .card{border:1.5px solid #cbd5e1;border-radius:12px;padding:12px;margin:8px 0 16px;box-shadow:0 1px 2px rgba(15,23,42,0.06)}
  .muted{color:#64748b;font-size:12px}
  ul{margin:0 0 0 18px;padding:0}
  li{margin:4px 0}
`;

const li = (s: string) => `<li>${escapeHtml(s)}</li>`;
const ul = (rows: string[]) => `<ul>${rows.map(li).join("")}</ul>`;

function sourcesList(sources?: any[]): string {
  const src = Array.isArray(sources) ? sources.filter(x => x && x.url) : [];
  if (!src.length) return "";
  const items = src.slice(0, 8).map(s =>
    `<a href="${escapeHtml(s.url)}" style="color:#0A66C2">${escapeHtml(s.title || s.url)}</a>`
  ).join(" · ");
  return `<div class="muted" style="margin-top:6px">Fuentes: ${items}</div>`;
}

/** “Emailifica” el HTML del tablero (quita clases y agrega estilos inline mínimos) */
function emailifyPreAI(html: string): string {
  if (!html) return "";

  let s = html;

  // Celdas numéricas alineadas a la derecha
  s = s.replace(
    /<td([^>]*)>(\s*(?:US?\$)?\s*[\d\.\,]+(?:\s*(?:CLP|USD|UF))?\s*)<\/td>/gi,
    '<td$1 style="padding:6px 8px;text-align:right;white-space:nowrap">$2</td>'
  );
  // Encabezados de tabla
  s = s.replace(/<thead([^>]*)>/gi, '<thead$1>');
  s = s.replace(/<th([^>]*)>/gi,
    '<th$1 style="text-align:left;padding:6px 8px;border-bottom:1px solid #e2e8f0">');
  s = s.replace(/<td([^>]*)>/gi, '<td$1 style="padding:6px 8px;">');

  // Listas con aire
  s = s.replace(/<ul([^>]*)>/gi, '<ul$1 style="margin:0 0 0 18px;padding:0">');
  s = s.replace(/<li([^>]*)>/gi, '<li$1 style="margin:4px 0">');

  // Titulares comunes del tablero → <h3>
  const titleRx = /(Panel de Navegación|Resumen del tablero|Top riesgos.*?|Estado de Resultados anual.*?|Brújula menor|Curva hacia el punto de equilibrio)/i;
  s = s.replace(new RegExp(`<div[^>]*>\\s*${titleRx.source}\\s*<\\/div>`, "gi"), (_m, t) => `<h3>${t}</h3>`);

  // Sin clases Tailwind
  s = s.replace(/\sclass="[^"]*"/gi, "");

  // Resaltar líneas típicas de EERR si aparecen
  s = s.replace(
    /(<tr[^>]*>\s*<td[^>]*>\s*(?:Costo de ventas|Gastos fijos|Gastos de marketing)\s*<\/td>\s*<td[^>]*>)([^<]+)/gi,
    (_m, g1, value) => `${g1}<span style="color:#B91C1C">${value}</span>`
  );

  return s;
}

function escapeHtml(x: any) {
  return String(x ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* -------------------- Fallback del Panel (si no viene preAI) -------------------- */

const num = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const round = (n: number) => Math.round(n || 0);
const ceil = (n: number) => (n > 0 ? Math.ceil(n) : 0);
const fmtCLP = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(round(n));

/** Encuentra un objeto step6 donde esté */
function pickStep6(report: AnyObj | undefined): AnyObj {
  const r = report || {};
  return (
    r.step6 ||
    r.s6 ||
    r.data?.step6 ||
    r.sections?.step6 ||
    r.kpis?.step6 ||
    {}
  );
}

/** Calcula un panel mínimo con la misma lógica base del Step-10 */
function buildPanelFallback(report: AnyObj): string {
  const s6 = pickStep6(report);

  const ticket = Math.max(0, num(s6.ticket));
  const ventaAnual = Math.max(0, num(s6.ventaAnual || s6.ventaAnio1));
  const ventaMensual = ventaAnual > 0 ? ventaAnual / 12 : 0;
  const gf = Math.max(0, num(s6.gastosFijosMensuales));
  const mkt = Math.max(0, num(s6.presupuestoMarketing ?? s6.marketingMensual));
  const mesesPE = Math.max(1, round(num(s6.mesesPE) || 6));
  const costoUnit = s6.costoVarUnit > 0 ? Math.min(num(s6.costoVarUnit), ticket) :
                    s6.costoVarPct > 0 ? Math.min((ticket * num(s6.costoVarPct)) / 100, ticket) : 0;
  const mcUnit = Math.max(0, ticket - costoUnit);
  const clientesPE = mcUnit > 0 && gf > 0 ? ceil(gf / mcUnit) : 0;
  const ventasPE = ticket * clientesPE;

  const clientesObjetivoMes =
    num(s6.clientesMensuales) > 0 ? round(num(s6.clientesMensuales))
    : ticket > 0 ? round(ventaMensual / ticket)
    : 0;

  const CAC = mkt > 0 && clientesObjetivoMes > 0 ? round(mkt / clientesObjetivoMes) : NaN;

  // Capital de trabajo por “peldaños iguales” (12 meses máximo)
  let capitalTrabajo = 0;
  for (let m = 1; m <= 12; m++) {
    const factor = m / mesesPE;
    const basePE = ceil(clientesPE * factor);
    const clientes = clientesObjetivoMes > 0 ? Math.min(basePE, clientesObjetivoMes) : basePE;
    const resultado = Math.max(0, clientes * mcUnit) - (gf + mkt);
    if (resultado < 0) capitalTrabajo += -resultado;
  }

  return `
    <h3>Panel de Navegación (KPIs clave)</h3>
    <div class="card">
      <ul>
        <li><b>Ticket promedio:</b> ${fmtCLP(ticket)}</li>
        <li><b>Costo variable unitario:</b> ${fmtCLP(costoUnit)}</li>
        <li><b>Margen por unidad:</b> ${fmtCLP(mcUnit)}</li>
        <li><b>Clientes para P.E. (mensual):</b> ${clientesPE}</li>
        <li><b>Ventas para P.E. (mensual):</b> ${fmtCLP(ventasPE)}</li>
        <li><b>Gastos fijos mensuales:</b> ${fmtCLP(gf)}</li>
        <li><b>Marketing mensual:</b> ${fmtCLP(mkt)}</li>
        <li><b>Capital de trabajo (déficits del año):</b> ${fmtCLP(capitalTrabajo)}</li>
        <li><b>Venta anual:</b> ${fmtCLP(ventaAnual)}</li>
        <li><b>CAC (estimado):</b> ${Number.isFinite(CAC) ? fmtCLP(CAC) : "—"}</li>
      </ul>
    </div>
  `;
}

/* -------------------- Bullets / Planes -------------------- */

function normalizeBullets(src: any, fallback: string[] = []): string[] {
  if (Array.isArray(src) && src.every(v => typeof v === "string")) return src as string[];
  if (Array.isArray(src)) {
    return src.map((row: any) => {
      if (typeof row === "string") return row;
      if (row && typeof row === "object") {
        return row.text ?? row.label ?? JSON.stringify(row);
      }
      return String(row ?? "");
    });
  }
  if (typeof src === "string" && src.trim()) {
    return src.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  }
  return fallback;
}

function defaultIaSteps(): string[] {
  return [
    "Define tu propuesta de valor",
    "Establece una estrategia de marketing",
    "Lanza campañas publicitarias",
    "Optimiza procesos internos",
    "Evalúa resultados y ajusta",
  ];
}

function defaultPlan6m(): string[] {
  return [
    "Semana 1: Investigación rápida con 5 entrevistas y definición de ICP/propuesta.",
    "Semana 2: Landing + checkout mínimo; 1 demo y test de precio.",
    "Semana 3: Primera campaña en canal principal; ≥ 200 visitas.",
    "Semana 4: Iteración del embudo; 5–10 ventas reales.",
    "Semana 5: Caso de estudio y referrals; 1–2 partners.",
    "Semana 6: Cierre de aprendizajes y siguiente ciclo.",
  ];
}

function getExecutiveSummary(args: RenderEmailArgs): string {
  const r = args.report || {};
  return (
    (args.summary ?? "").trim() ||
    (r.summary ?? r.execSummary ?? r.sections?.execSummary ?? "").trim() ||
    (r.sections?.industryBrief ?? "").trim()
  );
}

function asWeekly(list: string[]): string[] {
  return list
    .filter(Boolean)
    .slice(0, 6)
    .map((raw, i) => {
      let s = String(raw).trim();
      s = s
        .replace(/^semana\s*\d+:\s*/i, "")
        .replace(/^mes(es)?\s*\d+:\s*/i, "")
        .replace(/^m\s*\d+:\s*/i, "")
        .replace(/^m\d+[:\-]\s*/i, "")
        .replace(/^paso\s*\d+:\s*/i, "")
        .replace(/^\d+[\.\-:]\s*/, "");
      return `Semana ${i + 1}: ${s}`;
    });
}

function getPlan6m(aiPlan: AnyObj | undefined): string[] {
  if (!aiPlan) return defaultPlan6m();
  const fromArray = normalizeBullets((aiPlan as any).plan6m);
  if (fromArray.length) return asWeekly(fromArray);
  const fromText = normalizeBullets((aiPlan as any).plan6mText);
  if (fromText.length) return asWeekly(fromText);
  const fromBullets = normalizeBullets((aiPlan as any).bullets);
  if (fromBullets.length) return asWeekly(fromBullets);
  return defaultPlan6m();
}

/* -------------------- Render principal -------------------- */

export function renderReportEmailHtml(args: RenderEmailArgs): string {
  const { user, report = {}, aiPlan } = args;
  const intelSources = (aiPlan?.intelSources || aiPlan?.sources) as any[] | undefined;
  const viewUrl = args?.viewUrl || (report as any)?.viewUrl || "";
  const today = new Date();
  const fecha = today.toLocaleDateString("es-CL", { year:"numeric", month:"long", day:"numeric" });
  const preheader = `Tu evaluación con IA está lista: diagnóstico, plan y próximos pasos (${user?.projectName ?? "ARET3"}).`;

  const executive = (args?.summary ?? getExecutiveSummary(args));

  // Panel de Navegación (preferimos el HTML de pantalla; si no, fallback calculado)
  const preAIHtml =
    typeof args?.preAI === "string" && args.preAI.trim()
      ? `<h3>Panel de Navegación (tu tablero)</h3><div class="card">${emailifyPreAI(args.preAI)}</div>`
      : buildPanelFallback(report);

  // Evaluación (IA)
  const iaSteps: string[] =
    normalizeBullets((report as any).iaSteps || (report as any).evaluacionIa?.pasos) ?? [];
  const iaList = iaSteps.length ? iaSteps : defaultIaSteps();

  // Plan de acción
  const plan100 = (aiPlan?.plan100 ?? "").trim();
  const plan6m = getPlan6m(aiPlan);

  // Mapa competitivo / Regulación (bullets con fallback)
  const compBullets = normalizeBullets(aiPlan?.competencia, [
    "Segmentos típicos en tu categoría: low–cost, estándar y premium.",
    "Diferénciate por propuesta y experiencia (no solo precio).",
    "Rango de precio de lista; destaca tu ticket y tiempos de entrega.",
    "Ventajas defendibles: canal directo, servicio postventa, casos y reseñas.",
    "Evita competir en todo; elige 2–3 atributos clave y sé n°1 allí.",
  ]);
  const regBullets = normalizeBullets(aiPlan?.regulacion, [
    "Constitución / formalización (SpA o EIRL).",
    "Inicio de actividades en SII y emisión electrónica.",
    "Patente municipal (domicilio comercial).",
    "Protección de datos si captas leads/clientes.",
    "Prevención de riesgos / seguridad laboral según tamaño.",
  ]);

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Informe Preparado por el Equipo de Aret3</title>
<style>${css}</style>
</head>
<body>
  <!-- Preheader oculto para Gmail/Outlook -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">
    ${escapeHtml(preheader)}
  </div>

  <div class="wrap">

    <div class="card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
      <span style="display:inline-block;background:#EEF6FF;color:#0A66C2;border:1px solid #D6EAFE;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:700">
        Preparado por el equipo Aret3
      </span>
      <div class="muted" style="font-size:10px">
        ${escapeHtml(fecha)} · Generado automáticamente
      </div>
    </div>

    ${viewUrl ? `<div style="margin-top:8px">
       <a href="${escapeHtml(viewUrl)}"
         style="display:inline-block;background:#0A66C2;color:#fff;text-decoration:none;padding:8px 12px;border-radius:8px">
          Ver informe en el navegador
       </a>
     </div>` : ""}

    <h3>Datos del proyecto</h3>
    <div class="card">
      <div><strong>Proyecto:</strong> ${escapeHtml(user?.projectName ?? "")}</div>
      <div><strong>Emprendedor/a:</strong> ${escapeHtml(user?.founderName ?? "")}</div>
      <div><strong>Email:</strong> ${escapeHtml(user?.email ?? "")}</div>
    </div>

    <h3>Resumen ejecutivo</h3>
    <div class="card"><p style="margin:0">${escapeHtml(executive)}</p></div>

    ${preAIHtml}

    <!-- Evaluación (IA) -->
    <h3>Evaluación (IA)</h3>
    <div class="card">
      <p class="muted" style="margin:0 0 8px">Impulsa tu negocio hacia el éxito</p>
      ${ul(iaList)}
    </div>

    <h3>Rubro</h3>
    <div class="card"><p style="margin:0">${escapeHtml((report as any).sections?.industryBrief ?? "")}</p></div>

    <h3>Competencia local ($)</h3>
    <div class="card"><p style="margin:0">${escapeHtml((report as any).sections?.competitionLocal ?? "")}</p></div>

    <h3>FODA + Tamaño de Mercado</h3>
    <div class="card"><p style="margin:0">${escapeHtml((report as any).sections?.swotAndMarket ?? "")}</p></div>

    <h3>Veredicto con 3 próximos pasos</h3>
    <div class="card"><p style="margin:0">${escapeHtml((report as any).sections?.finalVerdict ?? "")}</p></div>

    ${
      (report as any)?.ranking?.score != null
        ? `<div class="muted">Score: ${escapeHtml((report as any).ranking.score)} / 100 · ${(report as any).ranking.constraintsOK ? "✓ Consistente" : "△ Revisar campos"}</div>`
        : ""
    }

    <!-- Plan de acción -->
    <h3>Plan de Acción — ¡Sigue con tu propósito!</h3>
    <div class="card">
      ${plan100 ? `<p style="margin:0 0 8px">${escapeHtml(plan100)}</p>` : ""}
      ${plan6m.length ? ul(plan6m) : ""}
    </div>

    <!-- Mapa competitivo -->
    <h3>Mapa competitivo</h3>
    <div class="card">
      ${ul(compBullets)}
      ${sourcesList(intelSources)}
    </div>

    <!-- Checklist regulatorio -->
    <h3>Checklist regulatorio</h3>
    <div class="card">
      ${ul(regBullets)}
    </div>

    <div style="font-size:11px;color:#94a3b8;margin-top:12px;text-align:center">
      Informe generado por el equipo de Aret3 · <a href="https://aret3.cl" style="color:#0A66C2">aret3.cl</a>
    </div>
  </div>
</body>
</html>`;
}
