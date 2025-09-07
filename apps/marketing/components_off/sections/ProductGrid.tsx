import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@arete-studio/ui";

const items = [
  {
    title: "Guía paso a paso",
    desc: "Wizard de 5 pasos con guardado automático por sección.",
  },
  {
    title: "Asistencia de IA",
    desc: "Sugerencias y revisión final del informe con IA (opcional).",
  },
  {
    title: "Plan financiero básico",
    desc: "Cálculos rápidos: LTV/CAC, curva PE y metas.",
  },
  {
    title: "Informe exportable",
    desc: "Imprimir o enviarlo a tu correo con tu marca.",
  },
  {
    title: "Benchmark de industria",
    desc: "Comparativa simple por rubro y referencias locales.",
  },
  {
    title: "Colaboración",
    desc: "Comparte el enlace del informe para comentarios.",
  },
];

export default function ProductGrid() {
  return (
    <section id="producto" className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold">¿Qué incluye Areté?</h2>
        <p className="mt-2 max-w-prose text-zinc-600 dark:text-zinc-400">
          De la idea al informe en minutos. Simple, visual y enfocado en lo que importa.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Card key={it.title} className="h-full">
            <CardHeader>
              <CardTitle>{it.title}</CardTitle>
              <CardDescription>{it.desc}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>
    </section>
  );
}
