import { SECTORS, SECTOR_IDS, sectorById, templateForSector } from "@/lib/domain/sectors";

/** Devuelve el body normalizado sin romper el shape actual */
export function normalizePlanInput(raw: any) {
  // Texto libre para heurística (si no viene sectorId)
  const freeText = [raw?.sector, raw?.projectName, raw?.idea]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // a) Si viene sectorId válido: úsalo
  if (raw?.sectorId && SECTOR_IDS.includes(raw.sectorId)) {
    const s = sectorById(raw.sectorId)!;
    return {
      ...raw,
      sectorId: s.id,
      sector: s.label,                           // mantiene compatibilidad con tu código actual
      template: raw?.template ?? templateForSector(s.id),
    };
  }

  // b) Heurística liviana por keywords (no usa IA)
  for (const s of SECTORS) {
    if (s.keywords.some((kw: string) => freeText.includes(kw))) {
      return {
        ...raw,
        sectorId: s.id,
        sector: s.label,
        template: raw?.template ?? s.defaultTemplate,
      };
    }
  }

  // c) Fallback
  return {
    ...raw,
    sectorId: undefined,
    sector: raw?.sector ?? "General",
    template: raw?.template ?? "default",
  };
}
