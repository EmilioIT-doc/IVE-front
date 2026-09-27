/** % de descuento redondeado: 59900 → 44900 = 25 */
export function discountPercent(priceCents: number, compareAtCents: number | null | undefined) {
  if (!compareAtCents || compareAtCents <= priceCents) return 0
  return Math.round((1 - priceCents / compareAtCents) * 100)
}
