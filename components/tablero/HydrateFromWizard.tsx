"use client";

import { useEffect } from "react";

type LegacyForm = {
  projectName?: string;
  shortDescription?: string;
  sectorId?: string;
  plan?: {
    ticket?: number;
    costoUnit?: number;
    ingresosMeta?: number;
    gastosFijos?: number;
    marketingMensual?: number;
    costoPct?: number;
  };
};

// Utilidad segura para leer JSON del localStorage
function readJSON<T = any>(key: string): T | null {
  try { return JSON.parse(localStorage.getItem(key) || "null"); }
  catch { return null; }
}

export default function HydrateFromWizard() {
  useEffect(() => {
    try {
      // Priorizamos la nueva clave; caemos a la anterior si existe
      const legacy: LegacyForm | null =
        readJSON<LegacyForm>("arete:legacyForm") ?? readJSON<LegacyForm>("arete:form");

      const plan: any = readJSON("arete:planPreview");

      if (!legacy) return;

      // Normalizamos y reescribimos ambas llaves para máxima compatibilidad
      localStorage.setItem("arete:legacyForm", JSON.stringify(legacy));
      if (!readJSON("arete:form")) {
        // Mantén también 'arete:form' por si tu Tablero antiguo la usa
        localStorage.setItem("arete:form", JSON.stringify(legacy));
      }

      // Exponer para depuración/uso opcional
      (window as any).__arete = { form: legacy, plan };

      // Notificar por evento (por si alguna parte de tu app quiere reaccionar)
      window.dispatchEvent(new CustomEvent("arete:hydrated", { detail: { legacy, plan } }));
    } catch (e) {
      console.error("[HydrateFromWizard] error:", e);
    }
  }, []);

  return null;
}
