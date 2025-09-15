"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function BienvenidoClient() {
  const router = useRouter();
  const sp = useSearchParams(); // puede ser null según tu setup

  // Helper null-safe para leer query params
  const get = (k: string) => sp?.get(k) ?? null;

  // Datos opcionales (guardamos si vienen, pero no dependemos de esto)
  const token = get("token") ?? get("t");
  const email = get("email") ?? get("e");

  // Destino y comportamiento
  const next = get("next") || "/wizard/step-1";
  const delayRaw = get("delay");
  const delayMs = delayRaw ? Number(delayRaw) : 8000; // 8s por defecto
  const auto = get("auto") !== "0"; // permitir desactivar con ?auto=0

  // Persistencia opcional de token/email si vinieran en el link
  React.useEffect(() => {
    try {
      if (token) localStorage.setItem("aret3:magicToken", token);
      if (email) localStorage.setItem("aret3:email", email);
    } catch {}
  }, [token, email]);

  // Contador y progreso SIEMPRE (ya no condicionado al token)
  const [remaining, setRemaining] = React.useState(Math.ceil(delayMs / 1000));
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (!auto) return;
    const start = Date.now();
    const iv = setInterval(() => {
      const elapsed = Date.now() - start;
      const leftMs = Math.max(0, delayMs - elapsed);
      setRemaining(Math.ceil(leftMs / 1000));
      setProgress(Math.min(100, Math.round((elapsed / delayMs) * 100)));
      if (leftMs <= 0) {
        clearInterval(iv);
        router.push(next);
      }
    }, 250);
    return () => clearInterval(iv);
  }, [auto, delayMs, next, router]);

  return (
    <main className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 to-white" />

      <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-14 text-center">
        <Image src="/aret3-logo.svg" alt="ARET3" width={200} height={200} className="mb-6" />

        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          ¡Estamos felices de tenerte aquí!
        </h1>

        <p className="mt-4 max-w-prose text-balance text-slate-600">
          En la filosofía griega, <span className="font-semibold">aretḗ</span> es la excelencia:
          el cumplimiento acabado del propósito. Empieza tu viaje para dar forma a tu idea y
          transformarla en un plan claro y accionable.
        </p>

        <div className="mt-5 w-full max-w-md text-sm">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-green-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="stroke-green-700">
                <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Acceso verificado{email && <span className="text-slate-500"> · {email}</span>}
            </span>

            <p className="text-slate-600">
              Serás redireccionado automáticamente en{" "}
              <span className="font-semibold">{remaining}s</span>…
            </p>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-slate-900 transition-all"
                style={{ width: `${progress}%` }}
                aria-hidden
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => router.push(next)}
            className="rounded-xl bg-slate-900 px-6 py-3 text-white hover:bg-slate-800 active:bg-slate-900"
          >
            Comenzar ahora
          </button>
          <Link href={next} className="text-slate-600 underline-offset-4 hover:underline">
            Continuar
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          ¿No recibiste el correo? Revisa spam o{" "}
          <Link href="/auth/sign-in" className="underline">vuelve a pedir el enlace</Link>.
        </p>
      </section>
    </main>
  );
}
