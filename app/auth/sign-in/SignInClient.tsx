"use client";
import * as React from "react";
import { signIn } from "next-auth/react";

export default function SignInClient({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = React.useState(initialEmail);
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const destination = "/wizard/step-1";
    const callbackUrl = `/bienvenido?next=${encodeURIComponent(destination)}`;
    const res = await signIn("email", { email, redirect: false, callbackUrl });
    setLoading(false);
    if (res?.error) setError(res.error);
    else setSent(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
             placeholder="tucorreo@dominio.com" className="w-full rounded-lg border px-3 py-2" />
      <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white" disabled={loading}>
        {loading ? "Enviando…" : "Enviar enlace"}
      </button>
      {sent && <p className="text-sm mt-2">Revisa tu correo. Verás una bienvenida y luego te redirigirá automáticamente.</p>}
      {error && <p className="text-sm text-red-600">{String(error)}</p>}
    </form>
  );
}
