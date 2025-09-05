import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from "@arete-studio/ui";

const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE_URL!;

const plans = [
  {
    name: "Gratis",
    price: "$0",
    period: "",
    features: ["1 informe", "Asistencia de IA limitada", "Imprimir / Enviar a email"],
    cta: { label: "Empieza gratis", href: "#cta" },
    highlight: false,
  },
  {
    name: "Pro",
    price: "$8",
    period: "/mes",
    features: ["20 informes/mes", "IA extendida", "Exportar PDF con logo", "Prioridad soporte"],
    cta: { label: "Elegir Pro", href: "#cta" },
    highlight: true,
  },
  {
    name: "Studio",
    price: "$30",
    period: "/mes",
    features: ["Agencias/incubadoras", "100 informes/mes", "White label básico", "API y soportes"],
    cta: { label: "Hablar con nosotros", href: `${APP_BASE}/auth/sign-in` },
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section id="precios" className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold">Planes sencillos</h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">Parte gratis y escala cuando lo necesites.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.name} className={p.highlight ? "border-blue-300 shadow-md" : ""}>
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
              <CardDescription>
                <span className="text-2xl font-bold">{p.price}</span>
                <span className="ml-1 text-sm text-zinc-500">{p.period}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                {p.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <a href={p.cta.href}>
                <Button variant={p.highlight ? "primary" : "secondary"} className="w-full">
                  {p.cta.label}
                </Button>
              </a>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
