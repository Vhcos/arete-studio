"use client";
import { useEffect } from "react";

export default function CreditsRefreshHook() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const isBillingTrigger =
        url.includes("/api/evaluate") || url.includes("/api/plan");

      try {
        const res = await originalFetch(input, init);
        // Si la llamada fue una de IA y NO falló por red, refrescamos créditos
        if (isBillingTrigger) {
          // espera a que el servidor haya terminado (ya debitó o reembolsó)
          queueMicrotask(() => {
            window.dispatchEvent(new Event("credits:refresh"));
          });
        }
        return res;
      } catch (e) {
        // Incluso si falló por red, puede haber debitado antes -> refrescamos igual
        if (isBillingTrigger) {
          queueMicrotask(() => {
            window.dispatchEvent(new Event("credits:refresh"));
          });
        }
        throw e;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
