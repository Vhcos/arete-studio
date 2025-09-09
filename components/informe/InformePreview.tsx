"use client";

import { useEffect, useState } from "react";

type Plan = {
  title?: string;
  summary?: string;
  steps?: string[];
  competencia?: any[];
  regulacion?: any[];
};

export default function InformePreview() {
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    try {
      // 1) Preferimos el preview guardado en el paso 6
      const raw = localStorage.getItem("arete:planPreview");
      if (raw) {
        const parsed = JSON.parse(raw);
        const p = parsed?.plan ?? parsed;
        setPlan(p ?? null);
        return;
      }

      // 2) Fallback: si más adelante guardas el plan en otro key, se podría leer aquí
      // const raw2 = localStorage.getItem("arete:planFinal");
      // if (raw2) setPlan(JSON.parse(raw2));
    } catch {
      /* noop */
    }
  }, []);

  if (!plan) {
    return (
      <p className="text-sm text-slate-500">
        Aún no generas un plan con IA. Completa los pasos y presiona “Generar plan”.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="font-medium">{plan.title || "Plan preliminar"}</p>
        {plan.summary && <p className="text-slate-600 text-sm mt-1">{plan.summary}</p>}
      </div>

      {Array.isArray(plan.steps) && plan.steps.length > 0 && (
        <div>
          <p className="font-medium mb-1">Pasos sugeridos</p>
          <ol className="list-decimal ml-5 text-sm space-y-1">
            {plan.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

