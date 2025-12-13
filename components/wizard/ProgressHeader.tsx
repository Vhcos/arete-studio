//components/wizard/ProgressHeader.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type Step = { slug: string; label: string; abbr: string };

const STEPS: Step[] = [
  { slug: "step-1",  label: "Datos",           abbr: "Da." },
  { slug: "step-2",  label: "Idea",            abbr: "Id." },
  { slug: "step-3",  label: "Rubro",           abbr: "Ru." },
  { slug: "step-4",  label: "Ventaja",         abbr: "Ve." },
  { slug: "step-5",  label: "Emocional",       abbr: "Em." },
  { slug: "step-6",  label: "Económico",       abbr: "Ec." },
  { slug: "step-7",  label: "Clientes & P.E.", abbr: "Cl." },
  { slug: "step-8",  label: "EERR",            abbr: "ER." },
  { slug: "step-9",  label: "Flujo de caja",   abbr: "FC." },
  { slug: "step-10", label: "Revisión",        abbr: "Rv." },
  { slug: "step-11", label: "Confirmar",       abbr: "Co." },
];

function Rocket({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.9 2.1c3.1.1 6.7 2.6 7 5.7.1 1.2-.2 2.2-.9 2.9l-4.1 4.1c-.3.3-.5.7-.6 1.1l-.3 1.6c-.1.7-.7 1.3-1.4 1.4l-1.6.3c-.4.1-.8.3-1.1.6l-1.1 1.1c-.8.8-2.2.5-2.6-.6l-.6-1.6-1.6-.6c-1.1-.4-1.4-1.8-.6-2.6l1.1-1.1c.3-.3.5-.7.6-1.1l.3-1.6c.1-.7.7-1.3 1.4-1.4l1.6-.3c.4-.1.8-.3 1.1-.6l4.1-4.1c.7-.7 1.7-1 2.9-.9ZM9 15.1l-1.2 1.2.3.8.8.3L10.1 16l-.2-1-1-.2Zm7.7-9.3c-.8-.8-2-.8-2.8 0s-.8 2 0 2.8 2 .8 2.8 0 .8-2 0-2.8Z" />
    </svg>
  );
}

export function ProgressHeader() {
  const pathname = usePathname() || "";
// último segmento del path, sin trailing slash
const currentSlug =
  pathname.replace(/\/+$/, "").split("/").filter(Boolean).pop() ?? "";

const currentIndex = Math.max(0, STEPS.findIndex((s) => s.slug === currentSlug));

  const total = Math.max(1, STEPS.length - 1);
  const pct = (currentIndex / total) * 100;

  return (
    <div className="px-4 py-3 border-b bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-7xl">
        {/* Barra + puntos + cohete */}
        <div className="relative">
          <div className="h-2 w-full rounded-full bg-slate-200" />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-300 via-sky-500 to-blue-600"
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute -top-3 -translate-x-1/2 text-blue-700 drop-shadow-sm animate-pulse"
            style={{ left: `calc(${pct}% )` }}
            aria-hidden
          >
            <Rocket />
          </div>

          {/* Puntos clicables */}
          {STEPS.map((step, i) => {
            const left = (i / total) * 100;
            const isDone = i < currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <Link
                key={step.slug}
                href={`/wizard/${step.slug}`}
                prefetch={false}
                className="absolute -top-[6px]"
                style={{ left: `${left}%`, transform: "translateX(-50%)" }}
                title={step.label}
              >
                <div
                  className={[
                    "w-5 h-5 rounded-full border bg-white flex items-center justify-center text-[10px]",
                    isDone
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : isCurrent
                      ? "border-blue-500 ring-4 ring-blue-200 text-blue-700"
                      : "border-slate-300 text-slate-400",
                  ].join(" ")}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isDone ? "✔" : i + 1}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Calugas móvil: abreviadas */}
        <div className="mt-3 grid grid-cols-6 gap-1 sm:hidden">
          {STEPS.map((s, i) => {
            const isPast = i < currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <Link
                key={s.slug}
                href={`/wizard/${s.slug}`}
                prefetch={false}
                className={[
                  "truncate text-center px-2 py-1 rounded-lg border text-[11px]",
                  isCurrent
                    ? "border-blue-400 bg-blue-50 text-blue-800 font-semibold"
                    : isPast
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 text-slate-600",
                ].join(" ")}
                aria-current={isCurrent ? "step" : undefined}
              >
                {s.abbr}
              </Link>
            );
          })}
        </div>

        {/* Calugas desktop: etiquetas completas */}
        <div className="mt-3 hidden sm:grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-11 gap-2 text-[11px]">
          {STEPS.map((s, i) => {
            const isPast = i < currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <Link
                key={s.slug}
                href={`/wizard/${s.slug}`}
                prefetch={false}
                className={[
                  "truncate px-2 py-1 rounded-lg border",
                  isCurrent
                    ? "border-blue-400 bg-blue-50 text-blue-800 font-semibold"
                    : isPast
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 text-slate-600",
                ].join(" ")}
                aria-current={isCurrent ? "step" : undefined}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ProgressHeader;
