# README — Flujo de trabajo con *heredocs* (ARET3)

Este documento estandariza cómo hacemos cambios en el repo usando **heredocs** (sin `git apply`), para asegurar reproducibilidad y menos fricción.

## 0) Convenciones
- **Ramas**: `feat/<tema>-YYYY-MM-DD`, `fix/<tema>-YYYY-MM-DD`, `chore/<tema>-YYYY-MM-DD`
- **Commits**: `feat(<área>): …`, `fix(<área>): …`, `chore(<área>): …`
- **Zona horaria**: America/Santiago
- **Moneda/formatos**: Chile (CLP, UF, IVA)
- **Rubro**: la normalización a español vive en `lib/nonAI-report.ts` (no tocar `page.tsx` para esto).

## 1) Quickstart — Crear/actualizar archivos con heredoc
```bash
git fetch --all --prune
git switch -c feat/<tema>-YYYY-MM-DD
mkdir -p <ruta/carpeta>
cat > lib/finance/tax.ts <<'TS'
/**
 * Cálculo de impuesto:
 * - 25% de la rentabilidad antes de impuestos (PBT/RAI)
 * - redondeado a entero; si PBT <= 0, impuesto = 0
 * - % sobre venta = impuesto / venta (si venta > 0)
 */
export function computeTaxFromPBT(pbt: number, sales: number) {
  const taxable = Math.max(0, Number.isFinite(pbt) ? pbt : 0);
  const taxAmount = Math.round(0.25 * taxable);
  const taxPctOverSales = sales > 0 ? taxAmount / sales : 0;
  return { taxAmount, taxPctOverSales };
}
TS
git add -A
git commit -m "feat(finanzas): helper computeTaxFromPBT (25% RAI + % sobre venta)"
git push -u origin feat/<tema>-YYYY-MM-DD
perl -0777 -pe 's|<details open=\{helpOpen\} className="text-sm">[\s\S]*?</details>|<details open={helpOpen} className="text-sm">
  <summary className="cursor-pointer font-medium text-slate-800">Impuestos (25% RAI)</summary>
  <p className="mt-1 text-slate-600 text-[13px]">
    Se calcula como <b>25% del resultado antes de impuestos (RAI)</b>, redondeado a entero.
    El porcentaje mostrado sobre la venta es <code>impuesto / venta</code>. Si el RAI ≤ 0, el impuesto es 0.
  </p>
</details>|g' -i app/wizard/step-8/page.tsx

grep -RIn --exclude-dir=node_modules --include='*.{ts,tsx}' "Impuestos (2%)" .

mkdir -p lib/model
cat > lib/model/sectors.ts <<'TS'
/* …contenido de sectores… */
TS

cat > lib/model/step6-distributions.ts <<'TS'
/* …contenido de plantillas por rubro… */
TS

perl -0777 -pe 's/"Impuestos \(2%\)"/"Impuestos (25% RAI)"/g' -i app/wizard/step-8/page.tsx
perl -0777 -pe 's/"Impuestos \(2%\)"/"Impuestos (25% RAI)"/g' -i components/finance/EERRAnual.tsx

git add -A
git commit -m "feat(step6): plantillas por rubro + normaliza labels impuestos (25% RAI)"
git push

git status
git fetch --all --prune
git switch main
git pull --ff-only
git merge --no-ff origin/feat/<tema>-YYYY-MM-DD -m "merge: <resumen del cambio>"
git push origin main

git branch -d feat/<tema>-YYYY-MM-DD
git push origin --delete feat/<tema>-YYYY-MM-DD

git log --oneline --graph --decorate --max-count=20
git diff --name-status origin/main...HEAD
grep -RIn --exclude-dir=node_modules --include='*.{ts,tsx}' "Impuestos (2%)" .

git reset --soft HEAD~1
git restore -s origin/main -- <ruta/archivo>
git reflog --date=local --decorate

7) Notas

perl -0777 es portable en macOS y apto para reemplazos multilínea.

No subir .env.local; mantener .env.example documentado.

Rubro en español: lib/nonAI-report.ts.

## Sección de noticias y panel editorial

Este proyecto incluye una sección de noticias pensada para emprendedores y un mini-panel editorial para que el equipo de contenido pueda publicar sin tocar código.

### Qué se agregó

- **Modelo de noticias en Prisma** (migración `add_news_post`) y API REST en `app/api/news/route.ts`.
- **Mini-panel** en `app/tablero/news`:
  - Crear, editar y publicar noticias.
  - Campos: título, subtítulo, autor, fecha de publicación, imagen (URL) y contenido largo.
- **Landing marketing** (`apps/marketing_clean/pages/index.tsx`):
  - Sticky CTA con botones “Noticias Aret3” y “Acceso”.
  - Sección `#noticias` con hasta 3 noticias recientes y botón “Ver todas las noticias”.
- **Rutas públicas** de noticias en marketing:
  - `/noticias` → listado.
  - `/noticias/[slug]` → detalle.

### Flujo editorial

1. Editor entra a `app.aret3.cl` y navega a `/tablero/news`.
2. Crea o edita una noticia y la publica.
3. La noticia aparece automáticamente en:
   - Home (`aret3.cl`, bloque de noticias).
   - `/noticias` y su propia URL `/noticias/{slug}`.
## Módulo de Financiamiento (wizard post-informe)

El módulo de financiamiento permite que, después de generar el informe de aret3, la persona complete un mini-wizard adicional y obtenga borradores de formularios de postulación a fondos de financiamiento (Sercotec, Corfo, Start-Up Chile, fondos municipales, etc.).

### Flujo de usuario

1. El usuario completa el wizard normal y genera su informe.
2. En la pantalla del informe aparece un botón:
   - “Preparar solicitud de financiamiento (3 créditos)”.
3. Al hacer clic, se muestra una pantalla introductoria:
   - Explica qué fondos se cubren, qué entregables obtiene y el costo en créditos.
   - Solo si el usuario confirma se descuentan **3 créditos** (una sola vez por informe).
4. Se crea o reutiliza una `FundingSession` y se inicia un nuevo wizard de 5 pasos:
   - **F1 – Perfil del postulante:** datos personales o de la empresa.
   - **F2 – Estado del negocio y tracción:** etapa, ventas y clientes.
   - **F3 – Monto y uso de fondos:** cuánto pretende solicitar, aporte propio y en qué se usará.
   - **F4 – Fondos objetivo:** selección de instrumentos (Sercotec, Corfo, etc.).
   - **F5 – Links y confirmación:** video pitch, pitch deck, redes y revisión final.

Cada paso guarda los datos en servidor para no perder la información si el usuario sale o recarga.

### Persistencia y créditos

- Se introduce el modelo `FundingSession` asociado a:
  - `userId`, `clientId` y `reportId`.
- `FundingSession` guarda el estado del wizard y un flag `creditsCharged`.
- Los **3 créditos** se descuentan solo al iniciar la primera `FundingSession` para ese informe.
- Si el usuario vuelve más tarde, se reutiliza la misma sesión sin volver a cobrar.

### Outputs esperados (Fase 1)

A partir de la `FundingSession` + el `Report`:

- Se generan bloques de texto por fondo y por pregunta, listos para copiar/pegar.
- Se generan uno o más **PDF** de “Borrador de postulación”, reutilizando el motor de PDF actual (sin tocar la integración de `@sparticuz/chromium`).
- En fases posteriores se podrá añadir exportación a `.docx` u otros formatos editables.

Este módulo está pensado para escalar sin afectar el rendimiento de la app: solo añade formularios ligeros, llamadas simples a la API y una tabla nueva, sin nuevas dependencias pesadas.

# Aret3 — Landing + Noticias + SEO (apps/marketing_clean)

Este documento resume cómo está armada la landing pública de **aret3.cl**, la sección de **Noticias** y las decisiones de **SEO/JSON-LD** que ya se tomaron, para mantener coherencia en futuros cambios.

