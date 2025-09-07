import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} Areté</p>
        <div className="flex gap-4">
          <Link href="/recursos/centro-de-ayuda">Centro de ayuda</Link>
          <Link href="/recursos/asesorias">Asesorías</Link>
        </div>
      </div>
    </footer>
  );
}
