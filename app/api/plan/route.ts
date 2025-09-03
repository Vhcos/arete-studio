/* eslint-disable @typescript-eslint/no-explicit-any */
export const runtime = "edge";

import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function json(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { "Content-Type": "application/json" },
  });
}

// --- helpers ---
function pickJson(s: string) {
  const i = s.indexOf("{"); const j = s.lastIndexOf("}");
  if (i >= 0 && j > i) { try { return JSON.parse(s.slice(i, j + 1)); } catch {} }
  return null;
}
function limitWords(text: string, maxWords = 120) {
  const words = (text || "").trim().split(/\s+/);
  return words.length <= maxWords ? (text || "").trim() : words.slice(0, maxWords).join(" ") + "…";
}
const num = (x:any)=> {
  if (x==null || x==="") return 0;
  const n = typeof x==="string" ? parseFloat(String(x).replace(/\./g,"").replace(",",".")) : +x;
  return Number.isFinite(n) ? n : 0;
};

type RegulationRow = {
  area: string; que_aplica: string; requisito: string;
  plazo: string; riesgo: string; accion: string;
};
function dedupReg(rows: RegulationRow[]) {
  const seen = new Set<string>();
  return rows.filter(r => {
    const k = (r.area + "|" + r.que_aplica).toLowerCase();
    if (seen.has(k)) return false; seen.add(k); return true;
  });
}