---

## 1. Estructura general

- App de marketing en `apps/marketing_clean` con **Next.js (pages/)**.
- Nav principal en `components/Nav.tsx`.
- Secciones de la home en `pages/index.tsx`.
- Noticias:
  - Home muestra hasta 3 noticias (`props.news`).
  - Listado: `pages/noticias/index.tsx`.
  - Detalle: `pages/noticias/[slug].tsx`.
- `_document`: `pages/_document.tsx` (config global de idioma, iconos, theme y fuentes).

La landing está deployada en `https://www.aret3.cl/`.

---

## 2. Mensaje y narrativa (estándar)

Toda la landing y las futuras páginas deben mantener:

- **10 pasos** para evaluar idea/negocio.
- **Menos de 30 minutos** para obtener el informe.
- **Regla del 8 %** como referencia de utilidad mínima.

Frases clave:

- “software para emprendedores”.
- “plan de negocios simple y accionable”.
- “no necesitas saber finanzas”.
- “evalúa tu idea o tu negocio en menos de 30 minutos”.

Evitar volver a mensajes antiguos como “5 pasos” o “15 minutos”.

---

## 3. SEO por página

### 3.1 Home `/` (`pages/index.tsx`)

En `<Head>`:

- `<title>Aret3 — Evalúa tu idea o negocio con IA</title>`
- `meta name="description"` alineada con:
  - software para emprendedores
  - 10 pasos, menos de 30 minutos
  - Regla del 8 %
- `link rel="canonical" href="https://www.aret3.cl/"`
- Open Graph:
  - `og:title`, `og:description`, `og:type=website`, `og:url`, `og:image=https://www.aret3.cl/landing-banner.png`
- Twitter:
  - `twitter:card=summary_large_image`
  - `twitter:title`, `twitter:description`, `twitter:image`

### 3.2 Listado `/noticias` (`pages/noticias/index.tsx`)

- Title: `Noticias para emprendedores — Aret3`.
- Description: archivo de noticias y análisis para emprendedores.
- Canonical: `https://www.aret3.cl/noticias`.
- OG/Twitter:
  - Title similar al de la página.
  - Description coherente.
  - `og:type=website`.
  - `og:image=landing-banner.png`.

### 3.3 Detalle `/noticias/[slug]` (`pages/noticias/[slug].tsx`)

- Title: `{item.title} — Noticias Aret3`.
- Description: derivada de `subtitle` o contenido (resumen corto).
- Canonical: `https://www.aret3.cl/noticias/{slug}`.
- OG:
  - `og:title={item.title} — Noticias Aret3`.
  - `og:description=description`.
  - `og:type=article`.
  - `og:url`.
  - `article:published_time` (si hay `publishedAt`).
  - `author` (`authorName` si existe).
  - `og:image=item.imageUrl` o `landing-banner.png` como fallback.
- Twitter:
  - `twitter:card=summary_large_image`.
  - `twitter:title`, `twitter:description`, `twitter:image`.

En el futuro se pueden agregar `Article`/`NewsArticle` en JSON-LD para cada noticia.

---

## 4. JSON-LD (Schema.org)

Todo el JSON-LD se renderiza en la **home** (`pages/index.tsx`) con `<script type="application/ld+json">`.

### 4.1 Organization

Define a Aret3 como organización:

- `@type: "Organization"`.
- `name: "Aret3"`.
- `url: "https://www.aret3.cl/"`.
- `logo: "https://www.aret3.cl/icon.svg"`.
- `sameAs`: redes sociales (Facebook, Instagram, TikTok, X, LinkedIn).

### 4.2 SoftwareApplication

Define el producto como app web:

- `@type: "SoftwareApplication"`.
- `name: "Aret3"`.
- `applicationCategory: "BusinessApplication"`.
- `operatingSystem: "Web"`.
- `url: "https://www.aret3.cl/"`.
- `description`: software para emprendedores, 10 pasos, 30 minutos, Regla del 8 %.
- `offers`: `price=0`, `priceCurrency="CLP"`, texto de prueba gratis.
- `publisher`: la misma `Organization` Aret3.

### 4.3 FAQPage

Marca las Preguntas frecuentes que ya están en la landing:

- `¿Debo pagar para probar?` → respuesta: se puede empezar gratis.
- `¿Necesito saber finanzas?` → respuesta: no, está pensado para personas sin formación financiera.
- `¿Funciona solo en Chile?` → respuesta: no, conceptos universales.
- `¿Qué pasa si no llego al 8 %?` → respuesta: se sugieren ajustes de precio, costos o volumen de clientes.

Si el contenido de las FAQ se cambia en la UI, hay que actualizar también el JSON-LD.

---

## 5. `_document.tsx` (global)

Archivo: `pages/_document.tsx`.

Decisión importante: **no** poner aquí meta description, OG o canonical.  
Sólo configuraciones globales:

- `<Html lang="es">`.
- Iconos:
  - `/icon.svg?v=5`
  - `/favicon.ico?v=2`
  - `/apple-touch-icon.png?v=3`
- `meta name="theme-color"`.
- Fuentes de Google (`Baloo 2`, `Comic Neue`, `Gloria Hallelujah`).
- `noscript` con iframe de GTM.

Todo el SEO se maneja a nivel de cada página con `<Head>`.

---

## 6. Convenciones de anclas e IDs

- `id="ejemplo"`: sección del PDF de ejemplo de informe.
- `id="noticias"`: sección de noticias en la home.
- `id="ejemplo-banner"`: sección final con el banner / imagen del informe.

Evitar IDs duplicados, porque generan HTML inválido y problemas con los links internos.

---

## 7. Flujo de trabajo recomendado para futuros cambios

Cada vez que se toque la landing o las noticias:

1. **Revisar mensaje**:
   - 10 pasos.
   - menos de 30 minutos.
   - Regla del 8 %.
   - Mantener el tono: simple, para personas sin formación financiera.

2. **Actualizar SEO de la página**:
   - `title`.
   - `meta description`.
   - `canonical`.
   - OG y Twitter (mínimo título, descripción, url, imagen).

3. **Actualizar JSON-LD si corresponde**:
   - Si se cambian redes, logo o descripción global → actualizar `Organization` / `SoftwareApplication`.
   - Si cambian las FAQ → actualizar `FAQPage`.

4. **Verificar navegación**:
   - Links a `/#ejemplo`, `/#noticias`, `/noticias`, `/noticias/[slug]`.

5. **Prueba rápida**:
   - Ver la página en producción (`https://www.aret3.cl`).
   - Inspeccionar `<head>` para comprobar:
     - 1 sola `meta name="description"`.
     - 1 `canonical`.
     - OG/Twitter correctos.
   - Revisar que se muestren correctamente las noticias en home y `/noticias`.

---

Con esto, cualquier cambio futuro en `apps/marketing_clean` tiene una guía clara para mantener **coherencia de mensaje** y **SEO sólido**.

## Página para instituciones y navegación hacia Precios

Esta sección documenta la creación de la página **/instituciones** y el ajuste en la navegación para el enlace **Precios**, para mantener coherencia entre el sitio público (aret3.cl) y la app (app.aret3.cl).

---

### 1. Página `/instituciones` (B2B)

**Archivo:** `apps/marketing_clean/pages/instituciones.tsx`  
**URL:** `https://www.aret3.cl/instituciones`

Objetivo: explicar Aret3 a **incubadoras, universidades y programas municipales** con un layout similar al home, pero en clave B2B y fácil de escanear (inspirado en IdeaBuddy).

#### 1.1. Mensaje clave

- Aret3 sirve tanto para **ideas** como para **negocios en funcionamiento**.
- Ayuda a que los programas de emprendimiento sean **más claros y medibles**.
- Genera **informes comparables** y ofrece un **módulo de financiamiento** para apoyar postulaciones a fondos (Sercotec, Corfo, programas municipales, etc.).
- Mantiene el mismo relato que la home:
  - 10 pasos.
  - Menos de 30 minutos.
  - Regla del 8 % (utilidad mínima).

