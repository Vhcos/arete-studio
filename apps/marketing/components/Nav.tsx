// apps/marketing/components/Nav.tsx
import Link from "next/link";

const DEFAULT_APP_BASE = "https://app.aret3.cl";

export default function Nav() {
  const appBase = (process.env.NEXT_PUBLIC_APP_BASE_URL || DEFAULT_APP_BASE).replace(/\/+$/, "");
  const loginHref = `${appBase}/auth/sign-in`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Areté
        </Link>

        <nav className="hidden gap-6 md:flex">
          {/* anclas internas → <a> */}
          <a href="#producto" className="text-sm text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">Producto</a>
          <a href="#precios" className="text-sm text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">Precios</a>
          {/* rutas internas → Link */}
          <Link href="/recursos/centro-de-ayuda" className="text-sm text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">Centro de ayuda</Link>
          <Link href="/recursos/asesorias" className="text-sm text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">Asesorías</Link>
        </nav>

        <div className="flex items-center gap-2">
          {/* externa → <a> */}
          <a href={loginHref} className="text-sm text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white" rel="noopener">
            Acceso
          </a>
          {/* CTA como link con estilos de botón (no Button) */}
          <a
            href="#cta"
            className="inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-slate-300 hover:bg-slate-50"
          >
            Pruébalo gratis
          </a>
        </div>
      </div>
    </header>
  );
}
