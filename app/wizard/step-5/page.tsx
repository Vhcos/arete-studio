// app/wizard/step-5/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { Step5Schema } from "@/lib/validation/wizard-extra";
import UpsellBanner from "@/components/wizard/UpsellBanner";
import EconomicHeader from "@/components/wizard/EconomicHeader";
import { NextButton, PrevButton } from "@/components/wizard/WizardNav";
import BotIcon from "@/components/icons/BotIcon";

/* --------- Definición de campos (mantiene tus keys) --------- */
type K =
  | "urgencia"
  | "accesibilidad"
  | "competencia"
  | "experiencia"
  | "pasion"
  | "planesAlternativos"
  | "toleranciaRiesgo"
  | "testeoPrevio"
  | "redApoyo";

type Item = { key: K; label: string; hint: string; group: "idea" | "ejecucion" };

function getDefault() {
  return {
    urgencia: 0,
    accesibilidad: 0,
    competencia: 0,
    experiencia: 0,
    pasion: 0,
    planesAlternativos: 0,
    toleranciaRiesgo: 0,
    testeoPrevio: 0,
    redApoyo: 0,
  };
}

/* === Normalizador: trae cualquier valor viejo (0–10) a escala 1–3 === */
function toScale3(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;     // 0 = sin responder
  if (n <= 1) return 1;
  if (n <= 2) return 2;
  return 3; // todo lo >2 (incluye 3..10) se fija en 3
}
function normalizeToScale3(obj: Record<string, unknown>) {
  const base = getDefault();
  (Object.keys(base) as K[]).forEach((k) => {
    base[k] = toScale3(obj?.[k]);
  });
  return base;
}

const FIELDS: Item[] = [
  { key: "urgencia", label: "Tu idea resuelve un problema", hint: "¿nace de observar a tu cliente?", group: "idea" },
  { key: "experiencia", label: "Tu experiencia en el rubro", hint: "¿has trabajado/estudiado aquí?", group: "idea" },
  { key: "competencia", label: "Competencia (1=alta, 3=baja)", hint: "¿cuántos y cuán fuertes son?", group: "idea" },
  { key: "accesibilidad", label: "Accesibilidad al cliente", hint: "ubicación/canales de llegada", group: "ejecucion" },
  { key: "toleranciaRiesgo", label: "Tolerancia al riesgo", hint: "¿cómo afrontas pérdidas/problemas?", group: "ejecucion" },
  { key: "pasion", label: "Pasión/compromiso", hint: "¿cuánto te moverás por esto?", group: "ejecucion" },
  { key: "testeoPrevio", label: "Testeo previo", hint: "entrevistas, encuestas, prototipos", group: "ejecucion" },
  { key: "redApoyo", label: "Red de apoyo", hint: "mentores, socios, familia", group: "ejecucion" },
  { key: "planesAlternativos", label: "Planes alternativos", hint: "plan B ante trabas", group: "ejecucion" },
];

/* --------- Chips cuadrados 1–3 con color --------- */
function Likert3Squares({
  value,
  onChange,
  name,
}: {
  value: number;
  onChange: (v: number) => void;
  name: string;
}) {
  const opts = [1, 2, 3] as const;
  const activeCls = (v: number) =>
    v === 1
      ? "bg-red-100 border-red-500 text-red-800"
      : v === 2
      ? "bg-amber-100 border-amber-500 text-amber-800"
      : "bg-emerald-100 border-emerald-500 text-emerald-800";

  return (
    <div className="flex items-center gap-2" role="radiogroup" aria-label={name}>
      {opts.map((v) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            className={[
              "h-10 w-10 md:h-11 md:w-11 aspect-square rounded-md",
              "border text-sm md:text-base font-semibold",
              "shadow-sm transition-colors",
              active
                ? activeCls(v)
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400",
            ].join(" ")}
          >
            {v}
          </button>
        );
      })}
      <span className="ml-2 text-[12px] md:text-sm text-slate-500">1 = nada · 3 = mucho</span>
    </div>
  );
}

