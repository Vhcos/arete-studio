
¡de una! te dejo un “meta-prompt” + una guía en **Markdown** para pegar tal cual en tu repo (p. ej. `docs/wizard-style.md`) y que cualquiera —o tú conmigo en otra conversación— siga exactamente el mismo estilo y reglas.

---

# 🧭 Aret3 · Guía de estilo y “meta-prompt” para el Wizard

> **Objetivo**
> Mantener consistencia visual/UX y reglas de negocio en los pasos del Wizard (1–9+) y pantallas económicas. Este documento también sirve como *prompt base* para futuras conversaciones con IA.

## 0) Meta-prompt (pégalo al iniciar una nueva conversación)

> **Rol**: Diseñador(a) de producto + Frontend (Next.js 15 / App Router / Tailwind).
> **Tono**: claro, empático, pensado para usuarios sin formación financiera.
> **Estilo visual**: tarjetas limpias, bordes `rounded-2xl`, `border`, `bg-white`, `shadow-sm`, layout en contenedores centrados `max-w-4xl/5xl/7xl`.
> **Componentes clave**:
>
> * `EconomicHeader` arriba de cada paso con `title` y `subtitle` (acepta `subtitle` como string o JSX).
> * `BotIcon` (variants: `sky`, `are`, `t3`) para denotar acciones de IA.
> * Ayudas con `<details><summary>…</summary>…</details>` (“¿Te explico más?”, “¿Qué significa?”).
> * Inputs con formato CLP (Chile) y números legibles.
>   **Patrones de UI**:
> * Bloques temáticos en tarjetas.
> * Acciones primarias a la derecha (`NextButton`), secundarias a la izquierda (`PrevButton`).
> * Campos sensibles resaltados: p. ej. **Porcentaje de conversión** con borde rojo (`border-red-500`) y `bg-rose-50`.
>   **Reglas de negocio (resumen)**:
> * Paso 1: guardar **email** y **notifyEmail** (compat).
> * Paso 6: admite `ventaAnio1` o `ventaAnual`; `presupuestoMarketing` alias `marketingMensual`; `costoVarUnit` o `costoVarPct`.
> * Paso 7:
>
>   * `mcUnit = ticket − costoUnit` o `ticket − (ticket*costoVarPct/100)`.
>   * `clientesPE = ceil(gastosFijosMensuales / mcUnit)`.
>   * `ventasPE = clientesPE * ticket` (enteros).
>   * Capital de trabajo = suma de déficits mensuales en rampa lineal hasta `mesesPE`.
>   * `traficoSugerido = ceil(clientesMensuales / (conversionPct/100))`.
>   * `CAC_estimado = presupuestoMarketing / clientesMensuales`.
> * Paso 8 (EERR comparativo): tabla con columnas **Ítem | EERR Mensual | EERR Anual | % guía** y tooltips de ayuda.
>   **Texto y microcopy**: directo, sin jerga, ejemplo/s sugeridos y ayudas desplegables.
>   **Accesibilidad**: `aria-*` razonable, `summary` descriptivos, foco visible.
>   **No romper compat**: cualquier cambio debe mapear a nombres previos del store.
>
> **Pídeme**: “aplica el patrón del Paso 6/7”, “usa EconomicHeader”, “añade ayudas estilo Step-7”, “formatea CLP y números en es-CL”, “redondea a enteros/ceil donde aplica”, “usa cards 3D sutiles”.

---

## 1) Principios de diseño/UX

* **Pensado para no financieros**: explicaciones en lenguaje simple, ejemplos y ayudas desplegables.
* **Progresivo**: sólo lo imprescindible en cada paso; extras ocultos bajo `<details>`.
* **Coherencia**: mismas clases y densidades por defecto.
* **Feedback**: inputs con foco/foco-error; desambiguar siempre con texto corto.

## 2) Componentes y patrones visuales

* **Contenedores**: `main.mx-auto.max-w-5xl/7xl.px-2.py-8`.
* **Tarjetas**: `rounded-2xl border bg-white shadow-sm p-5`.
* **Headers**: `EconomicHeader` con `title` y `subtitle` (puede llevar `<BotIcon />`).
* **Ayudas**: `<details class="mt-2 text-xs text-slate-600"><summary class="cursor-pointer font-medium text-slate-700">¿Te explico más?</summary>…</details>`.
* **Acciones**: `PrevButton` izquierda, `NextButton` derecha.
* **Campo destacado**: para **% conversión**, `bg-rose-50 border-red-500 focus:ring-red-200`.

## 3) Reglas de negocio y fórmulas

### Formateo

* **CLP**: `toLocaleString("es-CL")` (`fmtCL`).
* **Números**: `Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 })` (`fmtNum`).
* **Parse CLP**: quitar puntos, cambiar coma por punto y `Number(...)` (redondeo al entero).

### Paso 7 (equilibrio + cliente)

* `mcUnit = ticket − min(costoUnit, ticket)` **o** `ticket − min(ticket*costoVarPct/100, ticket)`.
* `clientesPE = ceil(gastosFijosMensuales / mcUnit)` → **entero**.
* `ventasPE = clientesPE * ticket` → **entero**.
* **Capital de trabajo**: rampa lineal de clientes desde 0% hasta 100% en `mesesPE`; por mes:
  `deficit = max(0, gastosFijosMensuales − (clientesMes * mcUnit))`. Sumar 12 meses.
