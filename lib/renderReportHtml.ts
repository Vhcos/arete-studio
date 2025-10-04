/* Render común (email) para que el informe sea idéntico al de la pantalla */

type AnyObj = Record<string, any>;

export type EmailUser = {
  projectName?: string;
  founderName?: string;
  email?: string;
};

// ===== Tipos del renderer =====
type PreAIBlock = {
  items: any[];
  meta: any; // traerá mesesPE, N, etc.
  pe?: { ventasPE?: number; clientsPE?: number } | null;
  peCurve?: { data?: any[]; acumDeficitUsuario?: number } | null;
  mkt?: { mode?: 'budget'|'cac'; N?:number; Q?:number; M_requerido?:number; CPL?:number; CAC?:number } | null;
  eerr?: { ventas?:number; costoVariable?:number; gastosFijos?:number; marketing?:number; rai?:number } | null;
};

type RenderEmailArgs = {
  report: any | null;                  // informe IA/No-IA (legacy)
  summary?: string;                    // resumen ejecutivo (texto)
  preAI?: PreAIBlock | null;           // bloque Pre-IA para clonar lo de la pantalla
  aiPlan?: any | null;                 // plan IA (si existe)
  user?: { projectName?:string; founderName?:string; email?:string; idea?:string; rubro?:string; ubicacion?:string } | null;
};

const css = `
  body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;color:#0f172a;margin:0;padding:0;background:#ffffff}
  .wrap{max-width:720px;margin:0 auto;padding:24px}
  h3{font-size:16px;margin:16px 0 8px}
  .card{border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin:8px 0 16px}
  .muted{color:#64748b;font-size:12px}
  ul{margin:0 0 0 18px;padding:0}
  li{margin:4px 0}
`;

const li = (s: string) => `<li>${escapeHtml(s)}</li>`;
const ul = (rows: string[]) => `<ul>${rows.map(li).join("")}</ul>`;

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
    "Mes 1: Investigación de mercado y análisis de competencia para definir características clave.",
    "Mes 2: Requisitos del producto y diseño de UI/UX.",
    "Mes 3: Desarrollo del prototipo funcional.",
    "Mes 4: Pruebas de usuario y ajuste del producto.",
    "Mes 5: Mejoras a partir del feedback y preparación de lanzamiento.",
    "Mes 6: Lanzamiento y campaña de marketing inicial.",
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

/** Renderiza el bloque Pre-IA (Resumen tablero + EERR + Brújula + Curva) */
function renderPreAIHtml(preAI: PreAIBlock | null | undefined): string {
  if (!preAI) return "";

  const fmtCL = (n:number)=> new Intl.NumberFormat('es-CL',{maximumFractionDigits:0}).format(Math.max(0, Math.round(n||0)));
  const fmtN  = (n:number)=> new Intl.NumberFormat('es-CL',{maximumFractionDigits:2}).format(Math.max(0, Number(n||0)));

  const mesesPE = Number(preAI.meta?.mesesPE ?? 6);

  // EERR
  const ventas     = Math.round(Number(preAI.eerr?.ventas ?? 0));
  const cv         = Math.round(Number(preAI.eerr?.costoVariable ?? 0));
  const gf         = Math.round(Number(preAI.eerr?.gastosFijos ?? 0));
  const mkt        = Math.round(Number(preAI.eerr?.marketing ?? 0));
  const rai        = Math.round(Number(preAI.eerr?.rai ?? (ventas - cv - gf - mkt)));

  // Brújula
  const ventasPE   = Math.round(Number(preAI.pe?.ventasPE ?? 0));
  const clientsPE  = Number(preAI.pe?.clientsPE ?? 0);
  const capital    = Math.round(Number(preAI.peCurve?.acumDeficitUsuario ?? 0));
  const N          = Number(preAI.mkt?.N ?? 0);
  const Q          = Number(preAI.mkt?.Q ?? 0);
  const CPL        = Math.round(Number(preAI.mkt?.CPL ?? 0));
  const CAC        = Math.round(Number(preAI.mkt?.CAC ?? 0));
  const mode       = (preAI.mkt?.mode ?? 'budget') as ('budget'|'cac');

  // Curva (recorta)
  const rows = (preAI.peCurve?.data ?? []).slice(0, mesesPE);

  return `
    <h3>Resumen del tablero</h3>
    <div class="card"><ul style="margin:0;padding-left:18px">
      ${(preAI.items || []).map((it:any)=>`<li><b>${escapeHtml(it.title)}:</b> ${escapeHtml(it.reason ?? "")} <span style="opacity:.6">(${((it.score ?? 0)).toFixed(1)}/10)</span></li>`).join("")}
    </ul></div>

    <h3>Estado de Resultados anual (1º proyección para flujos)</h3>
    <div class="card"><table style="width:100%;font-size:14px">
      <tbody>
        <tr><td>Ventas</td><td style="text-align:right"><b>$${fmtCL(ventas)}</b></td></tr>
        <tr><td>Costo de ventas</td><td style="text-align:right;color:#dc2626"><b>$${fmtCL(cv)}</b></td></tr>
        <tr><td>Gastos fijos</td><td style="text-align:right;color:#dc2626"><b>$${fmtCL(gf)}</b></td></tr>
        <tr><td>Gastos de marketing</td><td style="text-align:right;color:#dc2626"><b>$${fmtCL(mkt)}</b></td></tr>
        <tr><td><b>Resultado antes de impuestos</b></td><td style="text-align:right"><b>$${fmtCL(rai)}</b></td></tr>
      </tbody>
    </table></div>

    <h3>Brújula menor</h3>
    <div class="card">
      <p style="margin:4px 0">Capital de trabajo necesario (plan ${mesesPE}m): <b>$${fmtCL(capital)}</b></p>
      <p style="margin:4px 0">Ventas para P.E.: <b>$${fmtCL(ventasPE)}</b></p>
      <p style="margin:4px 0">Clientes para tu P.E.: <b>${fmtN(clientsPE)}</b></p>
      <p style="margin:4px 0">Clientes objetivo (mes): <b>${fmtN(N)}</b></p>
      <p style="margin:4px 0">Tráfico requerido: <b>${fmtN(Q)}</b></p>
      <p style="margin:4px 0">Costo unitario tráfico por cliente: <b>$${fmtCL(CPL)}</b></p>
      <p style="margin:4px 0">Costo por cliente que compra (${mode === 'budget' ? 'implícito' : 'objetivo'}): <b>$${fmtCL(CAC)}</b></p>
    </div>

    <h3>Curva hacia el punto de equilibrio (primeros ${mesesPE} meses)</h3>
    <div class="card"><table style="width:100%;font-size:13px;border-collapse:collapse">
      <thead><tr>
        <th style="text-align:left;border-bottom:1px solid #e2e8f0">Mes</th>
        <th style="text-align:left;border-bottom:1px solid #e2e8f0">% P.E. (usuario)</th>
        <th style="text-align:left;border-bottom:1px solid #e2e8f0">Clientes/mes</th>
        <th style="text-align:left;border-bottom:1px solid #e2e8f0">Déficit del mes</th>
      </tr></thead>
      <tbody>
        ${rows.map((r:any)=>`
          <tr>
            <td>${escapeHtml(r.mes)}</td>
            <td>${escapeHtml(r['%PE_usuario'])}%</td>
            <td>${fmtN(Math.round(r.clientes_usuario || 0))}</td>
            <td>$${fmtCL(Math.round(r.deficit || 0))}</td>
          </tr>`).join("")}
      </tbody>
    </table></div>
  `;
}

