// app/wizard/step-1/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { Step1Schema } from "@/lib/validation/wizard";
import { NextButton, PrevButton } from "@/components/wizard/WizardNav";
import UpsellBanner from "@/components/wizard/UpsellBanner";
import BotIcon from "@/components/icons/BotIcon";

const TOTAL_STEPS = 11;
const CURRENT_STEP = 1;

export default function Step1Page() {
  const router = useRouter();
  const searchParams = useSearchParams(); // NUNCA es null en App Router
  const { data, setStep1 } = useWizardStore();
  const { data: session } = useSession();
  const s1: any = data.step1 ?? {};

  // Soportamos ambos nombres: email | notifyEmail
  const existingEmail = (s1.notifyEmail ?? s1.email ?? "") as string;

  const [local, setLocal] = useState({
    projectName: (s1.projectName ?? "") as string,
    founderName: (s1.founderName ?? "") as string,
    email: existingEmail,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Ayudas contextuales
  const [helpProject, setHelpProject] = useState(false);
  const [helpFounder, setHelpFounder] = useState(false);
  const [helpEmail, setHelpEmail] = useState(false);

  // --- NUEVO: bind de organización por ?org=slug ---
  // --- NUEVO: bind de organización por ?org=slug ---
  const orgFromUrl = searchParams?.get("org") ?? null;
  const [orgBindState, setOrgBindState] = useState<
   "idle" | "binding" | "ok" | "error"
   >("idle");


  useEffect(() => {
    // Si no viene ?org, no hacemos nada
    if (!orgFromUrl) return;
    // Evitamos repetir la llamada
    if (orgBindState !== "idle") return;

    setOrgBindState("binding");

    void fetch("/api/client/bind", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org: orgFromUrl }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          console.error("[step-1] fallo bind client:", data);
          setOrgBindState("error");
          return;
        }
        setOrgBindState("ok");
      })
      .catch((err) => {
        console.error("[step-1] error de red en bind client:", err);
        setOrgBindState("error");
      });
  }, [orgFromUrl, orgBindState]);
  // --- FIN NUEVO ---

  // Autofill desde sesión si falta
  useEffect(() => {
    const e = session?.user?.email;
    if (e && !local.email) {
      setLocal((prev) => ({ ...prev, email: e }));
    }
  }, [session?.user?.email, local.email]);

  const progressPercent = useMemo(
    () => Math.round((CURRENT_STEP / TOTAL_STEPS) * 100),
    []
  );

  function onNext() {
    const parsed = Step1Schema.safeParse({
      projectName: local.projectName,
      founderName: local.founderName,
      email: local.email,
      ubicacion: s1.ubicacion ?? "",
    });

    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (e[i.path.join(".")] = i.message));
      setErrors(e);
      return;
    }

    setStep1(
      {
        ...(data.step1 ?? {}),
        ...parsed.data,
        email: local.email,
        notifyEmail: local.email,
      } as any
    );

    router.push("/wizard/step-2");
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)]">
      {/* Contenido principal */}
      <div className="mx-auto max-w-screen-md px-4 pb-16 pt-6">
        {/* Progreso visual del paso 1/11 */}
        <div
          className="mb-4"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
          aria-label={`Progreso ${CURRENT_STEP} de ${TOTAL_STEPS}`}
        >
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-[width]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-1 text-right text-xs text-slate-500">
            Paso {CURRENT_STEP} de {TOTAL_STEPS}
          </div>
        </div>

        {/* Encabezado cálido y centrado */}
        <header className="text-center">
          <div className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
            <span className="text-lg" aria-hidden>
              📝
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            ¡Cuéntanos sobre tu proyecto!
          </h1>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            Sólo necesitamos <span className="font-medium">2 datos</span> para empezar a
            construir tu idea.
          </p>
        </header>

        {/* Card del formulario */}
        <div className="mx-auto mt-6 max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {/* Nombre del proyecto */}
          <label className="block text-sm font-medium text-slate-700">
            Nombre del proyecto
            <button
              type="button"
              onClick={() => setHelpProject((v) => !v)}
              aria-expanded={helpProject}
              className="ml-2 align-middle text-xs text-sky-700 underline"
            >
              ¿Para qué usamos este dato?
            </button>
          </label>
          {helpProject && (
            <div className="mt-1 rounded-md border border-sky-100 bg-sky-50 p-2 text-xs text-sky-900">
              Lo usamos para personalizar tu informe y ejemplos. Puedes cambiarlo cuando
              quieras.
            </div>
          )}
          <div className="relative mt-1">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none"
              aria-hidden
            >
              📛
            </span>
            <input
              className={`mt-0 w-full rounded-lg border px-3 py-2 pl-9 outline-none ring-0 transition-colors placeholder:text-slate-400 ${
                errors.projectName
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"
              }`}
              placeholder="p. ej. Joyas Patagonia"
              value={local.projectName}
              onChange={(e) =>
                setLocal((s) => ({ ...s, projectName: e.target.value }))
              }
              autoComplete="organization"
              aria-invalid={Boolean(errors.projectName) || undefined}
              aria-describedby={errors.projectName ? "err-projectName" : undefined}
            />
          </div>
          {errors.projectName && (
            <p id="err-projectName" className="mt-1 text-xs text-rose-600">
              {errors.projectName}
            </p>
          )}

          {/* Tu nombre */}
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Tu nombre
            <button
              type="button"
              onClick={() => setHelpFounder((v) => !v)}
              aria-expanded={helpFounder}
              className="ml-2 align-middle text-xs text-sky-700 underline"
            >
              ¿Para qué usamos este dato?
            </button>
          </label>
          {helpFounder && (
            <div className="mt-1 rounded-md border border-sky-100 bg-sky-50 p-2 text-xs text-sky-900">
              Para dirigirte por tu nombre en el informe y emails. No se comparte con
              terceros.
            </div>
          )}
          <div className="relative mt-1">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none"
              aria-hidden
            >
              👤
            </span>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 pl-9 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-400 focus:ring-emerald-100"
              placeholder="p. ej. Carola Plaza"
              value={local.founderName}
              onChange={(e) =>
                setLocal((s) => ({ ...s, founderName: e.target.value }))
              }
              autoComplete="name"
            />
          </div>

          {/* Email */}
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Email de contacto
            <button
              type="button"
              onClick={() => setHelpEmail((v) => !v)}
              aria-expanded={helpEmail}
              className="ml-2 align-middle text-xs text-sky-700 underline"
            >
              ¿Para qué usamos este dato?
            </button>
          </label>
          {helpEmail && (
            <div className="mt-1 rounded-md border border-sky-100 bg-sky-50 p-2 text-xs text-sky-900">
              Con tu email recibirás los resultados y novedades importantes.
              <span className="ml-1 font-medium">Nunca compartiremos tus datos.</span>
            </div>
          )}
          <div className="relative mt-1">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none"
              aria-hidden
            >
              📧
            </span>
            <input
              type="email"
              className={`w-full rounded-lg border px-3 py-2 pl-9 outline-none transition-colors placeholder:text-slate-400 ${
                errors.email
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"
              }`}
              placeholder="tucorreo@ejemplo.com"
              value={local.email}
              onChange={(e) => setLocal((s) => ({ ...s, email: e.target.value }))}
              autoComplete="email"
              inputMode="email"
              aria-invalid={Boolean(errors.email) || undefined}
              aria-describedby={errors.email ? "err-email" : undefined}
            />
          </div>
          {errors.email && (
            <p id="err-email" className="mt-1 text-xs text-rose-600">
              {errors.email}
            </p>
          )}

          {/* Nav */}
          <div className="mt-6 flex items-center justify-between">
            <PrevButton href="/informe" />
            <NextButton onClick={onNext} label="Comienza tu análisis" />
          </div>
        </div>

        {/* Banner de upsell */}
        <div className="mx-auto mt-6 max-w-md">
          <UpsellBanner />
        </div>

        {/* Notas y tranquilidad */}
        <div className="mx-auto mt-4 max-w-md text-xs text-slate-500">
          <p className="leading-relaxed">
            Nota: la generación{" "}
            <span className="inline-flex items-center gap-1 font-medium">
              <BotIcon className="h-3.5 w-3.5" /> IA Aret3
            </span>{" "}
            se hará al final, en el Informe.
          </p>
          <p className="mt-2">
            No te preocupes, puedes cambiar estos datos después.{" "}
            <span className="font-medium">¡Sólo tú verás tus datos!</span> Seguridad y
            privacidad garantizadas.
          </p>
        </div>
      </div>
    </div>
  );
}
