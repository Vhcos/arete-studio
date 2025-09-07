import Nav from "../components/Nav";
import Hero from "../components/sections/Hero";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-4">
        <Hero />

        <section id="producto" className="py-16 border-t mt-8">
          <h2 className="text-2xl font-semibold">¿Cómo funciona?</h2>
          <ol className="mt-4 space-y-2 list-decimal list-inside text-zinc-700">
            <li>Describe tu idea.</li>
            <li>Completa 5 pasos.</li>
            <li>Obtén tu informe para compartir.</li>
          </ol>
        </section>

        <section id="precios" className="py-16 border-t">
          <h2 className="text-2xl font-semibold">Precios</h2>
          <p className="mt-2 text-zinc-600">Comienza gratis. Plan Pro desde US$8/mes (placeholder).</p>
        </section>

        <section id="recursos" className="py-16 border-t">
          <h2 className="text-2xl font-semibold">Recursos</h2>
          <ul className="mt-3 list-disc list-inside text-zinc-700">
            <li><a href="/recursos/centro-de-ayuda">Centro de ayuda</a></li>
            <li><a href="/recursos/asesorias">Asesorías</a></li>
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
