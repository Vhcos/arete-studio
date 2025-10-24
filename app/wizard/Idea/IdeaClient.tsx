// app/wizard/idea/IdeaClient.tsx
"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function IdeaClient() {
  const sp = useSearchParams();                 // puede ser null según tu setup
  const router = useRouter();
  const get = (k: string) => sp?.get(k) ?? null;

  // Lee params de forma segura (ajusta los nombres a los que uses)
  const prefill = get("prefill") ?? get("p");
  const from = get("from"); // ej: "wizard" | "marketing" | etc.

  // TODO: aquí pon el contenido que ya tenías en /wizard/idea
  // si estabas pre-rellenando "idea" desde ?prefill=..., hazlo acá.
  // Ejemplo mínimo (sustituye por tu UI real):
  return (
    <section className="p-6">
      {/* ...tu formulario/step de idea... */}
      {/* {prefill && <p className="text-xs text-slate-500">Prefill: {prefill}</p>} */}
    </section>
  );
}
