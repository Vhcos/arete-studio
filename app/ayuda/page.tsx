//app/ayuda/page.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
import Link from "next/link";

export const metadata = {
  title: "Guía de uso • Areté",
  description:
    "Qué hace Areté, cómo llenar el formulario, cómo interpretar los resultados y glosario de conceptos.",
};

export default function AyudaPage() {
  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
      <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="prose prose-sm max-w-none">{children}</div>
  </section>
);

  // Tarjeta roja con texto blanco
   const Card = ({ children }: { children: React.ReactNode }) => (
   <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-neutral-900">
     <div className="p-4 sm:p-5">{children}</div>
   </div>
  );


  // Botón rojo/blanco reutilizable
  const BackBtn = ({ className = "" }: { className?: string }) => (
    <Link
      href="/wizard/step-1"
      className={`inline-flex items-center rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-red-700 ${className}`}
    >
      ← Volver a Areté
    </Link>
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
      {/* Encabezado + TOC */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Guía de uso</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cómo funciona Areté, cómo llenar el formulario, interpretar resultados y glosario.
          </p>
        </div>
        <nav className="sm:sticky sm:top-4">
          <ul className="grid grid-cols-2 gap-2 sm:flex sm:flex-col">
            <li>
              <a
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
                href="#que-hace"
              >
                ¿Qué hace?
              </a>
            </li>
            <li>
              <a
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
                href="#guia"
              >
                Guía de llenado
              </a>
            </li>
            <li>
              <a
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
                href="#interpretar"
              >
                Interpretar
              </a>
            </li>
            <li>
              <a
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
                href="#glosario"
              >
                Glosario
              </a>
            </li>
            <li>
             <a
               className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
               href="#tablero-detalle"
             >
               Tablero: detalle de los cuadros
              </a>
            </li>

          </ul>
        </nav>
      </div>

      {/* Botón Volver (arriba) */}
      <div className="mb-6">
        <BackBtn />
      </div>

      <div className="space-y-8">
        {/* 1) Qué hace */}
        <Card>
          <Section id="que-hace" title="1) ¿Qué hace esta app?">
            <ul>
              <li>
                Procesa tus datos y calcula indicadores básicos (ingresos, costos, margen, punto de equilibrio).
              </li>
              <li>
                Consulta IA para un <strong>informe breve</strong> con rubro/industria,{" "}
                <strong>competencia local (con rangos de precios)</strong>, <strong>FODA + mercado</strong> y un{" "}
                <strong>veredicto</strong> <em>VERDE / ÁMBAR / ROJO</em>.
              </li>
              <li> Te genera un <strong>plan rápido</strong> de 5 pasos para avanzar.</li>
              <li>Permite <strong>enviarte el informe por email</strong> o <strong>descargar los datos</strong>.</li>
            </ul>
            <p className="mt-2">
              El objetivo es darte una lectura rápida, honesta y accionable de tu viabilidad, riesgos y próximos pasos.
            </p>
          </Section>
        </Card>

        {/* 2) Guía de llenado */}
        <Card>
          <Section id="guia" title="2) Guía de llenado">
            <p>
              <strong>Tip:</strong> escribe montos en <strong>CLP</strong>. Si no sabes un dato, déjalo vacío; la IA lo
              marcará como “N/D”.
            </p>
            <h3>Identificación</h3>
            <ul>
              <li>
                <strong>Nombre del proyecto:</strong> cómo llamas tu idea. <em>Ej.: “Joyería de autor”.</em>
              </li>
              <li>
                <strong>Nombre del emprendedor/a</strong> y <strong>Email</strong> para el envío del informe.
              </li>
            </ul>

            <h3>Describe tu idea</h3>
            <ul>
              <li>
                <strong>Idea (1–2 frases):</strong> qué vendes y a quién.{" "}
                <em>Ej.: “Joyería artesanal con foco en RM, venta física + Instagram”.</em>
              </li>
              <li>
                <strong>Ventaja diferenciadora:</strong> ¿por qué tú? (tecnología, precio, ubicación, experiencia,
                marca, red, velocidad, datos).
              </li>
              <li>
                <strong>Oportunidades/Amenazas:</strong> factores que ayudan o perjudican.
              </li>
            </ul>

            <h3>Datos económicos</h3>
            <ul>
              <li>
                <strong>Rubro</strong> y <strong>Ubicación</strong> (comuna, región, país).
              </li>
              <li>
                <strong>Inversión inicial:</strong> habilitación, maquinaria, permisos.
              </li>
              <li>
                <strong>Capital de trabajo:</strong> caja para operar los primeros meses.
              </li>
              <li>
                <strong>Ingresos mensuales meta</strong> y <strong>Ticket promedio</strong>.
              </li>
              <li>
                <strong>Costo unitario:</strong> costo directo por unidad vendida.
              </li>
              <li>
                <strong>CAC</strong> (opcional): costo por conseguir un cliente nuevo.
              </li>
              <li>
                <strong>Frecuencia anual:</strong> compras promedio por cliente al año.
              </li>
              <li>
                <strong>Gastos fijos mensuales</strong> y <strong>Meses para punto de equilibrio</strong> (opcional).
              </li>
              <li>
                <strong>Señales/Testeo previo:</strong> ventas piloto, encuestas, lista de espera, etc.
              </li>
            </ul>

            <h3>Botones</h3>
            <ul>
              <li>
                <strong>Evaluar con IA:</strong> genera análisis + veredicto.
              </li>
              <li>
                <strong>Informe a mi email:</strong> te lo envía al correo ingresado.
              </li>
              <li>
                <strong>Descargar informe:</strong> baja los datos (formato JSON).
              </li>
            </ul>
          </Section>
        </Card>

        {/* 3) Interpretar */}
        <Card>
          <Section id="interpretar" title="3) Cómo interpretar la información">
            <h3>Informe (IA)</h3>
            <ul>
              <li>
                <strong>Rubro / industria:</strong> contexto del sector.
              </li>
              <li>
                <strong>Competencia local ($):</strong> referencias y rangos de precio para tu posicionamiento.
              </li>
              <li>
                <strong>FODA + mercado:</strong> fortalezas, oportunidades, debilidades, amenazas; y estimación de
                mercado si hay datos.
              </li>
              <li>
                <strong>Veredicto:</strong> <em>VERDE</em> (avanzar), <em>ÁMBAR</em> (ajustar), <em>ROJO</em> (pausar)
                con razón principal.
              </li>
              <li>
                <strong>Narrativa:</strong> resumen para compartir o pegar en un documento.
              </li>
              <li>
                <strong>“N/D”</strong> significa que falta información para una estimación confiable.
              </li>
            </ul>

            <h3>Tablero</h3>
            <ul>
              <li>
                Indicadores básicos a partir de tus entradas: ingresos, margen, punto de equilibrio, etc.
              </li>
              <li>
                Si capturas <strong>CAC</strong> y <strong>frecuencia anual</strong>, puedes aproximar{" "}
                <strong>LTV</strong> y relación <strong>LTV/CAC</strong>.
              </li>
            </ul>

            <h3>Qué hacer después</h3>
            <ul>
              <li>
                Si <em>ÁMBAR/ROJO</em>, revisa ticket, costo unitario, gastos fijos, CAC y capital. Testea 2–3 supuestos
                y vuelve a evaluar.
              </li>
              <li>
                Si <em>VERDE</em>, ejecuta: abastecimiento, primera campaña controlando CAC y mide conversión por canal.
              </li>
            </ul>
          </Section>
        </Card>

        {/* 4) Glosario */}
        <Card>
          <Section id="glosario" title="4) Glosario">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="font-medium">Rubro</dt>
                <dd>Categoría del negocio (retail, servicios, educación, alimentos, etc.).</dd>
              </div>
              <div>
                <dt className="font-medium">Ubicación</dt>
                <dd>Comuna–región–país; se usa para competencia y precios.</dd>
              </div>
              <div>
                <dt className="font-medium">Inversión inicial</dt>
                <dd>Gastos previos a abrir: adecuación del local, máquinas, permisos.</dd>
              </div>
              <div>
                <dt className="font-medium">Capital de trabajo</dt>
                <dd>Caja para operar los primeros meses (inventario, sueldos, arriendo, publicidad).</dd>
              </div>
              <div>
                <dt className="font-medium">Ingresos mensuales meta</dt>
                <dd>Ventas que esperas facturar en 30 días.</dd>
              </div>
              <div>
                <dt className="font-medium">Ticket promedio</dt>
                <dd>
                  Venta promedio por pedido. <em>Ticket = Ventas del mes / Nº de ventas.</em>
                </dd>
              </div>
              <div>
                <dt className="font-medium">Costo unitario (CU)</dt>
                <dd>Costo directo por unidad vendida (sin gastos fijos).</dd>
              </div>
              <div>
                <dt className="font-medium">Gastos fijos</dt>
                <dd>Costos que no varían con el volumen (arriendo, sueldos base, servicios, software).</dd>
              </div>
              <div>
                <dt className="font-medium">Punto de equilibrio (PE)</dt>
                <dd>
                  Ventas donde la ganancia es 0. <em>PE ventas = Gastos fijos / (MC/Precio)</em>.
                </dd>
              </div>
              <div>
                <dt className="font-medium">CAC</dt>
                <dd>
                  Costo para conseguir un cliente nuevo. <em>CAC = Gasto marketing / Clientes nuevos</em>.
                </dd>
              </div>
              <div>
                <dt className="font-medium">Frecuencia anual</dt>
                <dd>Veces que te compra un cliente promedio en el año lo que multiplicado por el ticket promedio
                  obtendras el LTV.</dd>
              </div>
              <div>
                <dt className="font-medium">LTV y LTV/CAC</dt>
                <dd>LTV. Corresponde al ticket por la frecuencia anual  de compra lo que te da el ingreso anual por cliente.
                  la Relación LTV/CAC: El ingreso anual por cliente dividido por CAC deberíamos tener un objetivo ≥ 3.</dd>
              </div>
              <div>
                <dt className="font-medium">FODA</dt>
                <dd>Fortalezas, Oportunidades, Debilidades y Amenazas.</dd>
              </div>
              <div>
                <dt className="font-medium">MarketEstimateCLP</dt>
                <dd>Estimación del tamaño de mercado en CLP; si 0, faltan señales.</dd>
              </div>
              <div>
                <dt className="font-medium">Veredicto</dt>
                <dd>VERDE/ÁMBAR/ROJO con la razón principal.</dd>
              </div>
              <div>
                <dt className="font-medium">Narrativa</dt>
                <dd>Texto concatenado con lo más relevante del informe.</dd>
              </div>
            </dl>
          </Section>
        </Card>
        {/* 5) Tablero: detalle de cada cuadro */}
        <Card>
           <Section id="tablero-detalle" title="5) Tablero: detalle de cada cuadro">
           <h3><strong>1. Punto de Equilibrio (P.E)</strong></h3>
            <p>
               Es el nivel de ventas mensuales necesario para cubrir <strong>gastos fijos</strong> con tu
               <strong> margen de contribución</strong>. Si vendes por sobre ese punto, comienzas a generar utilidad.
           </p>
           <ul>
             <li>
             <strong>Qué ves:</strong> el monto $ estimado para “empatar” + un estado (por encima / por debajo) según tus
             ingresos.
            </li>
            <li>
              <strong>Cálculo (idea):</strong> margen de contribución % = (Precio − Costo unitario) / Precio. <br />
              Ventas para PUNTO DE EQULIBRIO ≈ Gastos fijos / (Margen de contribución %).
           </li>
           <li>
              <strong>Interpretación:</strong> si tus <em>ingresos meta</em> &gt; PE → vas encima del punto; si no, estás por debajo.
           </li>
           <li>
              <strong>Cómo mejorarlo:</strong> subir precio, bajar costo unitario, bajar gastos fijos, aumentar frecuencia de compra.
           </li>
           </ul>

           <h3><strong>2. Veredicto</strong></h3>
           <p>
              Resumen tipo <strong>semáforo</strong> de la IA: <em>VERDE</em> (avanzar), <em>ÁMBAR</em> (ajustar), <em>ROJO</em> (pausar), con la razón principal.
           </p>
           <ul>
             <li><strong>Qué ves:</strong> color + texto breve con la justificación.</li>
             <li><strong>De qué depende:</strong> consistencia de tus números (ticket, costo unitario, gastos fijos, C.A.C.), claridad de la propuesta y señales/testeos.</li>
             <li><strong>Qué hacer:</strong> en ÁMBAR/ROJO, corrige los supuestos indicados y vuelve a evaluar.</li>
          </ul>

          <h3><strong>3. Top riesgos</strong></h3>
          <p>
               Lista priorizada de 3–5 riesgos clave que pueden afectar viabilidad (demanda, costos, competencia, canal, capital, ejecución).
          </p>
          <ul>
              <li><strong>Qué ves:</strong> riesgos ordenados por impacto/probabilidad.</li>
              <li><strong>Cómo usarlo:</strong> convierte cada riesgo en un experimento (medible) para reducir incertidumbre.</li>
          </ul>

           <h3><strong>4. Experimentos sugeridos </strong></h3>
           <p>
                Acciones rápidas para validar supuestos críticos (precio, canal, conversión, interés real). Cada experimento debería tener
               <strong> hipótesis</strong>, <strong>pasos</strong>, <strong>métrica</strong> y <strong>criterio de éxito</strong>.
           </p>
           <ul>
              <li><strong>Qué ves:</strong> 3–5 pruebas priorizadas (bajo costo/rápidas).</li>
              <li><strong>Cómo usarlo:</strong> agenda la prueba, mide la métrica objetivo y decide: <em>seguir / ajustar / descartar</em>.</li>
          </ul>

          <h3><strong>5. Curva hacia el punto de equilibrio</strong></h3>
          <p>
              Gráfico que muestra tus <strong>ingresos proyectados por mes</strong> versus la <strong>línea del punto de equilibrio</strong>.
              Permite ver en qué mes lo alcanzarías (si lo alcanzas).
         </p>
         <ul>
              <li><strong>Qué ves:</strong> una curva de ventas y una línea de referencia (PE). El cruce indica el mes de equilibrio.</li>
              <li><strong>Interpretación:</strong> si la curva va por debajo de la línea de PE, necesitas mejorar precio, costos, conversión o volumen.</li>
              <li><strong>Cómo mover la curva:</strong> sube ticket/promos de mayor valor, reduce CU, baja gastos fijos, mejora conversión o frecuencia.</li>
         </ul>

          <h4><strong>6. Errores comunes</strong></h4>
          <ul>
              <li>Usar <em>ticket</em> muy optimista o <em>costo unitario</em> subestimado.</li>
              <li>No incluir todos los <em>gastos fijos</em> (arriendo, sueldos, servicios, software, comisiones).</li>
              <li>Proyectar ventas sin considerar <em>CAC</em> real o capacidad de ejecución.</li>
          </ul>
         </Section>
       </Card>

        {/* Botón Volver (debajo del glosario) */}
        <div className="flex justify-end">
          <BackBtn />
        </div>
      </div>
    </div>
  );
}
