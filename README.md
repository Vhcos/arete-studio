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
