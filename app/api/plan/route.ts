/* eslint-disable @typescript-eslint/no-explicit-any */
export const runtime = "edge";

import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function json(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// --- helpers ---
function pickJson(s: string) {
  const i = s.indexOf("{");
  const j = s.lastIndexOf("}");
  if (i >= 0 && j > i) {
    try { return JSON.parse(s.slice(i, j + 1)); } catch {}
  }
  return null;
}
function limitWords(text: string, maxWords = 120) {
  const words = (text || "").trim().split(/\s+/);
  return words.length <= maxWords ? (text || "").trim() : words.slice(0, maxWords).join(" ") + "…";
}
type RegulationRow = {
  area: string; que_aplica: string; requisito: string;
  plazo: string; riesgo: string; accion: string;
};
function dedupReg(rows: RegulationRow[]) {
  const seen = new Set<string>();
  return rows.filter(r => {
    const k = (r.area + "|" + r.que_aplica).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// 🔧 Ajustes por rubro (10 categorías comunes)
function augmentRegulacionPorRubro(rubro: string, rows: RegulationRow[]) {
  const r = (rubro || "").toLowerCase();
  const push = (x: RegulationRow) => rows.push(x);

  // 1) Asesorías / Servicios profesionales
  if (/asesor|consultor|servicio profesional|mentori|coaching/.test(r)) {
    push({ area:"Contratos", que_aplica:"Prestación de servicios", requisito:"Contrato tipo + cláusula de propiedad intelectual", plazo:"Previo a vender", riesgo:"Medio", accion:"Usar contrato estándar con cesión de IP" });
    push({ area:"Seguros", que_aplica:"Responsabilidad civil profesional", requisito:"Póliza RC si atiendes empresas", plazo:"Mes 1–3", riesgo:"Bajo", accion:"Cotizar póliza RC" });
  }
  // 2) Tienda física (retail)
  if (/tienda|retail|local comercial|boutique|kiosco/.test(r)) {
    push({ area:"Municipal", que_aplica:"Patente comercial y uso de suelo", requisito:"Patente municipal vigente", plazo:"Antes de abrir", riesgo:"Medio", accion:"Tramitar patente" });
    push({ area:"Consumo", que_aplica:"Información al consumidor", requisito:"Precios visibles + libro de reclamos", plazo:"Apertura", riesgo:"Bajo", accion:"Habilitar señalética/libro" });
  }
  // 3) E-commerce / Tienda online
  if (/e-?commerce|tienda online|marketplace|venta online|shopify|woocommerce/.test(r)) {
    push({ area:"Consumo", que_aplica:"Retracto/garantía legal", requisito:"Política clara de cambios y devoluciones", plazo:"Lanzamiento", riesgo:"Medio", accion:"Publicar política en TOS" });
    push({ area:"Datos", que_aplica:"Cookies y tracking", requisito:"Banner cookies + PP", plazo:"Lanzamiento", riesgo:"Medio", accion:"Implementar banner y política" });
    push({ area:"Pagos", que_aplica:"Medios de pago", requisito:"Contrato con PSP (Stripe/Transbank) + antifraude", plazo:"Lanzamiento", riesgo:"Medio", accion:"Activar 3DS/monitoring" });
  }
  // 4) Restaurante / Bar / Foodtruck
  if (/restaurante|restaurant|bar|food ?truck|comida|gastronom/.test(r)) {
    push({ area:"Sanitaria", que_aplica:"Manipulación de alimentos", requisito:"Resolución sanitaria Seremi", plazo:"30–60 días", riesgo:"Alto", accion:"Tramitar resolución y BPM" });
    push({ area:"Residuos", que_aplica:"Aceites/RS", requisito:"Gestor autorizado", plazo:"Lanzamiento", riesgo:"Medio", accion:"Contratar gestor" });
    push({ area:"Alcoholes", que_aplica:"Patente alcoholes", requisito:"Patente si corresponde", plazo:"Previo a vender", riesgo:"Medio", accion:"Solicitar patente" });
  }
  // 5) Cafetería / Panadería
  if (/cafeter[ií]a|cafe|panader[ií]a|pasteler[ií]a/.test(r)) {
    push({ area:"Sanitaria", que_aplica:"BPM y control de temperaturas", requisito:"Protocolos y registros", plazo:"Lanzamiento", riesgo:"Medio", accion:"Implementar plan BPM" });
  }
  // 6) Salud / Belleza
  if (/salud|cl[ií]nica|kine|spa|est[eé]tica|barber[ií]a|peluquer[ií]a/.test(r)) {
    push({ area:"Habilitación", que_aplica:"Títulos/licencias", requisito:"Profesional habilitado + registro", plazo:"Previo a operar", riesgo:"Alto", accion:"Verificar títulos y permisos" });
    push({ area:"Bioseguridad", que_aplica:"Esterilización/residuos", requisito:"Protocolos y EPP", plazo:"Lanzamiento", riesgo:"Alto", accion:"Implementar protocolo" });
    push({ area:"Privacidad", que_aplica:"Datos sensibles", requisito:"Consentimiento informado", plazo:"Lanzamiento", riesgo:"Medio", accion:"Modelos de consentimiento" });
  }
  // 7) Educación / Cursos / Coaching
  if (/educaci[oó]n|curso|academia|capacita|taller|coaching/.test(r)) {
    push({ area:"Propiedad intelectual", que_aplica:"Contenidos/licencias", requisito:"Licencias del material didáctico", plazo:"Previo a vender", riesgo:"Bajo", accion:"Definir licencias/cesiones" });
    push({ area:"SENCE/Certif.", que_aplica:"Programas formales", requisito:"Inscripción si aplica", plazo:"0–6 meses", riesgo:"Bajo", accion:"Evaluar SENCE/certificación" });
    push({ area:"Menores", que_aplica:"Protección a menores", requisito:"Política y consentimiento", plazo:"Lanzamiento", riesgo:"Medio", accion:"Política de menores" });
  }
  // 8) Software / SaaS
  if (/saas|software|app|plataforma|tecnolog[ií]a|ia|inteligencia artificial/.test(r)) {
    push({ area:"Datos personales", que_aplica:"DPA con proveedores", requisito:"Contratos (OpenAI, analytics, correo)", plazo:"Lanzamiento", riesgo:"Medio", accion:"Firmar DPA / transferencias" });
    push({ area:"Seguridad", que_aplica:"Disponibilidad y backups", requisito:"SLA + backups + logs", plazo:"Lanzamiento", riesgo:"Medio", accion:"Definir RTO/RPO y monitoreo" });
    push({ area:"Prop. intelectual", que_aplica:"Código y marcas", requisito:"Registro de marca; control OSS", plazo:"0–6 meses", riesgo:"Bajo", accion:"Registrar marca y SBOM" });
  }
  // 9) Fintech / Pagos / Créditos
  if (/fintech|pago|wallet|cr[eé]dito|pr[eé]stamo|cripto|broker/.test(r)) {
    push({ area:"Financiera", que_aplica:"KYC/AML", requisito:"Políticas y monitoreo", plazo:"Lanzamiento", riesgo:"Alto", accion:"Implementar KYC/AML" });
    push({ area:"Regulación", que_aplica:"Licencia/registro CMF (según modelo)", requisito:"Análisis regulatorio", plazo:"Previo a operar", riesgo:"Alto", accion:"Asesoría regulatoria" });
    push({ area:"Seguridad", que_aplica:"Fraude/chargebacks", requisito:"Antifraude", plazo:"Lanzamiento", riesgo:"Medio", accion:"Configurar 3DS, límites y alertas" });
  }
  // 10) Transporte / Logística / Delivery
  if (/transporte|log[ií]stica|delivery|reparto|mensajer[ií]a/.test(r)) {
    push({ area:"Permisos", que_aplica:"Habilitación vehículos/empresa", requisito:"Permisos MTT/municipales", plazo:"Previo a operar", riesgo:"Medio", accion:"Tramitar permisos" });
    push({ area:"Seguros", que_aplica:"Mercancía y RC", requisito:"Pólizas obligatorias", plazo:"Lanzamiento", riesgo:"Medio", accion:"Contratar pólizas" });
    push({ area:"Datos", que_aplica:"Geolocalización", requisito:"Política y minimización", plazo:"Lanzamiento", riesgo:"Bajo", accion:"Definir retención/acceso" });
  }

  return rows;
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return json({ ok: false, error: "OPENAI_API_KEY missing" }, 500);
  }

  const { input = {} } = (await req.json().catch(() => ({ input: {} }))) as any;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  // Prompt: pedimos plan100 + steps + competencia + regulacion (JSON estricto)
  const system = `
Eres consultor de negocios. Devuelve SOLO un JSON válido (sin texto extra).
Esquema requerido:
{
  "title": string,
  "plan100": string,        // párrafo único, ≤120 palabras
  "steps": string[],        // 4–6 pasos accionables
  "competencia": [
    { "empresa": "string", "ciudad": "string", "segmento": "string",
      "propuesta": "string", "precio": "string", "canal": "string",
      "switching_cost": "Bajo|Medio|Alto", "moat": "string" }
  ],
  "regulacion": [
    { "area":"string", "que_aplica":"string", "requisito":"string",
      "plazo":"string", "riesgo":"Bajo|Medio|Alto", "accion":"string" }
  ]
}
Reglas:
- No incluyas URLs ni comentarios fuera del JSON.
- En 'competencia', si no hay marcas confiables, usa tipologías (Apps IA, Consultores, Agencias, DIY, etc.) rellenando todos los campos.
`;

  const user = [
    `Idea: ${input.idea ?? ""}`,
    `Ubicación: ${input.ubicacion ?? ""}`,
    `Rubro: ${input.rubro ?? ""}`,
    input.ingresosMeta ? `Meta ingresos (CLP/mes): ${input.ingresosMeta}` : "",
    input.ticket ? `Ticket (CLP): ${input.ticket}` : "",
    input.costoUnit ? `Costo unitario (CLP): ${input.costoUnit}` : "",
    input.gastosFijos ? `Gastos fijos (CLP/mes): ${input.gastosFijos}` : "",
    input.marketingMensual ? `Marketing (CLP/mes): ${input.marketingMensual}` : "",
    "",
    "Devuelve el JSON EXACTO con el esquema anterior.",
  ].filter(Boolean).join("\n");

  try {
    const r = await client.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      max_tokens: 900,
    });

    const raw = r.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw) return json({ ok: false, error: "empty_output_text" }, 502);

    const data = pickJson(raw) ?? {};

    // --- Normalización salida ---
    const title: string = (data.title || "Plan").toString();
    const steps: string[] = Array.isArray(data.steps)
      ? data.steps.map((s: any) => (s ?? "").toString()).filter(Boolean).slice(0, 6)
      : [];

    let plan100: string = (data.plan100 || data.summary || "").toString();
    plan100 = limitWords(plan100, 120);

    const rubro = String(input.rubro || "negocio");
    const ciudad = String(input.ubicacion || "tu ciudad");

    // Competencia: si no viene, tipologías por defecto
    let competencia = Array.isArray(data.competencia) ? data.competencia : [];
    if (competencia.length === 0) {
      competencia = [
        { empresa: "Apps de evaluación con IA", ciudad, segmento: rubro, propuesta: "Velocidad y bajo costo", precio: "$3–7 mil", canal: "Web", switching_cost: "Bajo", moat: "UX/automatización" },
        { empresa: "Consultores independientes", ciudad, segmento: rubro, propuesta: "Asesoría personalizada", precio: "$20–100 mil", canal: "LinkedIn/redes", switching_cost: "Medio", moat: "Reputación" },
        { empresa: "Agencias de innovación", ciudad, segmento: rubro, propuesta: "Programas/talleres", precio: "$200 mil+/mes", canal: "B2B", switching_cost: "Alto", moat: "Relaciones" },
        { empresa: "Plantillas/DIY (Notion/Gumroad)", ciudad, segmento: rubro, propuesta: "Hazlo tú mismo", precio: "$5–15 mil", canal: "Marketplace", switching_cost: "Bajo", moat: "Comunidad/contenido" },
        { empresa: "Incubadoras/Universidades", ciudad, segmento: rubro, propuesta: "Acompañamiento/gratuito", precio: "Subvencionado", canal: "Institucional", switching_cost: "Alto", moat: "Comunidad/credibilidad" },
      ];
    }

    // Regulación: base + ajustes por rubro (sin duplicados)
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

    const plan = { title, summary: (data.summary || "").toString(), steps, plan100, competencia, regulacion };
    return json({ ok: true, plan, meta: { modelUsed: model } });

  } catch (e: any) {
    return json({ ok: false, error: "OpenAI request failed", details: String(e?.message ?? e) }, 500);
  }
}
