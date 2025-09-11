/** apps/marketing_clean/components/Nav.tsx */
import Link from "next/link";
import Logo from "./Logo";

const APP = process.env.NEXT_PUBLIC_APP_ORIGIN || "https://app.aret3.cl";

export default function Nav() {
  return (
    <header className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <Logo />
        <span className="font-semibold tracking-wide"></span>
      </Link>

      <nav className="flex items-center gap-3">
        <Link href="/#como-funciona" className="text-sm text-slate-600 hover:text-slate-900">
          Producto
        </Link>
        <Link href="/#precios" className="text-sm text-slate-600 hover:text-slate-900">
          Precios
        </Link>
        <Link
          href={`${APP}/auth/sign-in?callbackUrl=/`}
          className="text-sm px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50"
        >
          Acceder
        </Link>
        <Link
          href={`${APP}/auth/sign-in?callbackUrl=/`}
          className="text-sm px-3 py-1.5 rounded-md bg-black text-white hover:bg-zinc-800"
        >
          Empieza gratis
        </Link>
      </nav>
    </header>
  );
}
