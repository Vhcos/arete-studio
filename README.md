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
