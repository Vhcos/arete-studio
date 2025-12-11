// lib/bridge/wizard-to-legacy.ts
// Mapea los datos del Wizard al "formulario legacy" que usa app/page.tsx

import {
  WizardData,
  WizardDataSchema,
  Step6Schema,
  deriveCostoUnit,
} from "@/lib/validation/wizard-extra";

/* ===== Tipos del formulario legacy (lo que hidrata app/page.tsx) ===== */

export interface LegacyPlan {
  // economía
  inversionInicial: number;
  capitalTrabajo: number;

  ventaAnual: number; // == ingresos meta 12m
  ticket: number;
  convPct: number; // % conversión

  costoPct: number; // % del precio (solo por referencia)
  costoUnit: number; // costo variable unitario ($)

  traficoMensual: number;
  gastosFijos: number; // $/año
  marketingMensual: number; // $/mes
  ingresosMeta: number; // alias de ventaAnual

  // métricas de frecuencia y P.E.
  frecuenciaAnual: number; // veces/año (12 / meses)
  mesesPE: number;
}

export interface LegacyForm {
  // cabecera
  projectName: string;
  founderName: string;
  email: string;

  // contexto corto
  idea: string;
  ventajaTexto: string;
  sectorId: string;
  rubro: string;
  ubicacion: string;

  // cualitativos (Paso 5)
  urgencia?: number;
  accesibilidad?: number;
  competencia?: number;
  experiencia?: number;
  pasion?: number;
  planesAlternativos?: number;
  toleranciaRiesgo?: number;
  testeoPrevio?: number;
  redApoyo?: number;

  // bloque económico calculado
  plan: LegacyPlan;

  // --- NUEVO: benchmark de ventas (IA Step-6) guardado para el informe ---
  ventasIAExplicacion?: string;
  ventasIAFuentes?: { title?: string; url: string }[];

  // meta
  meta: {
    savedAt: string;
    source: "wizard";
  };
}

/* ====== Mapper principal ====== */

export function toLegacyForm(input: unknown): LegacyForm {
  // Validamos estructura flexible del wizard
  const parsed = WizardDataSchema.safeParse(input);

  // Si no viene todo completo, intentamos como mínimo parsear step6
  const s1 = parsed.success ? parsed.data.step1 : undefined;
  const s2 = parsed.success ? parsed.data.step2 : undefined;
  const s5 = parsed.success ? parsed.data.step5 : undefined;
  const s6 = parsed.success
    ? parsed.data.step6
    : Step6Schema.parse((input as any)?.step6 ?? {});

  // Derivados económicos
  const costoUnit = deriveCostoUnit(s6);
  const gastosFijosAnio = Math.round((s6.gastosFijosMensuales ?? 0) * 12);
  const marketingMensual = Math.round(
    s6.presupuestoMarketing ?? s6.marketingMensual ?? 0
  );
  const frecuenciaAnual =
    s6.frecuenciaCompraMeses && s6.frecuenciaCompraMeses > 0
      ? Math.max(1, Math.round(12 / s6.frecuenciaCompraMeses))
      : 6;

  const mesesPE = s6.mesesPE ?? 6;

  // Reconstrucción de ubicación desde step2
  const ubicacionFromStep2 = (() => {
    const s2any = s2 as any;
    if (!s2any) return "";

    // 1) Si ya viene ubicacion y no está vacía, úsala tal cual
    if (s2any.ubicacion && String(s2any.ubicacion).trim()) {
      return String(s2any.ubicacion).trim();
    }

    // 2) Intentar reconstruir con ciudad + país
    const city = s2any.city || s2any.ciudad || "";

    const countryCodeRaw = (
      s2any.countryCode ||
      s2any.pais ||
      ""
    )
      .toString()
      .toUpperCase();

    const COUNTRY_NAMES: Record<string, string> = {
      CL: "Chile",
      CO: "Colombia",
      MX: "México",
      AR: "Argentina",
      PE: "Perú",
      UY: "Uruguay",
      PY: "Paraguay",
      BO: "Bolivia",
      EC: "Ecuador",
    };

    const countryName =
      COUNTRY_NAMES[countryCodeRaw] ||
      (typeof s2any.pais === "string" ? s2any.pais : "");

    const parts = [city, countryName].filter(Boolean);

    if (parts.length) {
      return parts.join(", ");
    }

    // 3) Último recurso: region o vacío
    return (s2any.region as string) || "";
  })();

  // Construcción del objeto legacy
  const legacy: LegacyForm = {
    // Cabecera
    projectName: s1?.projectName ?? "",
    founderName: s1?.founderName ?? "",
    email: s1?.email ?? "",

    // Contexto
    idea: s2?.idea ?? "",
    ventajaTexto: s2?.ventajaTexto ?? "",
    sectorId: s2?.sectorId ?? "",
    rubro: s2?.rubro ?? "",
    ubicacion: ubicacionFromStep2,

    // Cualitativos (opcional)
    urgencia: s5?.urgencia,
    accesibilidad: s5?.accesibilidad,
    competencia: s5?.competencia,
    experiencia: s5?.experiencia,
    pasion: s5?.pasion,
    planesAlternativos: s5?.planesAlternativos,
    toleranciaRiesgo: s5?.toleranciaRiesgo,
    testeoPrevio: s5?.testeoPrevio,
    redApoyo: s5?.redApoyo,

    // Económico
    plan: {
      inversionInicial: Math.round(s6.inversionInicial ?? 0),
      capitalTrabajo: Math.round(s6.capitalTrabajo ?? 0),

      ventaAnual: Math.round(s6.ventaAnual ?? 0),
      ticket: Math.round(s6.ticket ?? 0),
      convPct: Math.round(s6.conversionPct ?? 0),

      costoPct: Math.round(s6.costoVarPct ?? 0),
      costoUnit,

      traficoMensual: Math.round(s6.traficoMensual ?? 0),
      gastosFijos: gastosFijosAnio,
      marketingMensual,
      ingresosMeta: Math.round(s6.ventaAnual ?? 0),

      frecuenciaAnual,
      mesesPE,
    },

    // Benchmark de ventas (IA Step-6) que guardaste en Step6Page
    ventasIAExplicacion: (s6 as any).ventasIAExplicacion ?? undefined,
    ventasIAFuentes: (s6 as any).ventasIAFuentes ?? undefined,

    meta: {
      savedAt: new Date().toISOString(),
      source: "wizard",
    },
  };

  return legacy;
}

/* Guarda en localStorage y devuelve el objeto legacy */
export function writeLegacyFormToStorage(input: unknown): LegacyForm {
  const legacy = toLegacyForm(input);
  try {
    localStorage.setItem("arete:legacyForm", JSON.stringify(legacy));
  } catch {
    // no-op en SSR / storage bloqueado
  }
  return legacy;
}

/* A partir de un legacy ya guardado, crea el payload que consume /api/plan */
export function planPreviewPayloadFromLegacy(legacy: LegacyForm) {
  return {
    projectName: legacy.projectName || "Proyecto",
    sectorId: legacy.sectorId || "tech_saas",
    input: {
      ticket: legacy.plan.ticket,
      costoUnit: legacy.plan.costoUnit,
      ingresosMeta: legacy.plan.ingresosMeta,
      gastosFijos: legacy.plan.gastosFijos,
      marketingMensual: legacy.plan.marketingMensual,
      costoPct: legacy.plan.costoPct,
    },
  };
}
