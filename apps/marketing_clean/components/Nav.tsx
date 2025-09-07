import Link from "next/link";

export default function Nav() {
  return (
    <header className="w-full border-b">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold">Areté</Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#producto">Producto</a>
          <a href="#precios">Precios</a>
          <a href="#recursos">Recursos</a>
          <Link href="/auth/sign-in" className="rounded-lg px-3 py-1.5 border">
            Acceder
          </Link>
        </nav>
      </div>
    </header>
  );
}
