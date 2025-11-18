// lib/creditGuard.ts
export class InsufficientCreditsError extends Error {
  name = "InsufficientCreditsError";
  status?: number;
  constructor(msg: string, status?: number) {
    super(msg); this.status = status;
  }
}

export function openCreditsModal(source?: string, status?: number) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("aret3:openCreditsModal", { detail: { source, status } }));
  }
}

export async function guardCreditsIA(r: Response, source?: string) {
  if (!r.ok && (r.status === 402 || r.status === 403 || r.status === 429)) {
    openCreditsModal(source, r.status);
    throw new InsufficientCreditsError("Créditos insuficientes", r.status);
  }
  // otros errores (500, etc.) se gestionan arriba
}

export async function readJsonSafe(r: Response) {
  const ct = r.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null;
  try { return await r.clone().json(); } catch { return null; }
}
