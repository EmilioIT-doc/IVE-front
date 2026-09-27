import { z } from 'zod'

/** Algoritmo de Luhn: el dígito verificador que traen todas las tarjetas. */
export function passesLuhn(digits: string): boolean {
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i])
    if (double) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    double = !double
  }
  return sum % 10 === 0
}

/** "4242424242424242" → "4242 4242 4242 4242" mientras escribes */
export const formatCardNumber = (v: string) =>
  v
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')

/** "1228" → "12/28" */
export const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

function notExpired(mmYY: string) {
  const [mm, yy] = mmYY.split('/').map(Number)
  const now = new Date()
  const year = 2000 + (yy ?? 0)
  return year > now.getFullYear() || (year === now.getFullYear() && (mm ?? 0) >= now.getMonth() + 1)
}

export const paymentSchema = z.object({
  cardNumber: z
    .string()
    .regex(/^\d{4} \d{4} \d{4} \d{4}$/, 'Escribe los 16 dígitos de la tarjeta')
    .refine((v) => passesLuhn(v.replace(/\s/g, '')), 'El número de tarjeta no es válido'),
  cardName: z
    .string()
    .trim()
    .regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]{3,60}$/, 'Escribe el nombre como aparece en la tarjeta'),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Usa el formato MM/AA')
    .refine(notExpired, 'La tarjeta está vencida'),
  cvv: z.string().regex(/^\d{3,4}$/, 'El CVV tiene 3 o 4 dígitos'),
})

export type PaymentValues = z.infer<typeof paymentSchema>

/**
 * "Tokenización" de mentira. En la vida real el SDK del proveedor (Stripe, Conekta…)
 * manda la tarjeta directo a SUS servidores y a ti solo te regresa un token.
 * Así el número de tarjeta nunca pasa por tu back.
 */
export function tokenizeCard(cardNumber: string): string {
  const digits = cardNumber.replace(/\s/g, '')
  if (digits === '4000000000000002') return 'tok_declined'
  if (digits === '4000000000009995') return 'tok_insufficient_funds'
  return 'tok_success'
}

export const TEST_CARDS = [
  { number: '4242 4242 4242 4242', result: 'Pago aprobado' },
  { number: '4000 0000 0000 0002', result: 'Tarjeta rechazada' },
  { number: '4000 0000 0000 9995', result: 'Fondos insuficientes' },
]
