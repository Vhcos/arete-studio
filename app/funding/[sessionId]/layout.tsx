//app/funding/[sessionId]/layout.tsx
import type { ReactNode } from "react";
import FundingProgressHeaderAuto from "@/components/funding/FundingProgressHeaderAuto";

export default function FundingSessionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-30">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <FundingProgressHeaderAuto />
        </div>
      </header>

      {/* OJO: no envuelvo en card, porque tus páginas Funding ya traen <Card> propio */}
      <main>{children}</main>
    </div>
  );
}
