// app/wizard/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { ProgressHeader } from "@/components/wizard/ProgressHeader";


export default function WizardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-30">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <ProgressHeader />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="bg-white shadow-sm rounded-2xl p-6">{children}</div>
      </main>
    </div>
  );
}
