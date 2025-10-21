// app/wizard/step-6/_components/EconomicHeader.tsx
"use client";

import React, { useMemo } from "react";

type Props = {
  sectorLabel: string;
  ventaMensual?: number | null;
  ticket?: number | null;
  profitTargetPct?: number;   // default 0.08
  equilibriumMonths?: number; // default 12
};

export default function EconomicHeader({
  sectorLabel,
  ventaMensual,
  ticket,
  profitTargetPct = 0.08,
  equilibriumMonths = 12,
}: Props) {
  const clientesMes = useMemo(() => {
    if (!ventaMensual || !ticket || ticket <= 0) return null;
    const v = Math.floor(ventaMensual / ticket);
    return Number.isFinite(v) ? v : null;
  }, [ventaMensual, ticket]);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Paso 4 · Económico</h2>

      <p className="text-sm text-slate-700">
        <strong>Con 3–4 datos clave te armamos un presupuesto base para tu idea de negocio en {sectorLabel}.</strong>{" "}
        Usamos patrones del rubro, fijamos <strong>un objetivo editable de 8% de rentabilidad neta</strong> sobre ventas
        y te mostramos <strong>clientes/mes</strong>; <strong>y proyectamos</strong> que podrías tardar ~{equilibriumMonths} meses
        en alcanzar el punto de equilibrio, ESTO SERA tu capital de trabajo sugerido para el período inicial. Luego podrás
        <strong> ajustar todo</strong> en el Formulario.
      </p>

      <div className="flex flex-wrap gap-2">
        <span
          className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs"
          title="Meta inicial de utilidad neta sobre ventas; podrás modificarla luego."
        >
          🎯 Objetivo 8% (editable)
        </span>
        <span
          className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs"
          title="Tiempo estimado para que ventas = costos + gastos; ajustable según tu caso."
        >
          🧮 Equilibrio ~{equilibriumMonths} meses
        </span>
        <span
          className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs"
          title="Dinero estimado para operar hasta el equilibrio."
        >
          💼 Capital de trabajo estimado
        </span>
        {typeof clientesMes === "number" && (
          <span
            className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium"
            title="Calculamos clientes/mes = venta mensual ÷ ticket promedio."
          >
            👥 Clientes/mes estimados para cumplir <strong> TU META </strong>: {clientesMes}
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Tip: si ingresas <strong>solo la venta mensual</strong> calculamos la anual (×12), y viceversa. Usa miles con punto, ej: 2.000.000.
      </p>
    </div>
  );
}
