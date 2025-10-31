// app/components/CreditsRefreshHook.tsx
"use client";
import { useEffect } from "react";

export default function CreditsRefreshHook() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.toString()
          : input.url;

      // Endpoints que consumen créditos
      const isBillingTrigger =
        url.includes("/api/evaluate") ||
        url.includes("/api/plan") ||
        url.includes("/api/ai/idea-improve") || // por si acaso
        url.includes("/api/ai/step6-suggest") || // Step-6 IA
        url.includes("/api/competitive-intel");  // fallback anterior

      try {
        const res = await originalFetch(input, init);
        if (isBillingTrigger) {
          queueMicrotask(() => {
            // compat anterior
            window.dispatchEvent(new Event("credits:refresh"));
            // mismo patrón usado en Step-2/4
            window.dispatchEvent(new Event("focus"));
          });
        }
        return res;
      } catch (e) {
        if (isBillingTrigger) {
          queueMicrotask(() => {
            window.dispatchEvent(new Event("credits:refresh"));
            window.dispatchEvent(new Event("focus"));
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