export default function Step5Page() {
  const router = useRouter();
  const { data, setStep5 } = useWizardStore();

  // Normalizamos lo que venga del store (0–10 → 1–3)
  const [local, setLocal] = useState(
    normalizeToScale3({ ...(data.step5 ?? {}) }) // si no hay datos, quedará todo 0
  );
  const [err, setErr] = useState<string | null>(null);

  const answeredCount = useMemo(
    () => Object.values(local).filter((v) => Number(v) >= 1 && Number(v) <= 3).length,
    [local]
  );

  // Índice 0–100 usando escala 1–3 (0 = sin responder)
  const score = useMemo(() => {
    const answered = Object.values(local)
      .map((v) => Number(v))
      .filter((n) => n >= 1 && n <= 3);
    const sum = answered.reduce((a, b) => a + b, 0);
    const max = answered.length * 3 || 1;
    const idx = Math.round((sum / max) * 100);
    return { sum, idx };
  }, [local]);

  function onNext() {
    // Validamos tipo/forma (el schema ya espera números)
    const parsed = Step5Schema.safeParse(local);
    if (!parsed.success) {
      setErr("Revisa los valores (elige entre 1, 2 o 3).");
      return;
    }
    setErr(null);
    // Guardamos normalizado por si había residuos viejos
    setStep5(normalizeToScale3(parsed.data as any));
    router.push("/wizard/step-6");
  }

  const groupIdea = FIELDS.filter((f) => f.group === "idea");
  const groupExe = FIELDS.filter((f) => f.group === "ejecucion");

  return (
    <main className="mx-auto max-w-7xl px-3 py-8">
      <EconomicHeader
        title="Paso 5 · Emocional"
        subtitle="Elige 1, 2 o 3 para cada aspecto. Esto nos ayuda a darte recomendaciones accionables."
      />

      {/* Cómo responder + índice preview */}
      <section className="mx-auto mt-6 max-w-3xl rounded-xl border-2 border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5 p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="text-[15px] md:text-base">
            <div className="font-semibold text-slate-900">Cómo responder</div>
            <ul className="list-disc pl-5 mt-1 text-slate-700 space-y-1">
              <li><strong>1</strong> = nada, <strong>2</strong> = medio, <strong>3</strong> = mucho.</li>
              <li>Responde rápido; podrás cambiarlo después.</li>
              <li>Usaremos esto en tu Tablero e Informe final.</li>
            </ul>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Completado</div>
            <div
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-slate-700 ring-1 ring-slate-900/5"
              aria-live="polite"
            >
              {answeredCount}/{FIELDS.length} listos ✓
            </div>
            <div className="mt-2 text-xs text-slate-500">Índice emprendedor</div>
            <div className="text-xl md:text-2xl font-bold text-slate-800">{score.idx}%</div>
          </div>
        </div>
      </section>

      {/* Bloque 1: Fundamento de la idea */}
      <section className="mx-auto mt-6 max-w-3xl rounded-xl border-2 border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5 p-6">
        <h2 className="text-lg md:text-xl font-semibold text-slate-900">
          Fundamento de la idea
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-5">
          {groupIdea.map((f) => (
            <div key={f.key} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-base md:text-lg font-medium text-slate-900">{f.label}</div>
              <div className="text-sm md:text-base text-slate-600 mb-3">{f.hint}</div>
              <Likert3Squares
                name={f.label}
                value={local[f.key] as number}
                onChange={(v) => setLocal((s) => ({ ...s, [f.key]: v }))}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Bloque 2: Ejecución y soporte */}
      <section className="mx-auto mt-6 max-w-3xl rounded-xl border-2 border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5 p-6">
        <h2 className="text-lg md:text-xl font-semibold text-slate-900">
          Ejecución y soporte
        </h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
          {groupExe.map((f) => (
            <div key={f.key} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-base md:text-lg font-medium text-slate-900">{f.label}</div>
              <div className="text-sm md:text-base text-slate-600 mb-3">{f.hint}</div>
              <Likert3Squares
                name={f.label}
                value={local[f.key] as number}
                onChange={(v) => setLocal((s) => ({ ...s, [f.key]: v }))}
              />
            </div>
          ))}
        </div>
      </section>

      {err && <p className="mt-3 text-sm text-red-600 text-center">{err}</p>}

      <div className="mt-6 flex items-center justify-between max-w-3xl mx-auto">
        <PrevButton href="/wizard/step-4" />
        <NextButton onClick={onNext} />
      </div>

      <div className="max-w-3xl mx-auto mt-4">
        <UpsellBanner />
      </div>

      <p className="mt-4 text-xs text-slate-500 text-center">
        Nota: la generación con{" "}
        <span className="inline-flex items-center gap-1 font-medium">
          <BotIcon className="w-3.5 h-3.5" variant="t3" /> IA Aret3
        </span>{" "}
        se hará al final, en el Informe.
      </p>
    </main>
  );
}