/** Fallback de Plan 6 meses */
function getPlan6m(aiPlan: AnyObj | undefined): string[] {
  if (!aiPlan) return defaultPlan6m();
  const fromArray = normalizeBullets(aiPlan.plan6m);
  if (fromArray.length) return fromArray;
  const fromText = normalizeBullets(aiPlan.plan6mText);
  if (fromText.length) return fromText;
  const fromBullets = normalizeBullets(aiPlan.bullets);
  if (fromBullets.length) return fromBullets;
  return defaultPlan6m();
}

// ===== Export ÚNICA =====
export function renderReportEmailHtml(args: RenderEmailArgs): string {
  const { user, report = {}, aiPlan } = args;

  const executive = (args?.summary ?? getExecutiveSummary(args));
  const preAIHtml = renderPreAIHtml(args?.preAI ?? null);

  // “Evaluación (IA)” – usa los pasos del report si existen, si no usa default
  const iaSteps: string[] = normalizeBullets(report.iaSteps || report.evaluacionIa?.pasos) ?? [];
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

  // Flag para ocultar secciones legacy si así lo pides desde page.tsx
  const hideAllLegacy = !!report?.hideLegacySections; const hideSwotVerdict = !!report?.hideSwotVerdict;

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
     <!-- Bloque Pre-IA (si viene) -->
    ${preAIHtml}
  </div>

    ${!hideAllLegacy ? `
      <h3>Rubro</h3>
      <div class="card"><p style="margin:0">${escapeHtml(report.sections?.industryBrief ?? "")}</p></div>

      <h3>Competencia local ($)</h3>
      <div class="card"><p style="margin:0">${escapeHtml(report.sections?.competitionLocal ?? "")}</p></div>

      <h3>FODA + Tamaño de Mercado</h3>
      <div class="card"><p style="margin:0">${escapeHtml(report.sections?.swotAndMarket ?? "")}</p></div>
      ${!hideSwotVerdict ? `
        <h3>Veredicto con 3 próximos pasos</h3>
        <div class="card"><p style="margin:0">${escapeHtml(report.sections?.finalVerdict ?? "")}</p></div>
      ` : ""}
      ${report?.ranking?.score != null ? `
        <div class="muted">Score: ${escapeHtml(report.ranking.score)} / 100 · ${report.ranking.constraintsOK ? "✓ Consistente" : "△ Revisar campos"}</div>
      ` : ""}
    ` : ""}

    <!-- Evaluación (IA) -->
    ${!hideAllLegacy ? `
      <h3>Evaluación (IA)</h3>
      <div class="card">
        <p class="muted" style="margin:0 0 8px">Impulsa tu negocio hacia el éxito</p>
        ${ul(iaList)}
      </div>

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
    ` : ""}

   
</body>
</html>`;
}
