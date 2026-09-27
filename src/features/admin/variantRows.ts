import { capitalize } from '../../lib/format'
import type { AdminVariant, VariantInput } from './types'

export type VariantRow = {
  key: string // identificador local para React
  id?: string // existe en la base
  sku?: string
  size: string
  color: string
  stock: string // como texto: así el input puede quedar vacío mientras escribes
  price: string // en pesos; vacío = usa el precio del producto
  isActive: boolean
}

export const STOCK_RE = /^\d{1,6}$/
export const PRICE_RE = /^\d{1,6}(\.\d{1,2})?$/

let seq = 0
export const newRowKey = () => `row-${++seq}`

export const rowsFromVariants = (variants: AdminVariant[]): VariantRow[] =>
  variants.map((v) => ({
    key: newRowKey(),
    id: v.id,
    sku: v.sku,
    size: v.size,
    color: v.color,
    stock: String(v.stock),
    price: v.priceCents === null ? '' : v.priceCents % 100 === 0 ? String(v.priceCents / 100) : (v.priceCents / 100).toFixed(2),
    isActive: v.isActive,
  }))

/** Convierte las filas del formulario a lo que espera la API, o regresa el primer error. */
export function rowsToVariants(rows: VariantRow[]): { variants: VariantInput[] } | { error: string } {
  const variants: VariantInput[] = []
  for (const r of rows) {
    const label = `${capitalize(r.color)} · ${r.size}`
    if (!STOCK_RE.test(r.stock)) return { error: `Stock inválido en ${label}: usa un número entero` }
    if (r.price && !PRICE_RE.test(r.price)) return { error: `Precio inválido en ${label}: ej. 499 o 499.90` }
    variants.push({
      ...(r.id ? { id: r.id } : {}),
      size: r.size,
      color: r.color,
      stock: Number(r.stock),
      priceCents: r.price ? Math.round(Number(r.price) * 100) : null,
      isActive: r.isActive,
    })
  }
  return { variants }
}
