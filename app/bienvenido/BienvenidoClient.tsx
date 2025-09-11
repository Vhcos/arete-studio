"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function BienvenidoClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const token = sp.get("token") ?? sp.get("t");
  const email = sp.get("email") ?? sp.get("e");
  const next = sp.get("next") || "/wizard/step-1";
  const delayMs = Number(sp.get("delay") ?? 8000); // 8s por defecto

  // Guardar token/email si vienen en el link
  useEffect(() => {
    try {
      if (token) localStorage.setItem("aret3:magicToken", token);
      if (email) localStorage.setItem("aret3:email", email);
    } catch {}
  }, [token, email]);

  // Contador y progreso para auto-redirección
  const [remaining, setRemaining] = useState(Math.ceil(delayMs / 1000));
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!token) return; // sólo auto-redirige si viene con token
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const leftMs = Math.max(0, delayMs - elapsed);
      setRemaining(Math.ceil(leftMs / 1000));
      setProgress(Math.min(100, Math.round((elapsed / delayMs) * 100)));
      if (leftMs <= 0) {
        clearInterval(id);
        router.push(next);
      }
    }, 250);
    return () => clearInterval(id);
  }, [token, delayMs, next, router]);

  return (
    <main className="relative isolate">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 to-white" />

      <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-14 text-center">
        {/* Logo grande centrado 400x400 */}
        <Image src="/aret3-logo.svg" alt="ARET3" width={400} height={400} className="mb-6" />

        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          ¡Estamos felices de tenerte aquí!
        </h1>

        <p className="mt-4 max-w-prose text-balance text-slate-600">
          En la filosofía griega, <span className="font-semibold">ARETé</span> es la excelencia:
          el cumplimiento acabado del propósito. Empieza tu viaje para dar forma a tu idea y
          transformarla en un plan claro y accionable.
        </p>

        {/* Estado + contador */}
        <div className="mt-5 w-full max-w-md text-sm">
          {token ? (
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

              {/* barra de progreso simple */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-slate-900 transition-all"
                  style={{ width: `${progress}%` }}
                  aria-hidden
                />
              </div>
            </div>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-slate-600">
              <svg width="16" height="16" viewBox="0 0 24 24" className="stroke-slate-600">
                <path d="M12 9v4m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Listo para comenzar
            </span>
          )}
        </div>

        {/* CTA (sin mencionar "wizard") */}
        <div className="mt-10 flex items-center justify-center gap-3">
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
