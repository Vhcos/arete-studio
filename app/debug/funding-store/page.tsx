//app/debug/funding-store/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

function safeParse(raw: string | null) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return raw; }
}

export default function DebugFundingStorePage() {
  const [keys, setKeys] = useState<string[]>([]);
  const [dump, setDump] = useState<any>({});

  useEffect(() => {
    const k = Object.keys(window.localStorage || {}).sort();
    setKeys(k);

    const picked: any = {};
    for (const key of k.filter(x => x.toLowerCase().includes("arete") || x.toLowerCase().includes("wizard") || x.toLowerCase().includes("step"))) {
      picked[key] = safeParse(window.localStorage.getItem(key));
    }

    const globalAny = (window as any).__arete;
    setDump({
      window__arete_keys: globalAny ? Object.keys(globalAny) : null,
      window__arete_form: globalAny?.form ?? null,
      window__arete_plan: globalAny?.plan ?? null,
      localStorage_filtered: picked,
    });
  }, []);

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-xl font-semibold">Debug funding store</h1>
      <p className="text-sm text-slate-600">
        Muestra localStorage (keys relevantes) y window.__arete para ubicar Step9 / capitalTrabajo.
      </p>

      <div className="rounded-lg border bg-slate-50 p-3 text-xs">
        <div className="font-medium mb-2">Keys localStorage</div>
        <pre className="whitespace-pre-wrap break-words">{JSON.stringify(keys, null, 2)}</pre>
      </div>

      <div className="rounded-lg border bg-slate-50 p-3 text-xs">
        <div className="font-medium mb-2">Dump</div>
        <pre className="whitespace-pre-wrap break-words">{JSON.stringify(dump, null, 2)}</pre>
      </div>
    </main>
  );
}
