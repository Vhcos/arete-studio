// app/auth/sign-in/page.tsx
import SignInClient from "./SignInClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Acceder — ARET3",
  description: "Inicia sesión con un enlace mágico por email.",
};

export default function Page({
  searchParams,
}: {
  searchParams?: { email?: string };
}) {
  const initialEmail = searchParams?.email ?? "";

  return (
    <main className="mx-auto w-full max-w-md px-6 py-10">
      <h1 className="text-2xl font-semibold">Solo necesitamos confirmar que existes</h1>
      <p className="mt-1 text-sm text-slate-600">
        Llegará un enlace a tu email no se te pedirá contraseña NI PAGO.
      </p>

      <div className="mt-6 rounded-2xl border p-6 shadow-sm">
        <SignInClient initialEmail={initialEmail} />
      </div>

      <p className="mt-6 text-xs text-slate-500">
        Al continuar aceptas los <a className="underline" href="/terms">Términos</a> y la{" "}
        <a className="underline" href="/privacy">Política de Privacidad</a>.
      </p>
    </main>
  );
}
