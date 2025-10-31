/**
 * Cálculo de impuesto:
 * - 25% de la rentabilidad antes de impuestos (PBT/RAI)
 * - redondeado a entero
 * - si PBT <= 0, impuesto = 0
 * - porcentaje sobre venta = impuesto / venta (si venta > 0)
 */
export function computeTaxFromPBT(pbt: number, sales: number) {
  const taxable = Math.max(0, Number.isFinite(pbt) ? pbt : 0);
  const taxAmount = Math.round(0.25 * taxable);
  const taxPctOverSales = sales > 0 ? taxAmount / sales : 0;
  return { taxAmount, taxPctOverSales };
}
