// app/wizard/step-1/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { Step1Schema } from "@/lib/validation/wizard";
import { NextButton, PrevButton } from "@/components/wizard/WizardNav";
import UpsellBanner from "@/components/wizard/UpsellBanner";
import BotIcon from "@/components/icons/BotIcon";

export default function Step1Page() {
  const router = useRouter();
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

  // Autofill desde sesión si falta
  useEffect(() => {
    const e = session?.user?.email;
    if (e && !local.email) {
      setLocal((prev) => ({ ...prev, email: e }));
    }
  }, [session?.user?.email, local.email]);

  function onNext() {
    // Validamos contra el schema actual (que usa "email")
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

    // Guardamos con ambos nombres para mantener compatibilidad aguas abajo
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
    <div>
      <h1 className="text-xl font-semibold mb-1">Paso 1 · Datos básicos</h1>
      <p className="text-sm text-slate-600 mb-6">Cuéntanos lo mínimo para empezar.</p>

      <label className="block text-sm font-medium">Nombre del proyecto</label>
      <input
        className="mt-1 w-full rounded-lg border px-3 py-2"
        placeholder="p. ej. Joyas Patagonia"
        value={local.projectName}
        onChange={(e) => setLocal((s) => ({ ...s, projectName: e.target.value }))}
      />
      {errors.projectName && <p className="mt-1 text-xs text-red-600">{errors.projectName}</p>}

      <label className="block text-sm font-medium mt-4">Tu nombre</label>
      <input
        className="mt-1 w-full rounded-lg border px-3 py-2"
        placeholder="p. ej. Carola Plaza"
        value={local.founderName}
        onChange={(e) => setLocal((s) => ({ ...s, founderName: e.target.value }))}
      />

      <label className="block text-sm font-medium mt-4">Email de contacto</label>
      <input
        type="email"
        className="mt-1 w-full rounded-lg border px-3 py-2"
        placeholder="tucorreo@ejemplo.com"
        value={local.email}
        onChange={(e) => setLocal((s) => ({ ...s, email: e.target.value }))}
      />
      {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}

      <div className="mt-6 flex items-center justify-between">
        <PrevButton href="/informe" />
        <NextButton onClick={onNext} />
      </div>

      <UpsellBanner />

      <p className="mt-4 text-xs text-slate-500">
        Nota: la generación{" "}
        <span className="inline-flex items-center gap-1 font-medium">
          <BotIcon className="w-3.5 h-3.5" /> IA Aret3
        </span>{" "}
        se hará al final, en el Informe.
      </p>
    </div>
  );
}