* **Clientes objetivo (mes)**: `ventaMensual / ticket` si no viene de store.
* **Conversión**: `ratio = conversionPct/100`;
  `traficoSugerido = ceil(clientesObjetivoMes / ratio)`.
* **CAC (estimado)**: `presupuestoMarketing / clientesObjetivoMes`.

### Paso 8 (EERR)

* Tabla: **Ítem | EERR Mensual | EERR Anual | % guía** (guías del rubro).
* `impuestos` simplificado: **2% de venta** ≈ 25% del resultado antes de impuestos en plantillas típicas.
* Tooltips:

  * **Costo variable materiales**: insumos directos que varían con la venta.
  * **Costo variable personal**: horas/propinas/turnos proporcionales a la venta.
  * **Resultado antes de impuestos**: utilidad antes de tributar.
  * **Impuestos (2%)**: simplificación para estimación rápida.

## 4) Compatibilidad de datos (store)

* **Step 1**: guardar **email** y **notifyEmail** (ambos).
* **Step 6**:

  * `ventaAnio1` **o** `ventaAnual`.
  * `presupuestoMarketing` **alias** `marketingMensual`.
  * `costoVarUnit` **o** `costoVarPct`.
  * `clientesMensuales` (si no viene, derivar de `ventaMensual/ticket`).
* **Step 7** guarda: `mesesPE`, `conversionPct`, `traficoMensual` (si calculable), `presupuestoMarketing`.

## 5) Texto y microcopy

* Títulos:

  * Paso 6: “Paso Económico punto de partida tu capital y tus ventas”.
  * Paso 7: “Conoce a tus clientes y tu punto de equilibrio”.
  * Paso 8: “Tus resultados necesarios para tu planificación financiera”.
* Subtítulos cortos y pedagógicos.
* Ayudas con ejemplos concretos.

## 6) Utilidades (código)

```ts
// Números/CLP
export const fmtCL = (n:number)=> n.toLocaleString("es-CL");
export const fmtNum = (n:number)=> new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(Number.isFinite(n)?n:0);

export function parseCLP(v: string|number|null|undefined){
  if (v==null) return 0;
  const s = String(v).replace(/\./g,"").replace(/\s+/g,"").replace(",",".");
  const n = Number(s);
  return Number.isFinite(n)? Math.round(n): 0;
}

export function deriveMcUnit(ticket:number, costoUnit?:number, costoPct?:number){
  const price = ticket||0;
  const cost = (costoUnit && costoUnit>0)
    ? Math.min(costoUnit, price)
    : (costoPct && costoPct>0 && price>0) ? Math.min((price*costoPct)/100, price) : 0;
  return Math.max(0, Math.round(price - cost));
}
```

## 7) Navegación y progreso

* **ProgressHeader**: barra de progreso + labels.
* Mantener rutas `/wizard/step-N` y evitar rutas duplicadas tipo `/wizard/Idea`.

## 8) Accesibilidad

* `aria-pressed` en selecciones (p. ej. 3/6/9/12 meses).
* `summary` descriptivo en `<details>`.
* Estados `disabled` visibles.

## 9) Convenciones de commits/PR

* Rama: `feat/wizard-<tema>-YYYY-MM-DD`
* Commit: `feat(step-7): tooltip de PE y rampa`, `fix(step-8): % guía`, `chore: util fmtCL`.
* PR: título con scope + breve lista de cambios; screenshot si es UI.

---

## 10) Scripts útiles

### Crear nueva rama para pasos 9 y 10

```bash
# desde main actualizado
git checkout main
git pull --ff-only

# crea y cambia a la nueva rama
git checkout -b feat/wizard-pasos-9-10-2025-10-24

# trabaja, luego:
git add -A
git commit -m "feat(wizard): inicia pasos 9 y 10 con guía de estilo unificada"
git push -u origin feat/wizard-pasos-9-10-2025-10-24

# abrir PR (GitHub CLI opcional)
gh pr create -B main -H feat/wizard-pasos-9-10-2025-10-24 \
  --title "Wizard: pasos 9 y 10" \
  --body "Aplica patrón Step-6/7/8, ayudas, formateo es-CL, reglas de negocio."
```

### Merge del PR

* Prefiere **Squash & Merge** si fueron muchos commits.
* Luego borra la rama en remoto:

```bash
git branch -d feat/wizard-pasos-9-10-2025-10-24
git push origin --delete feat/wizard-pasos-9-10-2025-10-24
```

---

## 11) Checklist rápido por paso

* **Siempre** `EconomicHeader`.
* Tarjetas con `rounded-2xl border bg-white shadow-sm`.
* Ayudas con `<details>` y copy simple.
* Números CL (`fmtCL`, `fmtNum`), **enteros** donde definimos (PE).
* Compatibilidad de nombres al guardar en store.
* Validaciones suaves; mensajes breves.
* Botones “Atrás / Siguiente” y banner de upsell al final.

