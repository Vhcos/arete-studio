// app/wizard/step-1/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { Step1Schema } from "@/lib/validation/wizard";
import { NextButton, PrevButton } from "@/components/wizard/WizardNav";
import UpsellBanner from "@/components/wizard/UpsellBanner";

export default function Step1Page() {
  const router = useRouter();
  const { data, setStep1 } = useWizardStore();
  const { data: session } = useSession();            // ← sesión NextAuth
  const s1 = data.step1 ?? {};

  const [local, setLocal] = useState({
    projectName: s1.projectName ?? "",
    founderName: s1.founderName ?? "",
    notifyEmail: s1.notifyEmail ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Autofill: si viene email de la sesión y el campo está vacío, rellenar
  useEffect(() => {
    const email = session?.user?.email;
    if (email && !local.notifyEmail) {
      setLocal((prev) => ({ ...prev, notifyEmail: email }));
    }
  }, [session?.user?.email, local.notifyEmail]);

  function onNext() {
    const parsed = Step1Schema.safeParse({ ...local, idea: s1.idea ?? "" }); // idea ya no se edita acá
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (e[i.path.join(".")] = i.message));
      setErrors(e);
      return;
    }
    setStep1({ ...(data.step1 ?? {}), ...parsed.data });
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
        value={local.notifyEmail}
        onChange={(e) => setLocal((s) => ({ ...s, notifyEmail: e.target.value }))}
      />
      {errors.notifyEmail && <p className="mt-1 text-xs text-red-600">{errors.notifyEmail}</p>}

      <div className="mt-6 flex items-center justify-between">
        <PrevButton href="/" />
        <NextButton onClick={onNext} />
      </div>

      <UpsellBanner />

      <p className="mt-4 text-xs text-slate-500">
        Nota: la generación con IA se hará al final, en el Informe.
      </p>
    </div>
  );
}
