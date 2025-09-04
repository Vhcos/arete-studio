// app/auth/sign-in/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    // NextAuth maneja CSRF y redirecciones
    const res = await signIn("email", {
      email,
      redirect: false,         // mostramos confirmación en esta misma página
      callbackUrl: "/",        // o "/wizard"
    });

    setLoading(false);

    if (res?.error) {
      setErr(res.error);
      return;
    }
    setSent(true);
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Accede con tu email</h1>

      {sent ? (
        <div className="rounded-md border p-4 text-green-700">
          Te enviamos un enlace de acceso. Revisa tu correo.
          <div className="text-sm text-gray-500 mt-2">
            (En modo desarrollo, el enlace aparece en la consola del servidor)
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="tucorreo@dominio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white rounded px-4 py-2"
          >
            {loading ? "Enviando…" : "Enviar enlace"}
          </button>
          {err && <p className="text-red-600 text-sm">{err}</p>}
        </form>
      )}
    </main>
  );
}
