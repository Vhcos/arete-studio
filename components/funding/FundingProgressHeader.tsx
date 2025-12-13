//compONENTS/FUNDING/FUNDINGPROGRESSHEADER.TSX
"use client";

import Link from "next/link";

type FundingStepId = "f1" | "f2" | "f3" | "f4" | "f5" | "f6" | "f7" | "f8";

type StepDef = {
  id: FundingStepId;
  label: string; // pill corto (F1, F2...)
  title: string; // tooltip
};

const STEPS: StepDef[] = [
  { id: "f1", label: "F1", title: "Inicio" },
  { id: "f2", label: "F2", title: "Estado del negocio" },
  { id: "f3", label: "F3", title: "Problema y solución" },
  { id: "f4", label: "F4", title: "Impacto" },
  { id: "f5", label: "F5", title: "Formulario 5" },
  { id: "f6", label: "F6", title: "Formulario 6" },
  { id: "f7", label: "F7", title: "Formulario 7" },
  { id: "f8", label: "F8", title: "Formulario 8" },
];

function hrefFor(sessionId: string, step: FundingStepId) {
  if (step === "f1") return `/funding/${sessionId}`;
  return `/funding/${sessionId}/${step}`;
}

export default function FundingProgressHeader({
  sessionId,
  current,
}: {
  sessionId: string;
  current: FundingStepId;
}) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  const total = STEPS.length;
  const currentHuman = currentIdx >= 0 ? currentIdx + 1 : 1;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
          {current.toUpperCase()} de F{total} · Progreso {currentHuman}/{total}
        </span>

        <span className="text-slate-400">
          ID sesión:{" "}
          <code className="font-mono text-[10px] bg-slate-50 px-1.5 py-0.5 rounded">
            {sessionId}
          </code>
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {STEPS.map((s, idx) => {
          const isCurrent = s.id === current;
          const isDone = idx < currentIdx;
          const isLocked = idx > currentIdx;

          const base =
            "inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-medium transition";

          if (isLocked) {
            return (
              <span
                key={s.id}
                title={`${s.title} (próximo)`}
                className={`${base} border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed`}
                aria-disabled="true"
              >
                {s.label}
              </span>
            );
          }

          const cls = isCurrent
            ? `${base} border-primary bg-primary text-white shadow-sm`
            : isDone
            ? `${base} border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100`
            : `${base} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;

          return (
            <Link
              key={s.id}
              href={hrefFor(sessionId, s.id)}
              title={s.title}
              className={cls}
              aria-current={isCurrent ? "step" : undefined}
            >
              {s.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
