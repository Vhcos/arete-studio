// lib/gtm.ts
export function gtmPush(event: string, params: Record<string, any> = {}) {
  if (typeof window === "undefined") return;
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push({ event, ...params });
}
