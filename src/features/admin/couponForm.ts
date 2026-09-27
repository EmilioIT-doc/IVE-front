import { z } from 'zod'
import type { NewCoupon } from '../coupons/couponsApi'

const pesos = /^\d{1,6}(\.\d{1,2})?$/
const optionalInt = z.string().trim().regex(/^(\d{1,6})?$/, 'Solo números enteros')

export const couponFormSchema = z
  .object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, 'De 3 a 30 letras o números, sin espacios'),
    description: z.string().trim().max(200),
    discountType: z.enum(['percent', 'fixed']),
    discountValue: z.string().trim().min(1, 'Escribe el descuento'),
    minSubtotal: z.string().trim().regex(/^(\d{1,6}(\.\d{1,2})?)?$/, 'Escribe una cantidad en pesos'),
    maxUses: optionalInt,
    perUserLimit: optionalInt,
    startsAt: z.string(),
    endsAt: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.discountType === 'percent') {
      const n = Number(v.discountValue)
      if (!/^\d{1,3}$/.test(v.discountValue) || n < 1 || n > 100) {
        ctx.addIssue({ code: 'custom', path: ['discountValue'], message: 'Un porcentaje entero de 1 a 100' })
      }
    } else if (!pesos.test(v.discountValue) || Number(v.discountValue) <= 0) {
      ctx.addIssue({ code: 'custom', path: ['discountValue'], message: 'Escribe los pesos a descontar, ej. 100' })
    }
    if (v.startsAt && v.endsAt && new Date(v.endsAt) <= new Date(v.startsAt)) {
      ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'Debe ser después del inicio' })
    }
  })

export type CouponFormValues = z.infer<typeof couponFormSchema>

export const emptyCouponForm: CouponFormValues = {
  code: '',
  description: '',
  discountType: 'percent',
  discountValue: '',
  minSubtotal: '',
  maxUses: '',
  perUserLimit: '1',
  startsAt: '',
  endsAt: '',
}

const cents = (pesosText: string) => Math.round(Number(pesosText) * 100)
const intOrNull = (text: string) => (text ? Number(text) : null)
// <input type="datetime-local"> da la hora local sin zona: new Date() la interpreta como local
const isoOrNull = (local: string) => (local ? new Date(local).toISOString() : null)

export function couponFromForm(v: CouponFormValues): NewCoupon {
  return {
    code: v.code,
    description: v.description || null,
    discountType: v.discountType,
    discountValue: v.discountType === 'percent' ? Number(v.discountValue) : cents(v.discountValue),
    minSubtotalCents: v.minSubtotal ? cents(v.minSubtotal) : 0,
    maxUses: intOrNull(v.maxUses),
    perUserLimit: intOrNull(v.perUserLimit),
    startsAt: isoOrNull(v.startsAt),
    endsAt: isoOrNull(v.endsAt),
    isActive: true,
  }
}
