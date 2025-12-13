// app/funding/[sessionId]/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

type TipoPostulante = "natural" | "empresa";

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

// Tipo amplio para no reventar si legacy tiene más cosas
type LegacyForm = {
  projectName?: string;
  founderName?: string;
  email?: string;
  idea?: string;
  ventajaTexto?: string;
  ubicacion?: string;
  rubro?: string;
  sectorId?: string;
  countryCode?: string | null;
  meta?: {
    countryCode?: string | null;
    ubicacion?: string | null;
    [key: string]: any;
  } | null;
  postulante?: {
    tipoPostulante?: "persona_natural" | "empresa";
    countryCode?: string | null;

    // Persona natural
    nombreCompleto?: string | null;
    rut?: string | null;
    fechaNacimiento?: string | null;
    genero?: "" | "M" | "F" | "O" | "N";
    region?: string | null;
    comuna?: string | null;
    telefono?: string | null;

    // Empresa
    razonSocial?: string | null;
    rutEmpresa?: string | null;
    fechaInicioActividades?: string | null;
    giroPrincipal?: string | null;
    representanteNombre?: string | null;
    representanteRut?: string | null;
    telefonoContacto?: string | null;
  } | null;

  [key: string]: any;
};

// Utilidad segura para leer JSON del localStorage
function readJSON<T = any>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function FundingWizardPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string | undefined;

  const [tipo, setTipo] = useState<TipoPostulante>("natural");

  // País (para ambos tipos)
  const [countryCode, setCountryCode] = useState<string>("CL");

  // Persona natural
  const [nombre, setNombre] = useState("");
  const [rutPersona, setRutPersona] = useState("");
  const [fechaNac, setFechaNac] = useState("");
  const [genero, setGenero] = useState<"" | "M" | "F" | "O" | "N">("");
  const [regionPersona, setRegionPersona] = useState("");
  const [comunaPersona, setComunaPersona] = useState("");
  const [telefonoPersona, setTelefonoPersona] = useState("");

  // Empresa
  const [razonSocial, setRazonSocial] = useState("");
  const [rutEmpresa, setRutEmpresa] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [giro, setGiro] = useState("");
  const [regionEmpresa, setRegionEmpresa] = useState("");
  const [comunaEmpresa, setComunaEmpresa] = useState("");
  const [repNombre, setRepNombre] = useState("");
  const [repRut, setRepRut] = useState("");
  const [telefonoEmpresa, setTelefonoEmpresa] = useState("");

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Guardamos el legacy en un ref para no recalcular mil veces
  const legacyRef = useRef<LegacyForm | null>(null);
  const tipoInitRef = useRef(false);
  const countryInitRef = useRef(false);

  // Cargar legacyForm una vez
  useEffect(() => {
    try {
      const global = typeof window !== "undefined" ? (window as any).__arete : undefined;
      const legacyFromGlobal: LegacyForm | null = global?.form ?? null;
      const legacyFromStorage: LegacyForm | null =
        readJSON<LegacyForm>("arete:legacyForm") ?? readJSON<LegacyForm>("arete:form");

      const legacy: LegacyForm | null = legacyFromGlobal ?? legacyFromStorage;
      if (!legacy) return;

      legacyRef.current = legacy;
    } catch (e) {
      console.error("[F1] Error leyendo legacyForm:", e);
    }
  }, []);

  // Auto-relleno reactivo según tipo (natural/empresa) + legacy
  useEffect(() => {
    const legacy = legacyRef.current;
    if (!legacy) return;

    const meta = legacy.meta ?? {};
    const postulante = legacy.postulante ?? {};

    // --- UBICACIÓN ---
    const rawUbicacion = (legacy.ubicacion ?? meta.ubicacion ?? "").toString();
    let locComuna = "";
    let locRegion = "";
    let locCountryLabel = "";

    if (rawUbicacion) {
      const parts = rawUbicacion
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      if (parts.length === 1) {
        locComuna = parts[0];
      } else if (parts.length === 2) {
        [locComuna, locCountryLabel] = parts;
      } else if (parts.length >= 3) {
        [locComuna, locRegion, locCountryLabel] = parts;
      }
    }

    // Mapear nombre del país a código
    const label = locCountryLabel.toLowerCase();
    const countryFromUbicacion =
      label.includes("chile") ? "CL" :
      label.includes("colombia") ? "CO" :
      label.includes("méxico") || label.includes("mexico") ? "MX" :
      label.includes("argentina") ? "AR" :
      label.includes("perú") || label.includes("peru") ? "PE" :
      label.includes("uruguay") ? "UY" :
      label.includes("paraguay") ? "PY" :
      label.includes("bolivia") ? "BO" :
      label.includes("ecuador") ? "EC" :
      undefined;

    // --- País: solo lo inicializamos una vez ---
    if (!countryInitRef.current) {
      const inferredCountry =
        postulante.countryCode ??
        meta.countryCode ??
        legacy.countryCode ??
        countryFromUbicacion ??
        "CL";

      if (typeof inferredCountry === "string" && inferredCountry.length === 2) {
        setCountryCode(inferredCountry);
      }
      countryInitRef.current = true;
    }

    // --- Tipo: si el legacy guardó uno, lo usamos la primera vez ---
    if (!tipoInitRef.current && postulante.tipoPostulante) {
      if (postulante.tipoPostulante === "empresa") {
        setTipo("empresa");
      } else {
        setTipo("natural");
      }
      tipoInitRef.current = true;
    }

    // Decidir qué tipo está activo para el autocompletado
    const activeTipo: TipoPostulante = tipo;

    if (activeTipo === "natural") {
      // Persona natural: usamos postulante o founderName + ubicacion
      if (!nombre && (postulante.nombreCompleto || legacy.founderName)) {
        setNombre(postulante.nombreCompleto ?? legacy.founderName ?? "");
      }
      if (!rutPersona && postulante.rut) {
        setRutPersona(postulante.rut);
      }
      if (!fechaNac && postulante.fechaNacimiento) {
        setFechaNac(postulante.fechaNacimiento);
      }
      if (!genero && postulante.genero) {
        setGenero(postulante.genero);
      }
      if (!regionPersona && (postulante.region || locRegion)) {
        setRegionPersona(postulante.region ?? locRegion ?? "");
      }
      if (!comunaPersona && (postulante.comuna || locComuna)) {
        setComunaPersona(postulante.comuna ?? locComuna ?? "");
      }
      if (!telefonoPersona && postulante.telefono) {
        setTelefonoPersona(postulante.telefono);
      }
    }

    if (activeTipo === "empresa") {
      // Empresa: usamos postulante o projectName/rubro/sectorId + ubicacion + founderName
      if (!razonSocial && (postulante.razonSocial || legacy.projectName)) {
        setRazonSocial(postulante.razonSocial ?? legacy.projectName ?? "");
      }
      if (!rutEmpresa && postulante.rutEmpresa) {
        setRutEmpresa(postulante.rutEmpresa);
      }
      if (!fechaInicio && postulante.fechaInicioActividades) {
        setFechaInicio(postulante.fechaInicioActividades);
      }
      if (!giro && (postulante.giroPrincipal || legacy.rubro || legacy.sectorId)) {
        setGiro(
          postulante.giroPrincipal ??
          legacy.rubro ??
          legacy.sectorId ??
          ""
        );
      }
      if (!regionEmpresa && (postulante.region || locRegion)) {
        setRegionEmpresa(postulante.region ?? locRegion ?? "");
      }
      if (!comunaEmpresa && (postulante.comuna || locComuna)) {
        setComunaEmpresa(postulante.comuna ?? locComuna ?? "");
      }
      if (!repNombre && (postulante.representanteNombre || legacy.founderName)) {
        setRepNombre(postulante.representanteNombre ?? legacy.founderName ?? "");
      }
      if (!repRut && postulante.representanteRut) {
        setRepRut(postulante.representanteRut);
      }
      if (!telefonoEmpresa && (postulante.telefonoContacto || postulante.telefono)) {
        setTelefonoEmpresa(
          postulante.telefonoContacto ?? postulante.telefono ?? ""
        );
      }
    }
  }, [
    tipo,
    nombre,
    rutPersona,
    fechaNac,
    genero,
    regionPersona,
    comunaPersona,
    telefonoPersona,
    razonSocial,
    rutEmpresa,
    fechaInicio,
    giro,
    regionEmpresa,
    comunaEmpresa,
    repNombre,
    repRut,
    telefonoEmpresa,
  ]);

  const handleBack = () => {
    router.back();
  };

  const handleSaveAndContinue = async () => {
    if (!sessionId) return;
    setSaving(true);
    setSavedMsg(null);

    const payloadF1 =
      tipo === "natural"
        ? {
            step: "F1",
            tipoPostulante: "persona_natural",
            countryCode,
            nombreCompleto: nombre,
            rut: rutPersona,
            fechaNacimiento: fechaNac,
            genero,
            region: regionPersona,
            comuna: comunaPersona,
            telefono: telefonoPersona,
          }
        : {
            step: "F1",
            tipoPostulante: "empresa",
            countryCode,
            razonSocial,
            rutEmpresa,
            fechaInicioActividades: fechaInicio,
            giroPrincipal: giro,
            region: regionEmpresa,
            comuna: comunaEmpresa,
            representanteNombre: repNombre,
            representanteRut: repRut,
            telefonoContacto: telefonoEmpresa,
          };

    try {
      const res = await fetch("/api/funding-session/save-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          data: payloadF1,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.error("[F1] Error al guardar paso F1:", errJson);
      } else {
        setSavedMsg("Datos del postulante guardados.");
      }
    } catch (err) {
      console.error("[F1] Error de red al guardar paso F1:", err);
    } finally {
      setSaving(false);
      router.push(`/funding/${sessionId}/f2`);
    }
  };

  if (!sessionId) {
    return (
      <main className="container max-w-3xl mx-auto py-8">
        <p className="text-sm text-red-600">
          No se encontró el ID de sesión de financiamiento.
        </p>
      </main>
    );
  }

  return (
    <main className="container max-w-3xl mx-auto py-8 space-y-4">
      <header className="mb-4 text-center space-y-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Módulo perfil postulante
        </p>
        <h1 className="text-2xl font-semibold">
          Paso F1 – Perfil del postulante
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-xl mx-auto">
          Cuéntanos quién va a postular al fondo. Esta información es la base
          de casi todos los formularios (Sercotec, Corfo, fondos municipales, etc.).
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px]">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
            F1 de F8 · Perfil del postulante
          </span>
          <span className="text-slate-400">
            ID sesión:{" "}
            <code className="font-mono text-[10px] bg-slate-50 px-1.5 py-0.5 rounded">
              {sessionId}
            </code>
          </span>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3 space-y-3">
          <p className="text-sm font-medium">¿Cómo vas a postular?</p>
          <div className="inline-flex rounded-full bg-muted p-1 text-xs">
            <button
              type="button"
              onClick={() => setTipo("natural")}
              className={`px-3 py-1 rounded-full transition ${
                tipo === "natural"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Persona natural
            </button>
            <button
              type="button"
              onClick={() => setTipo("empresa")}
              className={`px-3 py-1 rounded-full transition ${
                tipo === "empresa"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Empresa (ya tengo RUT)
            </button>
          </div>

          {/* País donde postula */}
          <div className="mt-2">
            <label className="block text-xs font-medium mb-1">
              País donde postulas al fondo
            </label>
            <select
              className="w-full max-w-xs rounded-md border px-2 py-1.5 text-sm"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          {tipo === "natural" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-medium">Nombre completo</span>
                  <input
                    type="text"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Claudia Pérez González"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium">RUT</span>
                  <input
                    type="text"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                    value={rutPersona}
                    onChange={(e) => setRutPersona(e.target.value)}
                    placeholder="Ej: 12.345.678-9"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1">
                  <span className="text-xs font-medium">Fecha de nacimiento</span>
                  <input
                    type="date"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                    value={fechaNac}
                    onChange={(e) => setFechaNac(e.target.value)}
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium">Género</span>
                  <select
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                    value={genero}
                    onChange={(e) =>
                      setGenero(e.target.value as "" | "M" | "F" | "O" | "N")
                    }
                  >
                    <option value="">Selecciona</option>
                    <option value="F">Mujer</option>
                    <option value="M">Hombre</option>
                    <option value="O">Otro</option>
                    <option value="N">Prefiero no decir</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-medium">Región</span>
                  <input
                    type="text"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                    value={regionPersona}
                    onChange={(e) => setRegionPersona(e.target.value)}
                    placeholder="Ej: Región Metropolitana"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium">Comuna</span>
                  <input
                    type="text"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                    value={comunaPersona}
                    onChange={(e) => setComunaPersona(e.target.value)}
                    placeholder="Ej: Maipú"
                  />
                </label>
              </div>

              <label className="space-y-1">
                <span className="text-xs font-medium">Teléfono de contacto</span>
                <input
                  type="text"
                  className="w-full rounded-md border px-2 py-1.5 text-sm"
                  value={telefonoPersona}
                  onChange={(e) => setTelefonoPersona(e.target.value)}
                  placeholder="Ej: +56 9 1234 5678"
                />
              </label>
            </>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-medium">Razón social</span>
                  <input
                    type="text"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    placeholder="Ej: Cafetería Mascotas SpA"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium">RUT empresa</span>
                  <input
                    type="text"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                    value={rutEmpresa}
                    onChange={(e) => setRutEmpresa(e.target.value)}
                    placeholder="Ej: 76.123.456-0"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1">
                  <span className="text-xs font-medium">
                    Fecha inicio actividades
                  </span>
                  <input
                    type="date"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </label>

                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-medium">
                    Rubro o giro principal
                  </span>
                  <input
                    type="text"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                    value={giro}
                    onChange={(e) => setGiro(e.target.value)}
                    placeholder="Ej: Cafetería, restaurant, servicios de comida"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-medium">Región</span>
                  <input
                    type="text"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                    value={regionEmpresa}
                    onChange={(e) => setRegionEmpresa(e.target.value)}
                    placeholder="Ej: Región Metropolitana"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium">Comuna</span>
                  <input
                    type="text"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                    value={comunaEmpresa}
                    onChange={(e) => setComunaEmpresa(e.target.value)}
                    placeholder="Ej: Providencia"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-medium">
                    Nombre representante legal
                  </span>
                  <input
                    type="text"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                    value={repNombre}
                    onChange={(e) => setRepNombre(e.target.value)}
                    placeholder="Ej: Claudia Pérez González"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium">RUT representante</span>
                  <input
                    type="text"
                    className="w-full rounded-md border px-2 py-1.5 text-sm"
                    value={repRut}
                    onChange={(e) => setRepRut(e.target.value)}
                    placeholder="Ej: 12.345.678-9"
                  />
                </label>
              </div>

              <label className="space-y-1">
                <span className="text-xs font-medium">Teléfono de contacto</span>
                <input
                  type="text"
                  className="w-full rounded-md border px-2 py-1.5 text-sm"
                  value={telefonoEmpresa}
                  onChange={(e) => setTelefonoEmpresa(e.target.value)}
                  placeholder="Ej: +56 9 1234 5678"
                />
              </label>
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-between items-center gap-2">
          <Button variant="outline" onClick={handleBack} disabled={saving}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Volver
          </Button>

          <div className="flex flex-col items-end gap-1">
            {savedMsg && (
              <p className="text-[11px] text-muted-foreground max-w-xs text-right">
                {savedMsg}
              </p>
            )}
            <Button
              onClick={handleSaveAndContinue}
              disabled={saving}
              className={`
                inline-flex flex-col items-center justify-center gap-0.5
                rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-slate-900
                px-3.5 py-2 text-[11px] font-medium text-white shadow-md
                transition-all duration-300
                hover:from-emerald-500 hover:to-emerald-700
                active:scale-[0.98]
                sm:flex-row sm:gap-2
              `}
            >
              <div className="flex items-center gap-1.5">
                <img
                  src="/aret3-logo.svg"
                  alt="aret3"
                  className="h-6 w-6 rounded-full shadow-[0_0_6px_rgba(56,189,248,0.9)]"
                  loading="lazy"
                />
                <span className="whitespace-nowrap">
                  {saving ? "Guardando..." : "Guardar y continuar"}
                </span>
              </div>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
