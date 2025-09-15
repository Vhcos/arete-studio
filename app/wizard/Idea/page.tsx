import { Suspense } from "react";
import IdeaClient from "./IdeaClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500 text-sm">Cargando…</div>}>
      <IdeaClient />
    </Suspense>
  );
}
