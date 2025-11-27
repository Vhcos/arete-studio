// app/auth/sign-in/SignInClient.tsx
"use client";

import { useState, FormEvent, useMemo } from "react";
import { signIn } from "next-auth/react";
import BotIcon from "@/components/icons/BotIcon";
type Props = {
  initialEmail?: string;
  initialOrg?: string; // 👈 viene desde la URL (?org=slug)
};

export default function SignInClient({ initialEmail = "", initialOrg = "" }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // 👇 Construimos callbackUrl dinámico
  const callbackUrl = useMemo(() => {
    const base = "/bienvenido?next=/wizard/step-1";
    if (!initialOrg) return base;
    return `${base}&org=${encodeURIComponent(initialOrg)}`;
  }, [initialOrg]);

  // --- Spinner minimal ---
function Spinner({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSent(false);

    try {
      const res = await signIn("email", {
        email,
        callbackUrl,
        redirect: false, // el redirect real pasa al hacer clic en el link del correo
      });

      if (res?.error) {
        setError(res.error);
      } else {
        setSent(true);
      }
    } catch (err: any) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        Email
        <input
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </label>

      {initialOrg && (
        <p className="text-xs text-slate-500">
          Te estás registrando dentro de la organización{" "}
          <strong>{initialOrg}</strong>.
        </p>
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}
      {sent && !error && (
        <p className="text-xs text-emerald-600">
          Revisa tu correo, te enviamos un enlace de acceso.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
         className={`
           w-full flex flex-col items-center justify-center gap-1
           rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-slate-900
           px-4 py-3 text-sm font-medium text-white shadow-md
           transition-all duration-300
           hover:from-emerald-500 hover:to-emerald-700
           active:scale-[0.98]
           disabled:opacity-60 disabled:cursor-not-allowed
         `}
      >
           {loading ? (
              <div className="flex items-center gap-2">
              <Spinner className="h-5 w-5 animate-spin text-white" />
              <span>Enviando enlace...</span>
              </div>
          ) : (
         <>
            <div className="flex items-center gap-2">
            <BotIcon className="h-6 w-6 text-amber-300 drop-shadow-[0_0_4px_gold]" variant="t3" glowHue="gold" />
            <span>Enviar enlace de acceso</span>
            </div>
            <span className="text-[12px] font-light text-amber-200 mt-1">
            Acceso rápido y seguro con IA Aret3
          </span>
         </>
          )}
        </button>

       </form>
     );
  }