#### 1.2. Estructura de la página

La página se organiza en bloques cortos, no en texto largo tipo “tesis”:

1. **Hero B2B**
   - Badge: “Para incubadoras, universidades y programas municipales”.
   - Título: “Haz tus programas de emprendimiento más claros y medibles”.
   - Subtítulo explicando ideas + negocios en marcha.
   - CTA principal: “Agendar demo de 30 minutos”.
   - CTA secundaria: “Ver ejemplo de informe” → `/#ejemplo`.
   - En desktop, card visual a la derecha con una mini “vista de cohorte”.

2. **Bloque “Problema que resuelve”**
   - Título: “Defiende mejores programas sin ahogarte en planillas”.
   - Explica que Aret3 unifica la información de los proyectos en el mismo esquema.
   - Lista de beneficios:
     - Ideas y negocios en marcha con el mismo formato.
     - Un informe por emprendedor que se puede actualizar.
     - Menos tiempo leyendo documentos, más tiempo acompañando.

3. **Bloque “Lo que pasa con los emprendedores”**
   - Dos tarjetas:
     - “Enseña a tus emprendedores a pensar como negocios”.
     - “Modelación financiera sin hojas de cálculo”.
   - Recalca:
     - 10 pasos simples.
     - Lenguaje cotidiano, sin tecnicismos.
     - Proyecciones básicas y foco en la Regla del 8 %.
     - Informe en PDF para emprendedor e institución.

4. **Bloque “Módulo de financiamiento”**
   - Título: “Del informe interno a borradores para Sercotec, Corfo y fondos locales”.
   - Explica en lenguaje simple el módulo diseñado (wizard F0–F5):
     - Usa el informe + algunas preguntas extra (perfil, etapa, monto, uso, fondos).
     - Genera borradores de respuestas para fondos públicos.
   - Card lateral describiendo ejemplos de fondos (Capital Semilla, Abeja, Semilla Inicia/Expande, programas municipales) y recordando que el emprendedor responde una vez y se generan varios borradores.

5. **Bloque “Piloto 4–8 semanas”**
   - Timeline de 4 cards:
     - Semana 1: Onboarding.
     - Semanas 2–3: uso en talleres o de forma autónoma.
     - Semana 4: revisión de informes.
     - Semanas 6–8: ajustes + módulo de financiamiento + métricas.
   - Texto final: se entrega un reporte de uso y sugerencias para escalar.

6. **CTA final**
   - Bloque oscuro (similar al cierre de la home) con:
     - Mensaje final: acompañar mejor a emprendedores con ideas y negocios en marcha, medir programas y mejorar postulaciones.
     - Botón: “Agendar demo de 30 minutos”.

#### 1.3. SEO de `/instituciones`

En el `<Head>` de `instituciones.tsx`:

- `title`:  
  `Aret3 para instituciones — incubadoras, universidades y programas municipales`
- `meta description`:  
  Explica que Aret3 evalúa ideas y negocios en funcionamiento en menos de 30 minutos, con informes comparables y apoyo para financiamiento.
- `canonical`: `https://www.aret3.cl/instituciones`.
- Open Graph y Twitter:
  - `og:title` / `twitter:title` iguales al title.
  - `og:description` / `twitter:description` adaptadas al contexto B2B.
  - `og:image` / `twitter:image` → `https://www.aret3.cl/landing-banner.png`.

---

### 2. Navegación y enlace a **Precios**

**Archivo:** `apps/marketing_clean/components/Nav.tsx`

Se tomó la decisión de separar claramente:

- **Mundo marketing:** `https://www.aret3.cl` (landing, producto, instituciones, noticias, contacto).
- **Mundo app:** `https://app.aret3.cl` (login, wizard, tablero, informes, billing).

Para no romper el flujo de trabajo dentro de la app (wizard, informes), el enlace de **Precios** en el nav del sitio público se comporta así:

- En `Nav.tsx`, el link **Precios** apunta a:
  - `${APP}/billing` con:
    - `target="_blank"`
    - `rel="noopener noreferrer"`
- Esto aplica tanto en desktop como en el menú móvil.

**Motivación:**

- Si alguien está en la landing (por ejemplo, en `/instituciones`) y hace clic en **Precios**, se abre **una nueva pestaña** con `app.aret3.cl/billing`.
- La pestaña original de la landing permanece abierta, evitando que el usuario “pierda” la página de información.
- En la app no se replica el nav de marketing (para no ofrecer botones como Inicio/Producto/Instituciones) y así no se saca al usuario de su contexto de trabajo dentro del wizard o tablero.

Este patrón se mantiene como estándar:

- **Landing / marketing:** Nav completo (Inicio, Producto, Instituciones, Precios, Noticias, Contacto).
- **App interna:** Nav propio, centrado en trabajo (logo → home interno, secciones internas; sin enlaces a aret3.cl salvo que se haga explícito en algún texto o footer).

## Módulo de Financiamiento (wizard post-informe)

El módulo de financiamiento permite que, después de generar el informe de aret3, la persona complete un mini-wizard adicional y obtenga borradores de formularios de postulación a fondos de financiamiento (Sercotec, Corfo, Start-Up Chile, fondos municipales, etc.).

### Flujo de usuario

1. El usuario completa el wizard normal y genera su informe.
2. En la pantalla del informe aparece un botón:
   - “Preparar solicitud de financiamiento (3 créditos)”.
3. Al hacer clic, se muestra una pantalla introductoria:
   - Explica qué fondos se cubren, qué entregables obtiene y el costo en créditos.
   - Solo si el usuario confirma se descuentan **3 créditos** (una sola vez por informe).
4. Se crea o reutiliza una `FundingSession` y se inicia un nuevo wizard de 5 pasos:
   - **F1 – Perfil del postulante:** datos personales o de la empresa.
   - **F2 – Estado del negocio y tracción:** etapa, ventas y clientes.
   - **F3 – Monto y uso de fondos:** cuánto pretende solicitar, aporte propio y en qué se usará.
   - **F4 – Fondos objetivo:** selección de instrumentos (Sercotec, Corfo, etc.).
   - **F5 – Links y confirmación:** video pitch, pitch deck, redes y revisión final.

Cada paso guarda los datos en servidor para no perder la información si el usuario sale o recarga.

### Persistencia y créditos

- Se introduce el modelo `FundingSession` asociado a:
  - `userId`, `clientId` y `reportId`.
- `FundingSession` guarda el estado del wizard y un flag `creditsCharged`.
- Los **3 créditos** se descuentan solo al iniciar la primera `FundingSession` para ese informe.
- Si el usuario vuelve más tarde, se reutiliza la misma sesión sin volver a cobrar.

### Outputs esperados (Fase 1)

A partir de la `FundingSession` + el `Report`:

- Se generan bloques de texto por fondo y por pregunta, listos para copiar/pegar.
- Se generan uno o más **PDF** de “Borrador de postulación”, reutilizando el motor de PDF actual (sin tocar la integración de `@sparticuz/chromium`).
- En fases posteriores se podrá añadir exportación a `.docx` u otros formatos editables.

Este módulo está pensado para escalar sin afectar el rendimiento de la app: solo añade formularios ligeros, llamadas simples a la API y una tabla nueva, sin nuevas dependencias pesadas.
Perfecto, con los archivos que subiste ya puedo escribir el README sin inventarme nada. Te dejo un texto listo para pegar, por ejemplo en `docs/funding-module.md` o al final de tu `README.md`.

---

## Módulo de financiamiento (flujo post-informe)

Este módulo permite que, una vez generado el **informe con IA**, el usuario pueda avanzar a un flujo de **financiamiento** donde aret3 pre-llena borradores de postulaciones a fondos (Sercotec, Corfo, fondos municipales, etc.).

