import Link from "next/link";

export default function Hero() {
  return (
    <section className="py-16">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
        Areté · Evalúa tu idea con IA
      </h1>
      <p className="mt-4 text-lg text-zinc-600">
        Ingresa tu idea, responde 5 pasos y recibe un informe claro.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/auth/sign-in" className="rounded-lg bg-black text-white px-4 py-2">
          Empieza gratis
        </Link>
        <a href="#producto" className="rounded-lg border px-4 py-2">
          Ver cómo funciona
        </a>
      </div>
    </section>
  );
}
