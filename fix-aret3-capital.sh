#!/usr/bin/env bash
set -euo pipefail

FILE="${1:-app/page.tsx}"

if [[ ! -f "$FILE" ]]; then
  echo "ERROR: No existe $FILE. Pásame la ruta correcta:  ./fix-aret3-capital.sh app/page.tsx"
  exit 1
fi

cp "$FILE" "$FILE.bak.$(date +%Y%m%d-%H%M%S)"

node - "$FILE" <<'NODE'
const fs = require('fs');

const file = process.argv[1];
let s = fs.readFileSync(file, 'utf8');

/**
 * 1) Resumen ejecutivo:
 *    Reemplaza:
 *       capitalTrabajo: (outputs?.peCurve?.acumDeficitUsuario ?? 0),
 *    por:
 *       capitalDisponible: parseNumberCL(capitalTrabajo),
 *       capitalRequeridoPE: (outputs?.peCurve?.acumDeficitUsuario ?? 0),
 */
{
  const re = /capitalTrabajo:\s*\(outputs\?\.\s*peCurve\?\.\s*acumDeficitUsuario\s*\?\?\s*0\)\s*,/m;
  if (re.test(s)) {
    s = s.replace(
      re,
      'capitalDisponible: parseNumberCL(capitalTrabajo), capitalRequeridoPE: (outputs?.peCurve?.acumDeficitUsuario ?? 0),'
    );
  } else {
    console.warn('[WARN] No encontré el fragmento de capitalTrabajo en Resumen ejecutivo. Revisa el archivo si no ves el cambio.');
  }
}

/**
 * 2) Brújula menor (arriba del bloque de métricas operativas):
 *    El bloque actual muestra "Capital de trabajo necesario en meses" pero imprime $.
 *    Lo reemplazo por 3 tarjetas: Requerido, Disponible y ¿Te alcanza? (con gap).
 */
{
  // Capturo el bloque de KPIs superiores dentro de BRÚJULA MENOR
  const reBlock =
/<div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">\\s*?<div>\\s*?<div className="text-muted-foreground">Capital de trabajo necesario en meses \\(plan \\{mesesPE\\}m\\)<\\/div>\\s*?<div className="font-semibold">\\s*?\\$\\{fmtCL\\(\\(outputs\\?\\.peCurve\\?\\.acumDeficitUsuario \\?\\? 0\\)\\)\\}\\s*?<\\/div>\\s*?<\\/div>\\s*?<\\/div>/m;

  if (reBlock.test(s)) {
    s = s.replace(
      reBlock,
`<div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
  <div className="rounded-md border bg-white p-2">
    <div className="text-muted-foreground">Capital requerido hasta P.E. (plan {mesesPE}m)</div>
    <div className="font-semibold">
      $\{fmtCL((outputs?.peCurve?.acumDeficitUsuario ?? 0))\}
    </div>
  </div>
  <div className="rounded-md border bg-white p-2">
    <div className="text-muted-foreground">Capital disponible (ingresado)</div>
    <div className="font-semibold">
      $\{fmtCL(parseNumberCL(capitalTrabajo))\}
    </div>
  </div>
  <div className="rounded-md border bg-white p-2 sm:col-span-2">
    {(() => {
      const capDisp = parseNumberCL(capitalTrabajo);
      const capReq  = (outputs?.peCurve?.acumDeficitUsuario ?? 0);
      const ok = capDisp >= capReq;
      const gap = Math.abs(capReq - capDisp);
      return (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">¿Te alcanza?</span>
          <span className={"font-semibold " + (ok ? "text-green-700" : "text-amber-700")}>
            {ok ? "Sí, sobra $" + fmtCL(gap) : "No, faltan $" + fmtCL(gap)}
          </span>
        </div>
      );
    })()}
  </div>
</div>`
    );
  } else {
    console.warn('[WARN] No encontré el bloque de "Capital de trabajo necesario en meses". Si cambiaste el texto, ajusta el script.');
  }
}

fs.writeFileSync(file, s, 'utf8');
console.log('OK: cambios aplicados en', file);
NODE

echo "Backup creado y cambios aplicados sobre: $FILE"
