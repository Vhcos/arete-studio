export function getJSON<T = any>(key: string): T | null {
  try { return JSON.parse(localStorage.getItem(key) || "null"); }
  catch { return null; }
}

export function setJSON(key: string, value: any) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch {}
}

export function getLegacyForm<T = any>() {
  return getJSON<T>("arete:legacyForm") ?? getJSON<T>("arete:form");
}
export function setLegacyForm(v: any) {
  setJSON("arete:legacyForm", v);
  // mantenemos compatibilidad con el nombre antiguo
  if (!getJSON("arete:form")) setJSON("arete:form", v);
}

export function getPlanPreview<T = any>() {
  return getJSON<T>("arete:planPreview");
}
export function setPlanPreview(v: any) {
  setJSON("arete:planPreview", v);
}
