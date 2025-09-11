"use client";
import * as React from "react";
import { signIn } from "next-auth/react";
import { Button, Input } from "@arete-studio/ui";

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
      <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@dominio.com" />
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Enviando…" : "Enviar enlace"}
      </Button>
      {sent && <p className="text-sm mt-2">Enviamos un enlace a <b>{email}</b>. Al abrirlo verás una bienvenida y serás redirigido automáticamente.</p>}
      {error && <p className="text-sm text-red-600">{String(error)}</p>}
    </form>
  );
}