// Ajustes por rubro (14 categorías: incluye los 10 + 4 extras)
function augmentRegulacionPorRubro(rubro: string, rows: RegulationRow[]) {
  const r = (rubro || "").toLowerCase();
  const push = (x: RegulationRow) => rows.push(x);

  // 1) Asesorías / Servicios profesionales
  if (/asesor|consultor|servicio profesional|mentori|coaching/.test(r)) {
    push({ area:"Contratos", que_aplica:"Prestación de servicios", requisito:"Contrato tipo + cláusula de IP", plazo:"Previo a vender", riesgo:"Medio", accion:"Usar contrato estándar" });
    push({ area:"Seguros", que_aplica:"RC profesional", requisito:"Póliza RC si atiendes empresas", plazo:"Mes 1–3", riesgo:"Bajo", accion:"Cotizar póliza RC" });
  }
  // 2) Tienda física (retail)
  if (/tienda|retail|local comercial|boutique|kiosco/.test(r)) {
    push({ area:"Municipal", que_aplica:"Patente/uso de suelo", requisito:"Patente municipal", plazo:"Antes de abrir", riesgo:"Medio", accion:"Tramitar patente" });
    push({ area:"Consumo", que_aplica:"Info al consumidor", requisito:"Precios visibles + libro reclamos", plazo:"Apertura", riesgo:"Bajo", accion:"Señalética y libro" });
  }
  // 3) E-commerce / Tienda online
  if (/e-?commerce|tienda online|marketplace|venta online|shopify|woocommerce/.test(r)) {
    push({ area:"Consumo", que_aplica:"Retracto/garantía legal", requisito:"Política de cambios/devoluciones", plazo:"Lanzamiento", riesgo:"Medio", accion:"Publicar en TOS" });
    push({ area:"Datos", que_aplica:"Cookies/tracking", requisito:"Banner cookies + PP", plazo:"Lanzamiento", riesgo:"Medio", accion:"Implementar banner/PP" });
    push({ area:"Pagos", que_aplica:"PSP/antifraude", requisito:"Contrato Stripe/Transbank + 3DS", plazo:"Lanzamiento", riesgo:"Medio", accion:"Configurar antifraude" });
  }
  // 4) Restaurante / Bar / Foodtruck
  if (/restaurante|restaurant|bar|food ?truck|comida|gastronom/.test(r)) {
    push({ area:"Sanitaria", que_aplica:"Manipulación de alimentos", requisito:"Resolución sanitaria Seremi", plazo:"30–60 días", riesgo:"Alto", accion:"Tramitar resolución y BPM" });
    push({ area:"Residuos", que_aplica:"Aceites/RS", requisito:"Gestor autorizado", plazo:"Lanzamiento", riesgo:"Medio", accion:"Contratar gestor" });
    push({ area:"Alcoholes", que_aplica:"Patente alcoholes", requisito:"Patente si aplica", plazo:"Previo a vender", riesgo:"Medio", accion:"Solicitar patente" });
  }
  // 5) Cafetería / Panadería
  if (/cafeter[ií]a|cafe|panader[ií]a|pasteler[ií]a/.test(r)) {
    push({ area:"Sanitaria", que_aplica:"BPM/temperaturas", requisito:"Protocolos y registros", plazo:"Lanzamiento", riesgo:"Medio", accion:"Implementar plan BPM" });
  }
  // 6) Salud / Belleza
  if (/salud|cl[ií]nica|kine|spa|est[eé]tica|barber[ií]a|peluquer[ií]a/.test(r)) {
    push({ area:"Habilitación", que_aplica:"Títulos/licencias", requisito:"Profesional habilitado + registro", plazo:"Previo a operar", riesgo:"Alto", accion:"Verificar permisos" });
    push({ area:"Bioseguridad", que_aplica:"Esterilización/residuos", requisito:"Protocolos y EPP", plazo:"Lanzamiento", riesgo:"Alto", accion:"Implementar protocolo" });
    push({ area:"Privacidad", que_aplica:"Datos sensibles", requisito:"Consentimiento informado", plazo:"Lanzamiento", riesgo:"Medio", accion:"Modelos de consentimiento" });
  }
  // 7) Educación / Cursos / Coaching
  if (/educaci[oó]n|curso|academia|capacita|taller|coaching/.test(r)) {
    push({ area:"Propiedad intelectual", que_aplica:"Contenidos/licencias", requisito:"Licencias material didáctico", plazo:"Previo a vender", riesgo:"Bajo", accion:"Definir licencias/cesiones" });
    push({ area:"SENCE/Certif.", que_aplica:"Programas formales", requisito:"Inscripción si aplica", plazo:"0–6 meses", riesgo:"Bajo", accion:"Evaluar SENCE/certificación" });
    push({ area:"Menores", que_aplica:"Protección de menores", requisito:"Política y consentimiento", plazo:"Lanzamiento", riesgo:"Medio", accion:"Política de menores" });
  }
  // 8) Software / SaaS
  if (/saas|software|app|plataforma|tecnolog[ií]a|ia|inteligencia artificial/.test(r)) {
    push({ area:"Datos personales", que_aplica:"DPA con proveedores", requisito:"Contratos (OpenAI, analytics, correo)", plazo:"Lanzamiento", riesgo:"Medio", accion:"Firmar DPA" });
    push({ area:"Seguridad", que_aplica:"Disponibilidad/backups", requisito:"SLA + backups + logs", plazo:"Lanzamiento", riesgo:"Medio", accion:"Definir RTO/RPO y monitoreo" });
    push({ area:"Prop. intelectual", que_aplica:"Código y marcas", requisito:"Registrar marca; control OSS", plazo:"0–6 meses", riesgo:"Bajo", accion:"Registrar marca y SBOM" });
  }
  // 9) Fintech / Pagos / Créditos
  if (/fintech|pago|wallet|cr[eé]dito|pr[eé]stamo|cripto|broker/.test(r)) {
    push({ area:"Financiera", que_aplica:"KYC/AML", requisito:"Políticas y monitoreo", plazo:"Lanzamiento", riesgo:"Alto", accion:"Implementar KYC/AML" });
    push({ area:"Regulación", que_aplica:"Licencia/registro CMF", requisito:"Análisis regulatorio", plazo:"Previo a operar", riesgo:"Alto", accion:"Asesoría regulatoria" });
    push({ area:"Seguridad", que_aplica:"Fraude/chargebacks", requisito:"Antifraude", plazo:"Lanzamiento", riesgo:"Medio", accion:"Configurar 3DS/alertas" });
  }
  // 10) Transporte / Logística / Delivery
  if (/transporte|log[ií]stica|delivery|reparto|mensajer[ií]a/.test(r)) {
    push({ area:"Permisos", que_aplica:"Habilitación vehículos/empresa", requisito:"Permisos MTT/municipales", plazo:"Previo a operar", riesgo:"Medio", accion:"Tramitar permisos" });
    push({ area:"Seguros", que_aplica:"Mercancía/RC", requisito:"Pólizas obligatorias", plazo:"Lanzamiento", riesgo:"Medio", accion:"Contratar pólizas" });
    push({ area:"Datos", que_aplica:"Geolocalización", requisito:"Política de minimización", plazo:"Lanzamiento", riesgo:"Bajo", accion:"Definir retención" });
  }
  // 11) Turismo / Hotel / Hospedaje
  if (/hotel|hostal|hostel|hospedaje|airbnb|turismo|alojamiento/.test(r)) {
    push({ area:"Turismo", que_aplica:"Registro/Clasificación", requisito:"Inscripción Sernatur o similar", plazo:"0–3 meses", riesgo:"Medio", accion:"Registrar establecimiento" });
    push({ area:"Seguridad", que_aplica:"Plan emergencia", requisito:"Extintores/señalética/evacuación", plazo:"Lanzamiento", riesgo:"Medio", accion:"Implementar plan" });
  }
  // 12) Construcción / Remodelación
  if (/construcci[oó]n|obra|remodelaci[oó]n|contratista|maestro/.test(r)) {
    push({ area:"Permisos", que_aplica:"Obras menores/mayores", requisito:"Permiso DOM/municipal", plazo:"Previo a ejecutar", riesgo:"Alto", accion:"Tramitar en DOM" });
    push({ area:"Seguridad laboral", que_aplica:"Ley 16.744", requisito:"Plan de seguridad, EPP", plazo:"Inicio de obra", riesgo:"Alto", accion:"Implementar plan/registro" });
  }
  // 13) Manufactura / Alimentos envasados
  if (/manufactura|f[áa]brica|producci[oó]n|alimentos? envasad|bebidas|packaging/.test(r)) {
    push({ area:"Sanitaria", que_aplica:"Elaboración alimentos/bebidas", requisito:"Resolución sanitaria + BPM", plazo:"0–90 días", riesgo:"Alto", accion:"Tramitar resolución" });
    push({ area:"Etiquetado", que_aplica:"Rotulado/LOA", requisito:"Tabla nutricional/advertencias", plazo:"Previo a vender", riesgo:"Medio", accion:"Validar etiquetas" });
  }
  // 14) Inmobiliario / Proptech
  if (/inmobiliari|proptech|corretaje|arriendo|venta|broker inmobiliario|propiedad/.test(r)) {
    push({ area:"Contratos", que_aplica:"Arriendo/Compraventa/Corretaje", requisito:"Modelos contractuales", plazo:"Previo a operar", riesgo:"Medio", accion:"Definir modelos" });
    push({ area:"KYC/AML", que_aplica:"Prevención de lavado", requisito:"Identificación clientes", plazo:"Lanzamiento", riesgo:"Medio", accion:"Implementar KYC básico" });
  }
  return rows;
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) return json({ ok:false, error:"OPENAI_API_KEY missing" }, 500);

  const { input = {} } = (await req.json().catch(() => ({ input: {} }))) as any;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

   // ---- cálculos de contexto para metas numéricas
  const price = num(input.ticket);
  const costU = Math.min(num(input.costoUnit), price);
  const mcU   = Math.max(0, price - costU);
  const vMens = num(input.ingresosMeta);
  const uMes  = price > 0 ? Math.round(vMens / price) : 0; // unidades/mes objetivo
  const gf    = num(input.gastosFijos);
  const mkt   = num(input.marketingMensual);
  const pct   = num(input.costoPct);
  const cvMes = pct > 0 ? Math.round(vMens * (pct/100)) : uMes * costU;
  const resAn = (vMens - cvMes - gf - mkt) * 12;
  const CAC_objetivo = uMes > 0 ? Math.floor((mkt > 0 ? mkt : cvMes) / uMes) : 0;
  const M_requerido = uMes > 0 ? uMes * CAC_objetivo : 0;
  const Q = CAC_objetivo > 0 && price > 0 ? Math.min(1, mcU / CAC_objetivo) : 0;


  // Prompt: fuerza plan operativo 90 días (imperativo), y arrays
  const system = `
Eres consultor de negocios. Devuelve SOLO un JSON válido (sin texto extra).
Esquema requerido:
{
  "title": string,
  "plan100": string,        // 90 días, voz imperativa, Semana 1–2 / Semana 3–4 / Mes 2 / Mes 3; termina con "KPIs: ..."; ≤120 palabras
  "steps": string[],        // 4–6 pasos accionables
  "competencia": [
    { "empresa":"string","ciudad":"string","segmento":"string",
      "propuesta":"string","precio":"string","canal":"string",
      "switching_cost":"Bajo|Medio|Alto","moat":"string" }
  ],
  "regulacion": [
    { "area":"string","que_aplica":"string","requisito":"string",
      "plazo":"string","riesgo":"Bajo|Medio|Alto","accion":"string" }
  ]
}
Prohibido: describir el producto o usar frases como "la aplicación permitirá", "se ofrecerá", "nuestro producto".
Obligatorio en plan100: hitos (Semana 1–2, Mes 2, Mes 3) y una línea que empiece por "KPIs:".
En competencia, si no hay marcas confiables, usa tipologías (Apps IA, Consultores, Agencias, DIY, etc.).
`;

  const ctx = [
    `Idea: ${input.idea ?? ""}`,
    `Ubicación: ${input.ubicacion ?? ""}`,
    `Rubro: ${input.rubro ?? ""}`,
    input.ingresosMeta ? `Meta ingresos (CLP/mes): ${input.ingresosMeta}` : "",
    input.ticket ? `Ticket (CLP): ${input.ticket}` : "",
    input.costoUnit ? `Costo unitario (CLP): ${input.costoUnit}` : "",
    input.gastosFijos ? `Gastos fijos (CLP/mes): ${input.gastosFijos}` : "",
    input.marketingMensual ? `Marketing (CLP/mes): ${input.marketingMensual}` : "",
    "",
   // contexto numérico para que el modelo lo use en KPIs
    `Cálculos: uMes=${uMes}, mcU=${mcU}, cvMes≈${cvMes}, resAn≈${resAn}.`,
    "Devuelve el JSON EXACTO con el esquema anterior.",
  ].filter(Boolean).join("\n");

  // --- Primer pase
  const r = await client.chat.completions.create({
    model,
    temperature: 0.15,
    response_format: { type: "json_object" },
    messages: [{ role: "system", content: system }, { role: "user", content: ctx }],
    max_tokens: 1100,
  });
  const raw = r.choices?.[0]?.message?.content?.trim() ?? "";
  if (!raw) return json({ ok:false, error:"empty_output_text" }, 502);

  let data = pickJson(raw) ?? {};
  let plan100: string = (data.plan100 || data.summary || "").toString();
  let steps: string[] = Array.isArray(data.steps) ? data.steps.map((s:any)=>String(s)).filter(Boolean) : [];

  // --- Reescritura si el plan salió descriptivo (no operativo)
  const looksDescriptive =
    /aplicaci[oó]n|producto|permitir[áa]|ofrecer[áa]|tendr[áa]n acceso/i.test(plan100) &&
    !/(semana|mes|kpi|90)/i.test(plan100);

  if (looksDescriptive) {
    const rewrite = await client.chat.completions.create({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content:
          'Reescribe SOLO a JSON {"plan100":string,"steps":string[]} en español. ' +
          'Plan100: 90 días, voz imperativa, Semana 1–2 / Mes 2 / Mes 3, y termina con "KPIs: ...", ≤120 palabras. ' +
          'Prohibido describir el producto (no usar "la aplicación permitirá", "se ofrecerá").' },
        { role: "user", content:
          `Contexto: rubro=${input.rubro ?? ""}, ubicación=${input.ubicacion ?? ""}, ticket=${num(input.ticket)}, ingresosMeta=${num(input.ingresosMeta)}.
Texto actual a convertir en plan operativo:
${plan100}` },
      ],
      max_tokens: 400,
    });
    const rew = pickJson(rewrite.choices?.[0]?.message?.content?.trim() ?? "") ?? {};
    if (rew.plan100) plan100 = String(rew.plan100);
    if (Array.isArray(rew.steps) && rew.steps.length) steps = rew.steps.map((s:any)=>String(s));
  }

  plan100 = limitWords(plan100, 120);
  if (steps.length < 4) {
    const defaults = [
      "Definir KPIs y metas semanales (CPC, CPL, conversión, CAC, LTV)",
      "Probar 2–3 canales y duplicar el ganador",
      "Mejorar oferta: bundles, pricing y UX de onboarding",
      "Crear casos de uso, referidos y alianzas B2B",
      "Automatizar entrega y medición (dashboards)",
    ];
    steps = [...steps, ...defaults].slice(0, 6);
  }

  const rubro = String(input.rubro || "negocio");
  const ciudad = String(input.ubicacion || "tu ciudad");

  // Competencia
  let competencia = Array.isArray(data.competencia) ? data.competencia : [];
  if (competencia.length === 0) {
    competencia = [
      { empresa: "Apps de evaluación con IA", ciudad, segmento: rubro, propuesta: "Velocidad y bajo costo", precio: "$3–7 mil", canal: "Web", switching_cost: "Bajo", moat: "UX/automatización" },
      { empresa: "Consultores independientes", ciudad, segmento: rubro, propuesta: "Asesoría personalizada", precio: "$20–100 mil", canal: "LinkedIn/redes", switching_cost: "Medio", moat: "Reputación" },
      { empresa: "Agencias de innovación", ciudad, segmento: rubro, propuesta: "Programas/talleres", precio: "$200 mil+/mes", canal: "B2B", switching_cost: "Alto", moat: "Relaciones" },
      { empresa: "Plantillas/DIY (Notion/Gumroad)", ciudad, segmento: rubro, propuesta: "Hazlo tú mismo", precio: "$5–15 mil", canal: "Marketplace", switching_cost: "Bajo", moat: "Comunidad/contenido" },
    ];
  }

  // Regulación
  let regulacion: RegulationRow[] = Array.isArray(data.regulacion) ? data.regulacion : [];
  if (regulacion.length === 0) {
    regulacion = [
      { area: "Tributaria",       que_aplica: "Inicio de actividades", requisito: "SII, giro, boleta/factura", plazo: "Previo a vender",  riesgo: "Medio", accion: "Formalizar RUT/giro y medios de pago" },
      { area: "Datos personales", que_aplica: "Ley 19.628 / cookies",  requisito: "Política de privacidad + TOS", plazo: "Lanzamiento",  riesgo: "Medio", accion: "Publicar TOS/PP y banner cookies" },
      { area: "Consumo",          que_aplica: "Devoluciones/garantías", requisito: "Política de reembolso clara", plazo: "Lanzamiento",  riesgo: "Bajo",  accion: "Publicar política visible" },
      { area: "Prop. intelectual",que_aplica: "Marca y contenidos",     requisito: "Registro de marca (INAPI)",  plazo: "0–6 meses",     riesgo: "Bajo",  accion: "Iniciar registro de marca" },
    ];
  }
  regulacion = augmentRegulacionPorRubro(rubro, regulacion);
  regulacion = dedupReg(regulacion);

  const title = String(data.title || "Plan");
  const plan = {
    title,
    summary: String(data.summary || ""), // compat
    steps,
    plan100,
    competencia,
    regulacion,
  };

  return json({ ok:true, plan, meta:{ modelUsed: model } });
}
