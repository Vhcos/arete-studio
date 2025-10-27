// components/wizard/EconomicHeader.tsx
"use client";
import * as React from "react";

type Props = {
  /** Título grande. Puede ser string o JSX. */
  title?: React.ReactNode;
  /** Subtítulo / descripción. Puede ser string o JSX (details, listas, etc.). */
  subtitle?: React.ReactNode;
  /** Chip de rubro (opcional). */
  sectorLabel?: string | null;
  /** Chip con venta mensual (opcional). */
  ventaMensual?: number | null;
  /** Chip con ticket promedio (opcional). */
  ticket?: number | null;
};

const fmtCL = (n: number) => n.toLocaleString("es-CL");

export default function EconomicHeader({
  title,
  subtitle,
  sectorLabel,
  ventaMensual,
  ticket,
}: Props) {
  return (
    <header className="mx-auto mb-4 max-w-5xl text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        {title ?? "Paso Económico"}
      </h1>

      {/* SUBTÍTULO: usar <div>, no <p>, para permitir <details>/<ol>/<summary> */}
      {subtitle && (
        <div className="mx-auto mt-1 max-w-3xl text-sm text-slate-600 [&_summary]:cursor-pointer">
          {subtitle}
        </div>
      )}

      {(sectorLabel || ventaMensual || ticket) && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {sectorLabel ? (
            <span className="rounded-full border bg-slate-50 px-3 py-1 text-xs">
              Rubro: <b>{sectorLabel}</b>
            </span>
          ) : null}

          {typeof ventaMensual === "number" && ventaMensual > 0 ? (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700">
              Venta mensual: <b>${fmtCL(ventaMensual)}</b>
            </span>
          ) : null}

          {typeof ticket === "number" && ticket > 0 ? (
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs text-indigo-700">
              Ticket: <b>${fmtCL(ticket)}</b>
            </span>
          ) : null}
        </div>
      )}
    </header>
  );
}
