import fs from "node:fs";

function patch(path) {
  const src = fs.readFileSync(path, "utf8");
  let out = src;
  let touched = false;

  // (A) buildInvestorNarrative:
  // REEMPLAZA: estamos enviando "capitalTrabajo" como déficits (mal)
  // POR: enviamos "capitalTrabajo" = input usuario (parseNumberCL(capitalTrabajo))
  //      y además pasamos "acumDeficitUsuario" por separado.
  const pattA =
    '{buildInvestorNarrative(baseOut.report.input, { ...(outputs?.report?.meta || {}), peCurve: outputs?.peCurve, pe: outputs?.pe, capitalTrabajo: (outputs?.peCurve?.acumDeficitUsuario ?? 0), ventasPE: (outputs?.pe?.ventasPE ?? 0), clientsPE: (outputs?.pe?.clientsPE ?? 0) })}';
  const replA =
    '{buildInvestorNarrative(baseOut.report.input, { ...(outputs?.report?.meta || {}), peCurve: outputs?.peCurve, pe: outputs?.pe, capitalTrabajo: parseNumberCL(capitalTrabajo), acumDeficitUsuario: (outputs?.peCurve?.acumDeficitUsuario ?? 0), ventasPE: (outputs?.pe?.ventasPE ?? 0), clientsPE: (outputs?.pe?.clientsPE ?? 0) })}';

  if (out.includes(pattA)) {
    out = out.replace(pattA, replA);
    touched = true;
  }

  // (B) Texto de la tarjeta del tablero/“brújula” (label más claro).
  const pattB = "Capital de trabajo necesario en meses (plan {mesesPE}m)";
  const replB = "Capital requerido hasta P.E. (plan {mesesPE}m)";
  if (out.includes(pattB)) {
    out = out.replace(pattB, replB);
    touched = true;
  }

  // Variante de label que a veces usas:
  const pattB2 = "Capital de trabajo necesario (plan {mesesPE}m)";
  if (out.includes(pattB2)) {
    out = out.replace(pattB2, replB);
    touched = true;
  }

  if (!touched) {
    console.log("WARN: no encontré patrones. Revisa que el archivo sea app/page.tsx y que los bloques no hayan sido formateados.");
    process.exit(2);
  }

  fs.writeFileSync(path + ".bak", src, "utf8"); // backup
  fs.writeFileSync(path, out, "utf8");
  console.log("OK: Backup creado y cambios aplicados sobre:", path);
}

const file = process.argv[2];
if (!file) {
  console.error("Uso: node fix-capital-simple.mjs app/page.tsx");
  process.exit(1);
}
patch(file);
