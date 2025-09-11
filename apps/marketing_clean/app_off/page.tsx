import NewsletterForm from "../components/NewsletterForm";

export default function Page() {
  return (
    <>
      <section className="py-10">
        <h1 className="text-3xl font-bold">Evalúa tu idea de negocio con IA</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Completa 5 pasos y recibe un informe claro para decidir. Rápido, simple y visual.
        </p>

        <div className="mt-6 flex gap-3">
          <a href="#como-funciona" className="underline">Ver cómo funciona</a>
        </div>
      </section>

      <section id="como-funciona" className="py-8 border-t">
        <h2 className="text-xl font-semibold">¿Cómo funciona?</h2>
        <ol className="list-decimal ml-5 mt-2 space-y-1">
          <li>Describe tu idea</li>
          <li>Completa 5 pasos</li>
          <li>Obtén tu informe</li>
        </ol>
      </section>

      <section className="py-8 border-t">
        <h2 className="text-xl font-semibold">Precios</h2>
        <p className="mt-2 text-slate-600">Comienza gratis. Pro desde US$8/mes (placeholder).</p>
      </section>

      <section className="py-8 border-t">
        <h2 className="text-xl font-semibold">Recibe novedades</h2>
        <div className="mt-3">
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
