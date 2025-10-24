// app/wizard/step-6/_components/EconomicHeader.tsx
"use client";

import React, { useMemo } from "react";

type Props = {
  sectorLabel: string;
  ventaMensual?: number | null;
  ticket?: number | null;
  profitTargetPct?: number;   // default 0.08
  equilibriumMonths?: number; // default 12
  title?: string;

};

export default function EconomicHeader({
  sectorLabel,
  ventaMensual,
  ticket,
  profitTargetPct = 0.08,
  equilibriumMonths = 12,
  title,
}: Props) {
  const clientesMes = useMemo(() => {
    if (!ventaMensual || !ticket || ticket <= 0) return null;
    const v = Math.floor(ventaMensual / ticket);
    return Number.isFinite(v) ? v : null;
  }, [ventaMensual, ticket]);

  return (
    <header className="mx-auto max-w-3xl text-center">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
        {title ?? "Paso Económico punto de partida tu capital y tus ventas"}
      </h1>
      {sectorLabel ? (
        <p className="mt-2 text-xs md:text-sm text-slate-500">
          Rubro: <span className="font-medium">{sectorLabel}</span>
        </p>
      ) : null}
    </header>
  );
}
