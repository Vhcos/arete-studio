"use client";
import { usePathname } from "next/navigation";

const steps = [
  { slug: "/wizard/step-1", label: "Datos" },
  { slug: "/wizard/step-2", label: "Tipo" },
  { slug: "/wizard/step-3", label: "Contexto" },
  { slug: "/wizard/step-4", label: "Confirmar" },
];

export function ProgressHeader() {
  const pathname = usePathname();
  const idx = steps.findIndex(s => pathname?.startsWith(s.slug));
  const currentIndex = idx === -1 ? 0 : idx;
  const pct = Math.round(((currentIndex + 1) / steps.length) * 100);

  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
        <span>Progreso</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden" aria-label={`Progreso ${pct}%`}>
        <div className="h-2 bg-slate-900" style={{ width: `${pct}%` }} />
      </div>
      <ul className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
        {steps.map((s, i) => (
          <li key={s.slug} className={`truncate ${i <= currentIndex ? "text-slate-900" : ""}`}>{s.label}</li>
        ))}
      </ul>
    </div>
  );
}
