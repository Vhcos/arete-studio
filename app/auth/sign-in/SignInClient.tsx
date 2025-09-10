// app/auth/sign-in/SignInClient.tsx
"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@arete-studio/ui";

function mapError(code?: string) {
  switch (code) {
    case "EmailSignin":
      return "No pudimos enviar el correo. Verifica el email e intenta nuevamente.";
    case "Configuration":
      return "Falta configurar el proveedor de email (Resend/SMTP).";
    case "AccessDenied":
      return "Acceso denegado.";
    default:
      return code || null;
  }
}

export default function SignInClient({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = React.useState(initialEmail);
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Destino interno una vez autenticado (no mostramos la palabra "wizard" al usuario)
    const destination = "/wizard/step-1";
    // La pantalla de bienvenida guardará token/email y auto-redirigirá
    const callbackUrl = `/bienvenido?next=${encodeURIComponent(destination)}`;

    const res = await signIn("email", {
      email,
      redirect: false,       // mostramos confirmación aquí mismo
      callbackUrl,           // el enlace del mail apuntará a /bienvenido
    });

    setLoading(false);

    if (res?.error) {
      setError(mapError(res.error));
      return;
    }
    setSent(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accede con tu email</CardTitle>
        <CardDescription>
          Te enviaremos un enlace de acceso. No necesitas contraseña.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {sent ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            <p>✅ Enviamos un enlace a <b>{email}</b>. Revisa tu buzón y spam.</p>
            <p className="mt-2 text-xs text-zinc-500">
              Al abrir el enlace verás una pantalla de bienvenida y serás redireccionado automáticamente para comenzar.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="text-sm font-medium">Correo electrónico</label>
            <Input
              name="email"
              type="email"
              placeholder="tucorreo@dominio.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Enviando…" : "Enviar enlace"}
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
