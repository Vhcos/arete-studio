import { SECTORS, SectorId } from "@/lib/domain/sectors";

export type SectorSuggestion = { id: SectorId; label: string; reason: string };

export function suggestSectors(input: {
  projectName?: string;
  idea?: string;
  sector?: string;
}): SectorSuggestion[] {
  const hay = (s?: string) => (s || "").toLowerCase();
  const text = [input.projectName, input.idea, input.sector].map(hay).join(" ");
  if (!text.trim()) return [];

  const scored = SECTORS
    .map(s => ({
      id: s.id as SectorId,
      label: s.label,
      score: s.keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0),
    }))
    .filter(s => s.score > 0)
    .sort((a,b) => b.score - a.score);

  if (scored.length === 0) {
    return [
      { id: "tech_saas", label: "Tecnología / SaaS", reason: "Opción flexible para software." },
      { id: "services_pro", label: "Servicios profesionales / Agencia", reason: "Si prestas asesorías/servicios." },
    ];
  }

  return scored.slice(0,3).map(s => ({ id: s.id, label: s.label, reason: "Detectado por palabras clave." }));
}
