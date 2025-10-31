"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/state/wizard-store";
import EconomicHeader from "@/components/wizard/EconomicHeader";
import UpsellBanner from "@/components/wizard/UpsellBanner";
import { PrevButton, NextButton } from "@/components/wizard/WizardNav";
import BotIcon from "@/components/icons/BotIcon";

/* ================= Confetti minimal sin libs ================= */
function ConfettiBurst({ show }: { show: boolean }) {
  const pieces = useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => {
      const left = Math.random() * 100;              // %
      const size = 6 + Math.random() * 8;            // px
      const delay = Math.random() * 0.8;             // s
      const dur = 1.8 + Math.random() * 1.6;         // s
      const rot = Math.random() > 0.5 ? 360 : -360;
      const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#a855f7", "#ec4899"];
      const bg = colors[i % colors.length];
      const opacity = 0.75 + Math.random() * 0.25;
      return { left, size, delay, dur, rot, bg, opacity, id: i };
    });
  }, []);

  if (!show) return null;
  return (
    <>
      <style jsx>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-15vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(105vh) rotate(var(--rot)); opacity: 0.85; }
        }
      `}</style>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
      >
        {pieces.map((p) => (
          <span
            key={p.id}
            className="absolute top-0 rounded-sm shadow-sm"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 2.2,
              background: p.bg,
              opacity: p.opacity,
              animation: `confettiFall ${p.dur}s ease-in forwards`,
              animationDelay: `${p.delay}s`,
              transform: "translateY(-15vh)",
              // @ts-ignore
              ["--rot" as any]: `${p.rot}deg`,
            }}
          />
        ))}
      </div>
    </>
  );
}

/* ================= Tarjeta compacta ================= */
function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm ring-1 ring-slate-900/5">
      <div className="border-b bg-slate-50 px-4 py-2.5 text-center">
        <h3 className="text-sm font-semibold tracking-wide text-slate-800">
          {title}
        </h3>
      </div>
      <div className="p-4 text-[15px] leading-relaxed text-slate-800">{children}</div>
    </div>
  );
}

/* ================= Página ================= */
export default function Step11Page() {
  const router = useRouter();
  const { data } = useWizardStore();

  const s1 = (data as any)?.step1 ?? {};
  const s2 = (data as any)?.step2 ?? {};
  const s3 = (data as any)?.step3 ?? {};
  const s6 = (data as any)?.step6 ?? {};

  const projectName: string = s1.projectName ?? "—";
  const idea: string = s1.idea ?? "—";
  const sectorId: string = s2.sectorId ?? "—";
  const ventajaTexto: string = s3.ventajaTexto ?? "—";

  /* Confetti: dispara 2.5s al entrar */
  const [boom, setBoom] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setBoom(false), 2500);
    return () => clearTimeout(t);
  }, []);

  function onNext() {
    try {
      const meta = {
        projectName,
        founderName: s1.founderName ?? "",
        email: s1.notifyEmail ?? "",
        idea,
        ventajaTexto,
        sectorId,
        inversionInicial: s6.inversionInicial ?? null,
        ventaMensual:
          s6.ventaMensual ?? (typeof s6.ventaAnio1 === "number" ? Math.round(s6.ventaAnio1 / 12) : null),
        ventaAnio1:
          s6.ventaAnio1 ?? (typeof s6.ventaMensual === "number" ? Math.round(s6.ventaMensual * 12) : null),
        ticket: s6.ticket ?? null,
        gastosFijosMensuales: s6.gastosFijosMensuales ?? null,
        costoVarUnit: s6.costoVarUnit ?? null,
        costoVarPct: s6.costoVarPct ?? null,
        marketingMensual: s6.presupuestoMarketing ?? s6.marketingMensual ?? null,
      };

      localStorage.setItem(
        "arete:fromWizard",
        JSON.stringify({ meta, steps: ["step-1","step-2","step-3","step-6","step-10","step-11"] })
      );

      const APP = process.env.NEXT_PUBLIC_APP_ORIGIN ?? "";
      if (APP) router.replace(`${APP}/informe`);
      else router.replace("/informe");
    } catch (e) {
      console.error("[Wizard] step-11 onNext", e);
      router.replace("/informe");
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-3 py-8">
      <ConfettiBurst show={boom} />

      <EconomicHeader
        title="Paso 11 · ¡Listo has llegado! 🎉"
        subtitle="Estas a un paso de generar tu informe con la ayuda de IA Aret3 Felicitaciones !!!!."
      />

      {/* Tarjetas 2×2 (en móvil: 1×4) */}
      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard title="Proyecto">
          <div className="text-lg font-semibold">{projectName}</div>
        </InfoCard>

        <InfoCard title="Sector">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            {sectorId}
          </div>
        </InfoCard>

        <InfoCard title="Descripción">
          <p className="whitespace-pre-wrap">{idea}</p>
        </InfoCard>

        <InfoCard title="Ventaja">
          <p className="whitespace-pre-wrap">{ventajaTexto}</p>
        </InfoCard>
      </section>

      {/* CTA / navegación */}
<div className="mt-6 flex items-center justify-between">
  <PrevButton href="/wizard/step-10" />

  <button
    type="button"
    onClick={onNext}
    className="w-full sm:w-auto inline-flex items-center justify-center gap-2
               rounded-xl border border-transparent appearance-none
               px-5 py-3 text-base font-semibold
               bg-emerald-600 text-white shadow-sm
               hover:bg-emerald-700 active:bg-emerald-800
               focus:outline-none focus:ring-2 focus:ring-emerald-400"
  >
    <BotIcon className="w-10 h-10" variant="t3" />
    <span>Vamos al Informe prueba IA Aret3</span>
  </button>
</div>



      <div className="mt-4">
        <UpsellBanner />
      </div>

      {/* Nota final */}
      <p className="mt-3 text-center text-xs text-slate-500">
        El Informe usará todos los datos que completaste en el asistente.
      </p>
    </main>
  );
}