La integración actual tiene dos partes:

1. **CTA en la pantalla de informe** (`/`, `app/page.tsx`).
2. **Pantalla de introducción al módulo de financiamiento** (`/funding/intro`, `app/funding/intro/page.tsx`) + endpoint `/api/funding-session/start`.

---

### 1. Archivos involucrados

* `app/page.tsx`
  Pantalla principal de **informe** (tabs Formulario / Tablero / Informe). Aquí se muestra el informe con IA y el nuevo bloque “¿Listo para buscar financiamiento?”.

* `app/funding/intro/page.tsx` 
  Pantalla de **intro** al módulo de financiamiento. Recibe parámetros por querystring y permite iniciar una `FundingSession` vía API.

* `app/api/funding-session/start/route.ts`
  Endpoint API (POST) que crea una sesión de financiamiento a partir de un `reportId` y devuelve un objeto `session`. Maneja errores de auth, créditos y reporte no encontrado.

* `prisma/schema.prisma`

  * Modelos existentes: `User`, `Client`, `Report`, `CreditWallet`, `UsageEvent`, etc. (ya usados por el resto de la app).
  * Nuevo modelo **`FundingSession`** y/o cambios relacionados (ver `add_funding_session` en `prisma/migrations/...`), que permiten asociar una sesión de financiamiento a un reporte y a un usuario/cliente.

---

### 2. Flujo desde la pantalla de informe (`app/page.tsx`)

En `app/page.tsx`:

* Se importa el router y los search params:

```ts
import { useRouter, useSearchParams } from "next/navigation";
```

* Al final del componente, dentro de la sección de **Informe**, después del bloque donde se muestra `aiReport`, se agregó un nuevo bloque:

````tsx
{aiReport && (
  <>
    {/* ... Evaluación (IA), ReportView, etc. ... */}

    {/* NUEVO bloque: paso siguiente → financiamiento */}
    <div className="mt-4 border-t pt-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        ¿Listo para buscar financiamiento? (Se activa tras generar informe con IA)
      </h3>

      <p className="mt-1 text-xs text-muted-foreground">
        Con el informe que generes aquí, aret3 puede pre-llenar por ti los
        formularios de fondos como Sercotec, Corfo y aceleradoras, para que
        solo tengas que revisar y enviar.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={handleStartFunding}
          disabled={!aiReport}
          className={`border border-black/70 text-black ${
            !aiReport ? "opacity-100 cursor-not-allowed" : ""
          }`}
        >
          <BotIcon className="mr-2 h-4 w-4" />
          Seguir a formulario de financiamiento
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Este paso usa <strong>3 créditos</strong> una sola vez para este
        proyecto, y podrás volver cuando quieras sin perder la información.
      </p>
    </div>
  </>
)}
``` :contentReference[oaicite:1]{index=1}  

- Este bloque:
  - **Siempre se renderiza bajo el informe con IA**, pero
  - El botón está **deshabilitado** mientras `aiReport` sea `null`.

- Lógica del botón `handleStartFunding`:

```ts
const router = useRouter();
const search = useSearchParams();

const handleStartFunding = () => {
  // Seguridad: solo si ya hay informe IA
  if (!aiReport) return;

  const params = new URLSearchParams();

  // Info que queremos llevar a la intro (opcional)
  if (idea) params.set("idea", String(idea));
  if (rubro) params.set("rubro", String(rubro));
  if (ubicacion) params.set("ubicacion", String(ubicacion));

  // TODO: conectar con el id real del Report (reportId) cuando esté disponible
  // params.set("reportId", String(report.id));

  router.push(`/funding/intro?${params.toString()}`);
};
``` :contentReference[oaicite:2]{index=2}  

> **Importante:** hoy el código envía solo `idea`, `rubro` y `ubicacion`. El `reportId` se conectará cuando el endpoint que genera el informe con IA devuelva y/o guarde el id del `Report` en base de datos.

---

### 3. Pantalla `/funding/intro` (`app/funding/intro/page.tsx`)

`FundingIntroPage` es un componente cliente que:

1. Lee los parámetros de la URL (`reportId`, `idea`, `rubro`, `ubicacion`). :contentReference[oaicite:3]{index=3}  
2. Muestra una tarjeta de introducción al módulo.
3. Permite iniciar una sesión de financiamiento llamando a `/api/funding-session/start`.

Fragmentos clave:

```ts
// app/funding/intro/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BotIcon, ArrowLeftIcon } from "lucide-react";

