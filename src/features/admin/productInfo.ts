import { z } from 'zod'

export const productInfoSchema = z.object({
  name: z.string().trim().min(2, 'Escribe el nombre').max(120),
  categoryId: z.string().min(1, 'Elige una categoría'),
  gender: z.enum(['unisex', 'hombre', 'mujer']),
  // El precio se escribe en pesos y se manda en centavos
  price: z
    .string()
    .trim()
    .regex(/^\d{1,6}(\.\d{1,2})?$/, 'Escribe el precio en pesos, ej. 499 o 499.90'),
  // Opcional: precio "antes" (tachado). Vacío = sin oferta
  compareAt: z
    .string()
    .trim()
    .regex(/^(\d{1,6}(\.\d{1,2})?)?$/, 'Escribe el precio en pesos, ej. 599'),
  description: z.string().trim().max(2000),
  isActive: z.boolean(),
}).refine((v) => !v.compareAt || Number(v.compareAt) > Number(v.price), {
  path: ['compareAt'],
  message: 'Debe ser mayor que el precio actual',
})

export type ProductInfoValues = z.infer<typeof productInfoSchema>

export const toCents = (price: string) => Math.round(Number(price) * 100)

/** "" → null (sin oferta) */
export const toCentsOrNull = (price: string) => (price.trim() ? toCents(price) : null)

/** 49900 → "499" · 49990 → "499.90" */
export const centsToInput = (cents: number | null) =>
  cents == null ? '' : cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2)
