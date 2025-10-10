//  lib/renderReportHtml.ts
/* Render común (email) para que el informe sea idéntico al de la pantalla */

type AnyObj = Record<string, any>;

export type EmailUser = {
  projectName?: string;
  founderName?: string;
  email?: string;
};

export type RenderEmailArgs = {
  user?: EmailUser;
  report?: AnyObj;     // tu objeto StandardReport / nonAI-report
  aiPlan?: AnyObj;     // { plan100?: string, plan6m?: string[] | string, competencia?: string[] | AnyObj[], regulacion?: string[] | AnyObj[] }
  summary?: string;    // resumen ejecutivo tal como lo ves en pantalla (opcional)
  preAI?: string;      // contenido previo a IA (opcional)
};

const css = `
  body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;color:#0f172a;margin:0;padding:0;background:#ffffff}
  .wrap{max-width:720px;margin:0 auto;padding:24px}
  h3{font-size:16px;margin:16px 0 8px}
  table{margin-top:4px;margin-bottom:8px}
  .card{border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin:8px 0 16px}
  .muted{color:#64748b;font-size:12px}
  ul{margin:0 0 0 18px;padding:0}
  li{margin:4px 0}
`;

const li = (s: string) => `<li>${escapeHtml(s)}</li>`;
const ul = (rows: string[]) => `<ul>${rows.map(li).join("")}</ul>`;

/** Convierte el fragmento HTML del Pre-IA a algo “email-safe” (inline styles básicos) */
function emailifyPreAI(html: string): string {
  if (!html) return "";

  let s = html;

  // Tablas: ancho completo, tipografía pequeña y borde inferior en encabezados
  s = s.replace(/<table([^>]*)>/g,
    '<table$1 style="width:100%;border-collapse:collapse;font-size:12px">');
  s = s.replace(/<thead([^>]*)>/g, '<thead$1>');
  s = s.replace(/<th([^>]*)>/g,
    '<th$1 style="text-align:left;padding:6px 8px;border-bottom:1px solid #e2e8f0">');
  s = s.replace(/<td([^>]*)>/g, '<td$1 style="padding:6px 8px;">');

  // Listas con aire
  s = s.replace(/<ul([^>]*)>/g, '<ul$1 style="margin:0 0 0 18px;padding:0">');
  s = s.replace(/<li([^>]*)>/g, '<li$1 style="margin:4px 0">');

  // Títulos comunes que trae tu bloque
  const titleRx = /(Resumen del tablero|Top riesgos.*?|Estado de Resultados anual.*?|Brújula menor|Curva hacia el punto de equilibrio)/i;
  s = s.replace(
    new RegExp(`<div[^>]*>\\s*${titleRx.source}\\s*<\\/div>`, 'gi'),
    (_m, t) => `<h3>${t}</h3>`
  );

  // Quitar class="..." para no depender de Tailwind en email
  s = s.replace(/\sclass="[^"]*"/g, "");

  return s;
}

function escapeHtml(x: any) {
  return String(x ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Normaliza bullets que pueden venir como string[], objetos o texto plano */
function normalizeBullets(src: any, fallback: string[] = []): string[] {
  if (Array.isArray(src) && src.every(v => typeof v === "string")) return src as string[];
  if (Array.isArray(src)) {
    return src.map((row: any) => {
      if (typeof row === "string") return row;
      if (row && typeof row === "object") {
        // intenta atributos comunes como "text" o "label"
        return row.text ?? row.label ?? JSON.stringify(row);
      }
      return String(row ?? "");
    });
  }
  if (typeof src === "string" && src.trim()) {
    // separa por saltos de línea
    return src.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  }
  return fallback;
}

/** Fallback genérico de “Pasos sugeridos” de Evaluación (IA) */
function defaultIaSteps(): string[] {
  return [
    "Define tu propuesta de valor",
    "Establece una estrategia de marketing",
    "Lanza campañas publicitarias",
    "Optimiza procesos internos",
    "Evalúa resultados y ajusta",
  ];
}

/** Fallback genérico de plan 6 meses */

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
  // Prioridades: summary explícito → summary del report → brief de industria
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
export function renderReportEmailHtml(args: RenderEmailArgs): string {
  const { user, report = {}, aiPlan } = args;

  const executive = (args?.summary ?? getExecutiveSummary(args));
  const preAIHtml =
  typeof args?.preAI === "string" && args.preAI.trim()
    ? `<h3>Datos Cualitativos y Cuantitativos (Tu tablero)</h3><div class="card">${emailifyPreAI(args.preAI)}</div>`
    : "";

  // “Evaluación (IA)” – usa los pasos del report si existen, si no usa default
  const iaSteps: string[] =
    normalizeBullets(report.iaSteps || report.evaluacionIa?.pasos) ?? [];
  const iaList = iaSteps.length ? iaSteps : defaultIaSteps();

  // Plan de acción
  const plan100 = (aiPlan?.plan100 ?? "").trim();
  const plan6m = getPlan6m(aiPlan);

  // Mapa competitivo (bullets con fallback)
  const compBullets = normalizeBullets(aiPlan?.competencia, [
    "Segmentos típicos en tu categoría: low–cost, estándar y premium.",
    "Diferénciate por propuesta y experiencia (no solo precio).",
    "Rango de precio de lista; destaca tu ticket y tiempos de entrega.",
    "Ventajas defendibles: canal directo, servicio postventa, casos y reseñas.",
    "Evita competir en todo; elige 2–3 atributos clave y sé n°1 allí.",
  ]);

  // Checklist regulatorio (bullets con fallback)
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
<title>Informe ARET3</title>
<style>${css}</style>
</head>
<body>
  <div class="wrap">
    <p class="muted">Informe ARET3</p>

    <div class="card">
      <div><strong>Proyecto:</strong> ${escapeHtml(user?.projectName ?? "")}</div>
      <div><strong>Emprendedor/a:</strong> ${escapeHtml(user?.founderName ?? "")}</div>
      <div><strong>Email:</strong> ${escapeHtml(user?.email ?? "")}</div>
    </div>

    <h3>Resumen ejecutivo</h3>
    <div class="card">
      <p style="margin:0">${escapeHtml(executive)}</p>
    </div>

     <!-- Evaluación (IA) -->
    <h3>Evaluación (IA)</h3>
    <div class="card">
      <p class="muted" style="margin:0 0 8px">Impulsa tu negocio hacia el éxito</p>
      ${ul(iaList)}
    </div>

    <h3>Rubro</h3>
    <div class="card"><p style="margin:0">${escapeHtml(report.sections?.industryBrief ?? "")}</p></div>

    <h3>Competencia local ($)</h3>
    <div class="card"><p style="margin:0">${escapeHtml(report.sections?.competitionLocal ?? "")}</p></div>

    <h3>FODA + Tamaño de Mercado</h3>
    <div class="card"><p style="margin:0">${escapeHtml(report.sections?.swotAndMarket ?? "")}</p></div>

    <h3>Veredicto con 3 próximos pasos</h3>
    <div class="card"><p style="margin:0">${escapeHtml(report.sections?.finalVerdict ?? "")}</p></div>

    ${report?.ranking?.score != null ? `
      <div class="muted">Score: ${escapeHtml(report.ranking.score)} / 100 · ${report.ranking.constraintsOK ? "✓ Consistente" : "△ Revisar campos"}</div>
    ` : ""}

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
    </div>

    <!-- Checklist regulatorio -->
    <h3>Checklist regulatorio</h3>
    <div class="card">
      ${ul(regBullets)}
    </div>

  </div>
${preAIHtml}</body>
</html>`;
}