export default function FundingIntroPage() {
  const router = useRouter();
  const search = useSearchParams();
  const reportId = search?.get("reportId") ?? null;
  const idea = search?.get("idea") ?? null;
  const rubro = search?.get("rubro") ?? null;
  const ubicacion = search?.get("ubicacion") ?? null;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
````

#### 3.1. Caso sin `reportId`

Si la URL **no** trae `reportId`, se muestra un mensaje de error guiando al usuario de vuelta al informe:

````tsx
if (!reportId) {
  return (
    <main className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold">Módulo de financiamiento</h1>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            No encontramos el informe asociado a esta pantalla.
          </p>
          <p className="text-sm">
            Vuelve al panel principal, genera tu informe con IA y luego usa el botón
            <strong> "Seguir a formulario de financiamiento"</strong>.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
``` :contentReference[oaicite:4]{index=4}  

#### 3.2. Caso con `reportId`

Si el `reportId` está presente, se muestra:

- Título del módulo.
- Badges con tipos de fondos (Sercotec, Corfo, etc.).
- Explicación del flujo.
- Resumen rápido con `idea`, `rubro` y `ubicacion` (si vienen en la URL).
- Mensajes de error (créditos, auth, etc.).
- Botones: “Volver al informe” y “Comenzar (usar 3 créditos)”.

```tsx
<CardHeader className="space-y-2">
  <div className="flex items-center gap-2">
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
      <BotIcon className="h-4 w-4 text-primary" />
    </span>
    <div>
      <h1 className="text-xl font-semibold">
        Prepara tu postulación a fondos con aret3
      </h1>
      <p className="text-xs text-muted-foreground">
        Activar este módulo usa <strong>3 créditos</strong> una sola vez para este
        proyecto.
      </p>
    </div>
  </div>

  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
    <Badge variant="outline">Sercotec</Badge>
    <Badge variant="outline">Corfo</Badge>
    <Badge variant="outline">Fondos municipales</Badge>
    <Badge variant="outline">Start-Up Chile</Badge>
  </div>
</CardHeader>
``` :contentReference[oaicite:5]{index=5}  

El botón de confirmación llama a `handleConfirm`:

```ts
const handleConfirm = async () => {
  if (!reportId) return;
  setLoading(true);
  setErrorMsg(null);

  try {
    const res = await fetch("/api/funding-session/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const code = data?.error || "unknown";

      if (res.status === 401) {
        setErrorMsg("Necesitas iniciar sesión para usar esta función.");
      } else if (res.status === 402 || code === "no_credits") {
        setErrorMsg("No tienes créditos suficientes para activar el módulo de financiamiento.");
      } else if (code === "report_not_found") {
        setErrorMsg("No encontramos el informe asociado. Vuelve atrás e inténtalo de nuevo.");
      } else {
        setErrorMsg("Ocurrió un problema al iniciar el módulo de financiamiento.");
      }

      setLoading(false);
      return;
    }

    const json = await res.json();
    const session = json?.session;

    if (!session?.id) {
      setErrorMsg("No se pudo crear la sesión de financiamiento.");
      setLoading(false);
      return;
    }

    // Ir al wizard de financiamiento con el id de la FundingSession
    router.push(`/funding/${session.id}`);
  } catch (err) {
    console.error("Error starting funding session:", err);
    setErrorMsg("Error de conexión al iniciar el módulo de financiamiento.");
    setLoading(false);
  }
};
``` :contentReference[oaicite:6]{index=6}  

---

### 4. Endpoint `/api/funding-session/start`

Aunque el detalle está en `app/api/funding-session/start/route.ts`, desde el lado del cliente la **contrato** actual es:

- **Endpoint:** `POST /api/funding-session/start`
- **Body JSON:**

```json
{ "reportId": "<id del Report>" }
````

* **Respuestas esperadas:**

  * `200 OK` con:

    ```json
    { "session": { "id": "<id FundingSession>", ... } }
    ```

    → El cliente redirige a `/funding/<session.id>`.

  * Errores:

    * `401` → usuario no autenticado.
    * `402` o `error = "no_credits"` → sin créditos suficientes.
    * `error = "report_not_found"` → el `reportId` no existe o no pertenece al usuario/cliente.
    * Otros → mensaje genérico “Ocurrió un problema al iniciar el módulo de financiamiento”.

---

### 5. Limitaciones actuales / TODO

1. **Persistencia del informe con IA**

   * Hoy, si el usuario genera el informe con IA, navega a `/funding/intro` y luego vuelve al informe, puede perder el `aiReport` en memoria.
   * Para que esto no ocurra, el flujo debería:

     * Guardar el informe en la tabla `Report` cuando se llama al endpoint que genera el informe con IA.
     * Devolver el `reportId` desde la API y guardarlo en el estado de la página.
     * Rehidratar `aiReport` desde back-end al entrar de nuevo a la pestaña **Informe** (por ejemplo, vía `GET /api/report?id=...`).

2. **Conectar `reportId` en `handleStartFunding`**

   * El botón actualmente no envía `reportId` en la URL; solo `idea`, `rubro` y `ubicacion`.
   * Una vez que el endpoint de generación de informe guarde y devuelva el `id` del `Report`, se debe:

     * Guardar ese `id` junto con `aiReport`.
     * Actualizar `handleStartFunding` para hacer:

       ```ts
       const report = aiReport as any;
       if (!report?.id) return;
       params.set("reportId", String(report.id));
       ```

3. **Wizard de financiamiento**

   * La redirección actual es a `/funding/{session.id}`.
   * Falta implementar las pantallas de esa ruta (pasos del wizard de financiamiento) y el consumo de la `FundingSession` para generar los textos pre-llenados.

---
Perfecto, dejamos el bug del “plan / mapa / checklist que se pierden al volver” resuelto ✅

Ahora viene lo que habíamos dejado en pausa: **documentar esto y pensar el siguiente mini-paso del módulo de financiamiento**.

Te dejo el README de esta parte ya escrito, para que lo pegues en `docs/financing-module.md` o en la sección que uses:

---

````md
# Módulo de financiamiento – v1

## 1. Contexto general

Desde la pantalla principal de evaluación (`app/page.tsx`, tab **Informe** / `?tab=explain`):

1. El usuario completa el wizard.
2. Hace clic en **“Solicita Informe con IA”**.
3. El backend (`/api/evaluate` + `/api/plan` + `/api/competitive-intel`) devuelve:
   - Informe IA (scores + texto).
   - Plan de acción (plan100 + bullets).
   - Mapa competitivo.
   - Checklist regulatorio.
4. En esa misma pantalla aparece el bloque:

   - **“Evaluación (IA)”**
   - **Plan de Acción — ¡No te detengas!**
   - **Mapa competitivo**
   - **Checklist regulatorio**
   - Nuevo bloque **“¿Listo para buscar financiamiento?”** con el botón  
     **“Seguir a formulario de financiamiento”**.

Adicionalmente, el informe IA + plan se **persisten en el navegador** para que no se pierdan si el usuario navega a `/funding/intro` y luego vuelve a la pantalla de informe.

---

## 2. Modelo de base de datos

Archivo: `prisma/schema.prisma`

```prisma
model FundingSession {
  id        String   @id @default(cuid())
  userId    String?        // Usuario autenticado (si existe)
  clientId  String?        // Organización / cliente institucional (opcional)
  reportId  String         // Reporte base sobre el que se hace la postulación

  status    String   @default("draft") // "draft" | "completed" (y futuros estados)
  payload   Json     @default("{}")    // Respuestas del módulo de financiamiento (F1–F5)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user   User?   @relation(fields: [userId], references: [id])
  client Client? @relation(fields: [clientId], references: [id])
  report Report  @relation(fields: [reportId], references: [id])

  @@index([userId])
  @@index([clientId])
  @@index([reportId])
}
````

> **Nota**: por ahora solo se usa a nivel de modelo. La creación/actualización de `FundingSession` se conectará en una siguiente etapa cuando exista el formulario completo de financiamiento.

---

## 3. Persistencia en el navegador

### 3.1. Clave de `sessionStorage`: `aret3:lastEvaluate`

* Se escribe al terminar `handleEvaluateAI()` en `app/page.tsx`.

* Guarda al menos:

  ```ts
  {
    iaRaw: <respuesta completa de /api/evaluate>,
    idea,
    rubro,
    ubicacion,
    // opcionalmente: aiPlan (cuando se añada el guardado)
  }
  ```

* **Uso principal**: rehidratar el informe IA y el plan al volver desde `/funding/intro`.

### 3.2. Hidratación del informe IA + plan

En `app/page.tsx`:

```ts
const [aiReport, setAiReport] = useState<StandardReport | null>(null);
const [iaData, setIaData] = useState<any>(null);
const [aiPlan, setAiPlan] = useState<any>(null);

useEffect(() => {
  if (typeof window === "undefined") return;

  try {
    const raw = window.sessionStorage.getItem("aret3:lastEvaluate");
    if (!raw) return;

    const saved = JSON.parse(raw);

    // 1) Informe IA (para el bloque “Evaluación (IA)”)
    const d = saved?.iaRaw;
    if (d) {
      const reportFromAPI = (d as any).data || (d as any).standardReport || null;
      if (reportFromAPI) setAiReport(reportFromAPI);

      setIaData(
        (d as any).ia ??
        ((d as any).scores ? d : ((d as any).data ?? d))
      );
    }

    // 2) Plan IA completo (si está guardado)
    if (saved.aiPlan) {
      setAiPlan(saved.aiPlan);
    }
  } catch (e) {
    console.error("No se pudo rehidratar informe IA desde sessionStorage:", e);
  }
}, []);
```

Con esto, cuando el usuario:

1. Genera el informe con IA.
2. Hace clic en **Seguir a formulario de financiamiento** → `/funding/intro?...`
3. Luego vuelve hacia atrás al informe,

se reconstruyen:

* Bloque de **Evaluación (IA)**.
* **Plan de Acción** (plan100 + bullets).
* **Mapa competitivo**.
* **Checklist regulatorio**.

---

## 4. Botón “Seguir a formulario de financiamiento”

Ubicación: `app/page.tsx`, tab de **Informe**.

```tsx
<Button
  size="sm"
  variant="outline"
  onClick={handleStartFunding}
  disabled={!aiReport}
  className={`border border-black/70 text-black ${
    !aiReport ? "opacity-100 cursor-not-allowed" : ""
  }`}
>
  <BotIcon className="mr-2 h-4 w-4" />
  Seguir a formulario de financiamiento
</Button>
```

Lógica actual:

```ts
const router = useRouter();

const handleStartFunding = () => {
  if (!aiReport) return; // seguridad: solo si ya hay informe IA

  const params = new URLSearchParams();
  if (idea) params.set("idea", String(idea));
  if (rubro) params.set("rubro", String(rubro));
  if (ubicacion) params.set("ubicacion", String(ubicacion));

  router.push(`/funding/intro?${params.toString()}`);
};
```

* El botón **siempre se muestra**, pero está deshabilitado mientras no exista `aiReport`.
* Una vez generado el informe con IA, se habilita y redirige a
  `/funding/intro?idea=...&rubro=...&ubicacion=...`.

---

## 5. Pantalla `/funding/intro`

Archivo: `app/funding/intro/page.tsx` (no se detalla todo el código aquí).

Responsabilidades:

1. Leer `idea`, `rubro`, `ubicacion` desde `useSearchParams()`.
2. Mostrar el módulo **“Paso 1 – Módulo de financiamiento”**.
3. Permitir que el usuario vuelva al informe principal.

> **Importante**: hoy esta pantalla todavía **no crea** un `FundingSession` en la base de datos. Solo funciona como “Intro / Paso 1” en frontend. La vinculación con `FundingSession` se hará cuando se implemente el formulario completo (F1–F5).

---

## 6. Próximos pasos sugeridos

1. **Guardar también `aiPlan` en `sessionStorage`** dentro de `handleEvaluateAI`
   (cuando ya está disponible el plan), para que el snapshot quede 100% completo:

   ```ts
   window.sessionStorage.setItem(
     "aret3:lastEvaluate",
     JSON.stringify({
       iaRaw: data,
       idea,
       rubro,
       ubicacion,
       aiPlan, // 👈 añadir cuando ya esté armado
     })
   );
   ```

2. **Conectar `FundingSession`**:

   * Crear endpoint tipo `POST /api/funding/session` que:

     * Reciba `reportId` (y opcionalmente `clientId`, `userId` vía sesión).
     * Cree / reutilice una sesión en estado `"draft"`.
     * Devuelva `sessionId`.
   * Actualizar `handleStartFunding` para redirigir a
     `/funding/intro?sessionId=...&idea=...&rubro=...`.

3. **Diseñar el formulario de financiamiento (F1–F5)** sobre `FundingSession.payload`.

4. (Opcional) **Cobro de créditos**:

   * Amarrar el gasto de `3 créditos` a la creación real de `FundingSession` en el backend, no solo a la navegación.

---

Con esto dejamos documentado lo que ya existe y claro qué sería lo lógico “que sigue”.
Si quieres, en el próximo paso te puedo:

* Escribir el endpoint `POST /api/funding/session` + el `router.push` con `sessionId`, **o**
* Bajar más a detalle el diseño del formulario F1–F5 y el shape del `payload`.
Va, cerramos esta y dejamos todo listo para la nueva 🔥

Te dejo dos cosas separadas:

1. **Prompt Maestro – Formulario 2.0 (F1–F5)** para pegar en el nuevo chat.
2. **README corto de la rama `feat/funding-forms-v2`** para el repo.

---

## 1️⃣ Prompt Maestro – Módulo Funding Formulario 2.0 (F1–F5)

> **Rol**
> Compórtate como mi pair-programmer senior para mi SaaS **aret3** (Next.js 15.5.7 + TypeScript + Prisma + NextAuth, deploy en Vercel). Tu prioridad es mantener **estabilidad**: no romper nada del flujo de informe actual, escribir código limpio, y pensar en arquitectura antes de tocar archivos.

---

### 1. Contexto técnico actual (ya funcionando, NO tocar salvo que lo pida)

1. **Wizard 1–11**

   * El usuario recorre un wizard de 11 pasos.
   * Estado en el frontend: `useWizardStore`.
   * Al finalizar se construye un `legacyForm` con:

     * `lib/bridge/wizard-to-legacy.ts`
     * Se guarda en `localStorage.setItem("arete:legacyForm", JSON.stringify(legacyWithMeta))`.
   * Ese `legacyForm` incluye la info de ventas IA de Step-6:

     * `ventasIAExplicacion`
     * `ventasIAFuentes`.

2. **Informe en pantalla (tablero)**

   * Ruta principal: `app/page.tsx` (tab `?tab=explain`).
   * Se genera un **resumen ejecutivo** con:

     ```ts
     const summary = buildInvestorNarrative(baseOut.report.input, metaForNarrative);
     ```
   * En el resumen se muestra:

     * El `summary`.
     * Debajo, bloque con:

       * Nota sobre ventas IA.
       * `ventasIAExplicacion` (texto largo).
       * `ventasIAFuentes` (links).

3. **Informe por email + PDF**

   * Renderer central: `lib/renderReportHtml.ts` → `renderReportEmailHtml(...)`.
   * Se usa desde:

     * `/api/email-report`
     * `/api/report/pdf`
   * Parámetros clave:

     * `user` (nombre, email, etc.)
     * `report` (AI / non-AI)
     * `aiPlan`
     * `summary`
     * `preAI` (HTML del tablero)
   * El PDF está implementado en `app/api/report/pdf/route.ts` con:

     * En **Vercel**: `@sparticuz/chromium` + `puppeteer-core` vía `serverExternalPackages`.
     * En **local**: `puppeteer` normal.
   * Esto ya está funcionando en `main` y en producción.

   > ❗ **No quiero que modifiques Step-6, `renderReportEmailHtml`, ni el `route.ts` del PDF**, a menos que lo pida explícitamente.

4. **Stack y versiones**

   * `next`: **15.5.7**
   * `next-auth`: 4.24.x con Prisma Adapter.
   * `nodemailer`: 7.x
   * Deploy en Vercel ya compilando sin errores.

---

### 2. Contexto de Funding (F1–F5) y problemas actuales

Hay un módulo de **Funding Session** (F1–F5) que se abre desde el informe:

* F1–F4 son formularios tipo:

  * F1: datos del postulante.
  * F2: estado y avance del negocio.
  * F3: monto y uso de fondos.
  * F4: tipo de instrumento / institución (Sercotec, Corfo, municipio, etc.).
* F5 genera un **borrador de postulación** con IA.

Problemas detectados:

1. **No se prellenan F1–F4**:
   Preguntan cosas que ya están en el wizard/informe (nombre, ciudad, rubro, ventas, etc.).

2. **F5 “pegado” a proyectos antiguos**:

   * El borrador de F5 a veces describe una **cafetería** cuando el proyecto actual es una **joyería**, lo que indica que está usando datos viejos o mapeo incorrecto.

3. **Lenguaje “idea” vs. “problema que resuelve”**:

   * El wizard habla de *idea de negocio*.
   * Los formularios de Corfo/Sercotec hablan de *“qué problema resuelves”*.
   * Falta una pieza clara tipo “Este proyecto resuelve el problema de…”.

4. **Costo en créditos**:

   * El módulo de formularios debe costar **3 créditos por proyecto**.
   * Idea general:

     * Cobrar 3 créditos al iniciar la Funding Session (primer uso).
     * El **borrador base** NO debería gastar IA extra (solo datos ya generados).
     * Si el usuario quiere “Mejorar redacción con IA para Corfo/Sercotec”, ahí sí se gasta crédito adicional.

5. **Dolor principal del usuario**:

   * Lo que más cuesta a los emprendedores es **llenar formularios largos y confusos**.
   * aret3 debe minimizar el re-typing: máximo auto-relleno, mínimo campos manuales.

---

### 3. Objetivo de esta nueva rama: “Formulario 2.0”

En la nueva rama (`feat/funding-forms-v2`) quiero:

1. **Auto-relleno F1–F4** usando SOLO datos ya recolectados:

   * `legacyForm`
   * `aiReport` / `nonAIReport`
   * `aiPlan`
   * Datos de usuario / client / report

2. **Nuevo “Informe de postulación” (F6 o vista final)**:

   * Un resumen ordenado, estilo borrador de Corfo/Sercotec, con secciones:

     1. Datos del postulante (nombre, RUT, ciudad, email, teléfono).
     2. Problema que resuelve.
     3. Solución / propuesta de valor.
     4. Mercado y clientes.
     5. Tracción / proyecciones (ventas, clientes, PE).
     6. Monto y uso del financiamiento.
     7. Instrumento / fondo sugerido (Sercotec, Corfo, municipio…).
   * Armado **sin nuevas llamadas a IA** (solo con info existente + F1–F4).
   * Que se pueda copiar/pegar a un formulario real o más adelante mandar a PDF.

3. **Integrar el concepto “problema que resuelve”**:

   * Reusar texto que ya exista en `aiReport` / `summary`.
   * O, si hace falta, ajustar prompts existentes para que siempre generen un bloque:

     * `problemaQueResuelve: string` dentro del informe.

4. **Definir y aplicar la lógica de créditos**:

   * Cobrar **3 créditos** cuando se inicia una `FundingSession` para un `reportId`.
   * No volver a cobrar si el usuario entra de nuevo a la misma sesión.
   * Reservar créditos extra solo para botones explícitos de IA (“mejorar redacción”, etc.).

5. **Mantener UI simple**:

   * Pocas preguntas nuevas.
   * Todo lo que se pueda, viene prellenado del informe.
   * Textos y labels alineados con formularios reales (Corfo/Sercotec/Semilla Expande).

---

### 4. Forma de trabajo que quiero

1. Primero, **análisis y arquitectura**:

   * Revisar el modelo `FundingSession` en Prisma.
   * Ver cómo se relaciona con `Report`, `Client`, `User`.
   * Diseñar el mapeo “campo del formulario ↔ campo de aret3”.

2. Luego, ir **archivo por archivo**:

   * Empezar por F1 (auto-relleno).
   * Luego F2, F3, F4.
   * Después la vista de “Informe de postulación”.
   * Finalmente, la lógica de créditos en `/api/funding-session/start` y cualquier otro endpoint necesario.

3. Estilo de respuesta:

   * Explicar brevemente la arquitectura.
   * Proponer cambios con **archivos completos listos para pegar** (no diffs), indicando ruta del archivo.
   * No tocar Step-6, informe, email ni PDF, a menos que yo lo pida muy explícitamente.

---

### 5. Instrucción final

1. Resume con tus palabras:

   * Qué está funcionando ahora (wizard → informe → email/PDF).
   * Qué hace mal hoy el módulo de Funding (F1–F5).
   * Qué queremos lograr con el Formulario 2.0.
2. Después, pídele al usuario los archivos mínimos para empezar:

   * Fragmento relevante de `schema.prisma` (`FundingSession`, `Report`, `Client` si aplica).
   * Componentes de F1–F5 (`app/funding/[id]/f1/page.tsx`, etc.).
   * El helper que carga la funding session (si existe).
   * Un ejemplo de `legacyForm` o el tipo/interface que lo describe.

Con eso, empezamos mejorando primero el **auto-relleno de F1** y vamos avanzando paso a paso.

---

## 2️⃣ README – Rama `feat/funding-forms-v2`

Este README es para el repo, en `docs/funding-forms-v2.md` o similar, o al inicio de la rama.

---

### Título

**Módulo Funding – Formulario 2.0 (F1–F5) – Rama `feat/funding-forms-v2`**

---

### 1. Contexto

aret3 es una app SaaS que:

* Lleva al usuario por un **wizard de 11 pasos** para evaluar su idea de negocio.
* Genera un **informe de negocio** (resumen ejecutivo, proyecciones, plan de acción).
* Permite **enviar el informe por email** y **descargar un PDF**.

Estado actual en `main`:

* Wizard 1–11 funcionando.
* Conversión a `legacyForm` en `lib/bridge/wizard-to-legacy.ts`.
* Informe en pantalla (`app/page.tsx`) usando:

  * `buildInvestorNarrative` para el resumen ejecutivo.
  * Bloque de ventas IA (explicación + fuentes).
* Email de informe y PDF:

  * `lib/renderReportHtml.ts` → `renderReportEmailHtml`.
  * `/api/email-report` y `/api/report/pdf`.
  * PDF estable en:

    * **Vercel**: `@sparticuz/chromium` + `puppeteer-core`.
    * **Local**: `puppeteer` normal.
* Stack:

  * Next.js **15.5.7**
  * TypeScript, App Router.
  * Prisma + NextAuth 4 + Prisma Adapter.
  * Nodemailer 7.

El módulo actual de **Funding** (F1–F5) existe, pero es V1 y tiene problemas de UX y mapeo de datos.

---

### 2. Problema

1. **Duplicación de datos**

   * F1–F4 piden campos que ya se ingresaron en el wizard/informe (nombre, ciudad, rubro, ventas, etc.).
   * No usan `legacyForm`, `aiReport` ni `aiPlan` para auto-rellenar.

2. **Inconsistencia de contenido en F5**

   * El borrador de postulación (F5) puede seguir hablando de una cafetería aunque el proyecto actual sea una joyería → mezcla de sesiones / mapeo incorrecto.

3. **Desalineación con formularios reales**

   * El lenguaje del wizard es de “idea de negocio”.
   * Los instrumentos reales (Corfo, Sercotec, etc.) preguntan por:

     * Problema que resuelve.
     * Solución.
     * Mercado y tracción.
     * Monto y uso de fondos.
   * F5 no se parece a un “formulario Corfo/Sercotec” real.

4. **Créditos**

   * El uso del módulo de formularios debe costar **3 créditos** por proyecto, pero la lógica no está implementada o está incompleta.
   * Queremos que el borrador base sea gratis (dentro de esos 3 créditos) y solo cobrar extra si se usa IA para mejorar el texto.

---

### 3. Objetivos de la rama

1. **Auto-relleno inteligente de F1–F4**

   * Aprovechar `legacyForm`, `aiReport`, `aiPlan` y datos de usuario para:

     * Prellenar todos los campos posibles.
     * Reducir al mínimo lo que el usuario tiene que escribir a mano.

2. **Nuevo “Informe de postulación”**

   * Crear una vista final (F6 o similar) que combine:

     * Datos del postulante.
     * Problema que resuelve el proyecto.
     * Descripción de la solución y propuesta de valor.
     * Mercado, clientes y tracción.
     * Monto solicitado y uso de fondos.
     * Instrumentos / fondos sugeridos.
   * Este informe debe poder:

     * Copiarse fácilmente a un formulario real.
     * Utilizarse luego como base para un PDF específico de postulación (futuro).

3. **Integrar el concepto “problema que resuelve”**

   * Asegurarnos de que el informe siempre exponga un bloque explícito de problema/dolor.
   * Guardarlo en el modelo para uso en F1–F6.

4. **Lógica de créditos para Funding**

   * Cobrar 3 créditos cuando se inicia una `FundingSession`:

     * Endpoint: `/api/funding-session/start`.
     * Usar `tryDebitCredit` con razon `"funding-session"`.
   * No volver a cobrar si la misma sesión se abre de nuevo.
   * Definir endpoints opcionales para:

     * “Mejorar redacción con IA” → crédito extra por llamada.

5. **No romper el flujo actual de informe**

   * Mantener intactos:

     * Step-6.
     * `renderReportEmailHtml`.
     * `/api/report/pdf`.
   * Todos los cambios de esta rama se acotan al módulo Funding y helpers relacionados.

---

### 4. Plan de implementación (alto nivel)

1. **Revisar modelos de datos**

   * Revisar `schema.prisma`:

     * `FundingSession`
     * `Report`
     * `Client` (si aplica)
   * Confirmar qué se serializa en `FundingSession.meta`.

2. **Diseñar el mapeo de campos**

   * Crear una tabla (en código o docs) que asocie:

     * Campo del formulario (F1–F4) ↔ Campo en `legacyForm` / `report` / `aiPlan`.
   * Decidir qué se prellena y qué se sigue preguntando.

3. **Implementar auto-relleno F1 → F4**

   * Cargar `FundingSession` + `Report` + `legacyForm` en el server component.
   * Armar `initialValues` por formulario.
   * Permitir edición y posterior update vía API.

4. **Implementar “Informe de postulación”**

   * Nuevo componente/página para el resumen final.
   * Armar secciones solo con datos existentes.
   * Diseñar layout claro, listo para copy-paste.

5. **Implementar lógica de créditos**

   * Añadir lógica en `/api/funding-session/start`:

     * Cobro de 3 créditos.
     * Idempotencia por `reportId`.
   * Preparar la base para futuras llamadas IA opcionales.

---

### 5. Cómo correr esta rama localmente

```bash
git checkout main
git pull origin main

git checkout -b feat/funding-forms-v2

npm install
npm run dev
# abrir http://localhost:3000
```

---

Aquí tienes **(1) un README** para pegar en tu repo y **(2) un prompt maestro** para abrir una nueva conversación sin perder el foco.

---

# README — Módulo Funding (F1–F5): Capital de trabajo + persistencia F3

## Contexto

En **aret3** (Next.js + TypeScript + Prisma, deploy en Vercel) estamos construyendo el **módulo Funding** con pasos **F1–F5** para que el usuario complete un formulario de postulación (Corfo/Sercotec/municipal, etc.) usando la info ya levantada en el wizard.

El cuello de botella de este chat fue:

1. **Capital de trabajo** dependía del número de meses (3/6/9/12), por lo que **no podía venir “cerrado” desde Step-6**.
2. En **F3** se perdía lo escrito (incluida la respuesta de IA) al navegar/recargar.
3. “Monto aproximado que te gustaría pedir” quedaba con un valor viejo en algunos casos.

---

## Objetivo logrado en este chat

1. **Capital de trabajo** se calcula/traspasa bien para Funding (y se puede derivar aunque el usuario no haya hecho Step-9).
2. En **F3** se implementó **persistencia fuerte**: lo que escribe el usuario (y lo que devuelve IA) **queda guardado** y no se pierde.
3. Se dejó el backend de guardado (`save-step`) listo para que el front pueda rehidratar desde base de datos (DB) sin depender solo de localStorage.

---

## Cambios principales

### A) Wizard: Step-7 como fuente correcta del capital de trabajo

* El capital de trabajo depende de `mesesPE` (3/6/9/12) y se calcula con una rampa tipo Step-9.
* Step-7 guarda en el store (y luego en el legacy) un campo:

  * `capitalTrabajo`
  * más `mesesPE`, `conversionPct`, `traficoMensual`, y marketing.

**Decisión funcional clave:** el cálculo usa tu definición actual:

* **gastos del mes = gastos fijos + marketing**
  → por lo tanto el capital de trabajo **incluye marketing** dentro del “colchón”.

---

### B) Helper: resolver capital de trabajo desde varias fuentes

Archivo: `lib/funding/resolveCapitalTrabajo.ts`

* Función `resolveCapitalTrabajo({ legacy, plan })` intenta rescatar:

  * `plan.capitalTrabajo`
  * `legacy.plan.capitalTrabajo`
  * `legacy.step9.capitalTrabajo`
  * `legacy.step6.capitalTrabajo`
  * y fallback sumando déficits si existe una tabla mensual (best effort).
* Devuelve `{ value, source }` para debug (“de dónde lo saqué”).

---

### C) Funding F3: monto + usos con IA + NO perder texto

Archivo: `app/funding/[sessionId]/f3/page.tsx`

Se dejó funcionando:

* **Auto-relleno** de:

  * capital de trabajo (desde resolver/fallback)
  * dinero propio disponible (desde inversión inicial)
  * inversión total (regla payback 3 años)
  * sugerencia de monto a pedir (cuando corresponde)
* **Persistencia real** de lo escrito en “¿En qué usarías principalmente estos fondos?”:

  * Guardado local por sesión: `aret3:funding:f3:${sessionId}`
  * Autosave con debounce a endpoint `/api/funding-session/save-step`
  * Cuando IA responde, se guarda **al tiro** (local + DB), para que no se pierda aunque el usuario se vaya.

---

### D) Endpoint IA: mejorar usos de fondos

Archivo: `app/api/ai/funding-uses-improve/route.ts`

* Usa OpenAI (modelo configurable por `OPENAI_MODEL`)
* Respeta créditos (tryDebitCredit / refundCredit)
* Instrucciones para que:

  * primera viñeta sea capital de trabajo si existe
  * el resto reparta el monto restante de forma razonable
  * no invente montos absurdos

---

### E) Guardado DB: save-step devuelve lo guardado

Archivo: `app/api/funding-session/save-step/route.ts`

Se ajustó para:

* Forzar consistencia: `data.step = stepKey`
* Mergear `payload.steps[stepKey] = data`
* Mantener bloque normalizado `postulante` cuando `stepKey === "F1"`
* **Devolver** en la respuesta:

  * `step`, `savedAt`
  * `data` guardada para ese step
  * `postulante` normalizado

Esto permite que el front (si queremos) rehidrate desde DB sin depender de localStorage.

---

## Cómo probar (checklist corto)

1. Completar Wizard hasta Step-7, cambiar `mesesPE` (3/6/9/12) y avanzar.
2. Ir a Funding F3:

   * Debe aparecer capital de trabajo correcto (según Step-7 / fallback).
   * Debe aparecer dinero propio correcto.
   * “Monto aproximado que te gustaría pedir” debe sugerirse cuando corresponde.
3. Escribir texto en “¿En qué usarías principalmente estos fondos?”:

   * Cambiar de página (F2 → F3 → F4), volver: **no se pierde**.
   * Recargar (refresh): **no se pierde**.
4. Usar botón IA:

   * Debe reemplazar el texto.
   * Irse y volver: **debe mantenerse**.

---

## Próximos pasos sugeridos

* Replicar el patrón de persistencia (local + DB) en **F1 y F2** (para no perder nada).
* Opcional: en F3, rehidratar desde DB al cargar (si el payload ya existe).
* Mantener el foco: **F1–F5 deben nutrirse con info ya recolectada**, y el formulario final debe parecerse al que definimos.

---

---

# Prompt maestro — Continuar Funding F1–F5 (sin perder el foco)

**Rol**
Actúa como mi pair-programmer senior para **aret3** (Next.js + TypeScript + Prisma, deploy en Vercel). Quiero avanzar ordenado, sin inventar rutas/archivos, y con cambios mínimos que no rompan lo que ya funciona.

**Contexto (lo que ya está hecho y funcionando)**

* Wizard Step-7 calcula capital de trabajo según meses (3/6/9/12) y lo guarda para que Funding lo use.
* En Funding:

  * F3 ya auto-rellena capital de trabajo / dinero propio / regla payback 3 años.
  * F3 ahora guarda texto del usuario + respuesta IA y no se pierde (localStorage + DB).
* Endpoint `/api/funding-session/save-step` mergea payload por step, normaliza `postulante` en F1 y devuelve lo guardado.

**Objetivo de la nueva conversación**
Seguir con **F1–F5** para llegar a un **formulario de postulación real** (el que definimos), usando la información ya levantada, y con persistencia robusta como en F3.

**Reglas de trabajo**

1. Antes de proponer cambios, confirmar nombres/rutas exactas de archivos (sin inventar).
2. Cuando haya cambios, entrégame archivo completo “donde dice / se cambia por”.
3. Prioridad: persistencia (no perder datos), consistencia de cálculos, y que el formulario quede coherente.

**Qué necesito que hagamos ahora**

1. Revisar F1 y F2 para que:

   * Se rehidraten desde DB (payload.steps.F1/F2) y/o localStorage por sesión
   * Autosave con debounce igual que F3
2. Confirmar que el flujo completo F1→F5 no pierde nada aunque el usuario recargue o salga.
3. Dejar lista una tabla/estructura de “mapping” entre:

   * campos del wizard/legacy/plan
   * campos del formulario Funding (F1–F5)
4. Si aparece un descalce (ej: capital de trabajo, monto a pedir, aportes), corregir sin romper lo demás.


