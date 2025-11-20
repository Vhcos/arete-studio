// app/wizard/step-3/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useWizardStore } from "@/lib/state/wizard-store";
import { Step2Schema } from "@/lib/validation/wizard";
import { NextButton, PrevButton } from "@/components/wizard/WizardNav";
import { SECTORS, SectorId } from "@/lib/model/sectors";
import UpsellBanner from "@/components/wizard/UpsellBanner";
import EconomicHeader from "@/components/wizard/EconomicHeader";
import BotIcon from "@/components/icons/BotIcon";

const COUNTRY_OPTIONS = [
  { code: "CL", label: "Chile" },
  { code: "CO", label: "Colombia" },
  { code: "MX", label: "México" },
  { code: "AR", label: "Argentina" },
  { code: "PE", label: "Perú" },
  { code: "UY", label: "Uruguay" },
  { code: "PY", label: "Paraguay" },
  { code: "BO", label: "Bolivia" },
  { code: "EC", label: "Ecuador" },
];

function inferCountryAndCity(ubicacionCruda: string | undefined | null) {
  const raw = (ubicacionCruda ?? "").trim();
  if (!raw) {
    return { countryCode: "CL", city: "" };
  }

  // Intentar detectar si termina con el nombre de un país conocido
  for (const c of COUNTRY_OPTIONS) {
    const labelLower = c.label.toLowerCase();
    const rawLower = raw.toLowerCase();
    if (rawLower.endsWith(labelLower)) {
      const sinPais = raw.slice(0, raw.length - c.label.length).replace(/[, ]+$/, "");
      return {
        countryCode: c.code,
        city: sinPais,
      };
    }
  }

  // Si no se reconoce el país, asumimos Chile y dejamos todo en city
  return {
    countryCode: "CL",
    city: raw,
  };
}

function buildUbicacion(city: string, countryCode: string) {
  const country = COUNTRY_OPTIONS.find((c) => c.code === countryCode)?.label ?? countryCode;
  const cleanCity = city.trim();

  if (cleanCity) {
    return `${cleanCity}, ${country}`;
  }

  return country;
}

export default function Step3Page() {
  const router = useRouter();
  const { data, setStep2 } = useWizardStore();

  const initialSector = (data.step2?.sectorId as SectorId) ?? "tech_saas";

  const ubicacionAnterior =
    (data.step2?.ubicacion ?? data.step1?.ubicacion ?? "") as string;

  const { countryCode: inferredCountry, city: inferredCity } =
    inferCountryAndCity(ubicacionAnterior);

  const [local, setLocal] = useState({
    sectorId: initialSector as string,
    template: (data.step2?.template ?? "default") as string,
    countryCode: (data.step2 as any)?.countryCode ?? inferredCountry,
    city: (data.step2 as any)?.city ?? inferredCity,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const sectorInfo = useMemo(
    () => SECTORS.find((s) => s.id === (local.sectorId as SectorId)),
    [local.sectorId]
  );
  const sectorHint = (sectorInfo as any)?.hint ?? "";

  function onNext() {
    const ubicacion = buildUbicacion(local.city, local.countryCode);

    // Validamos contra el schema original (sectorId, template, ubicacion)
    const toValidate = {
      sectorId: local.sectorId,
      template: local.template,
      ubicacion,
    };

    const parsed = Step2Schema.safeParse(toValidate);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (e[i.path.join(".")] = i.message));
      setErrors(e);
      return;
    }

    setErrors({});

    // Guardamos lo que espera el esquema + extras útiles para el futuro
    setStep2({
      ...parsed.data,
      countryCode: local.countryCode,
      city: local.city,
    } as any);

    router.push("/wizard/step-4");
  }

  return (
    <main className="mx-auto max-w-7xl px-3 py-8">
      <EconomicHeader
        title="Paso 3 · Rubro y ubicación"
        subtitle="Elige el rubro más cercano a tu idea y dónde operarás."
      />

      <section className="mx-auto mt-6 max-w-2xl rounded-xl border-2 border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5 p-6">
        {/* Rubro / sector */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Rubro
          </label>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
            value={local.sectorId}
            onChange={(e) =>
              setLocal((s) => ({ ...s, sectorId: e.target.value }))
            }
          >
            {SECTORS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          {errors.sectorId && (
            <p className="mt-1 text-xs text-red-600">{errors.sectorId}</p>
          )}
          {sectorHint && (
            <p className="mt-1 text-xs text-slate-500">{sectorHint}</p>
          )}
        </div>

        {/* País */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">
            País
          </label>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
            value={local.countryCode}
            onChange={(e) =>
              setLocal((s) => ({ ...s, countryCode: e.target.value }))
            }
          >
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Ciudad / zona */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">
            Ciudad o zona principal
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
            placeholder="Ej: Medellín, Santiago Centro, Lima, etc."
            value={local.city}
            onChange={(e) =>
              setLocal((s) => ({ ...s, city: e.target.value }))
            }
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <PrevButton href="/wizard/step-2" />
          <NextButton onClick={onNext} />
        </div>
      </section>

      <div className="max-w-2xl mx-auto mt-4">
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
