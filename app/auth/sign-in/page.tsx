// app/auth/sign-in/page.tsx
import SignInClient from "./SignInClient";

export const dynamic = "force-dynamic"; // evita pre-render estatico

export default function Page({
  searchParams,
}: {
  searchParams?: { email?: string };
}) {
  const initialEmail = searchParams?.email ?? "";

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <SignInClient initialEmail={initialEmail} />
    </main>
  );
}
