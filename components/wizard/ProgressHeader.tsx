// components/wizard/ProgressHeader.tsx
"use client";
import { usePathname } from "next/navigation";

const STEPS = [
  { slug:"step-1", label:"Datos" },
  { slug:"step-2", label:"Idea" },
  { slug:"step-3", label:"Rubro" },
  { slug:"step-4", label:"Ventaja" },
  { slug:"step-5", label:"Emocional" },
  { slug:"step-6", label:"Economico" },
  { slug:"step-7", label:"Confirmar" },
];

export function ProgressHeader() {
  const p = usePathname() || "";
  const idx = Math.max(0, STEPS.findIndex(s => p.includes(s.slug)));
  const pct = Math.round(((idx+1) / STEPS.length) * 100);

  return (
    <div className="px-4 py-3 border-b">
      <div className="max-w-5xl mx-auto">
        <div className="w-full h-1 bg-slate-200 rounded">
          <div className="h-1 bg-slate-900 rounded" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex gap-4 text-xs text-slate-600">
          {STEPS.map((s,i) => (
            <span key={s.slug} className={i<=idx ? "font-medium text-slate-900" : ""}>{s.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
