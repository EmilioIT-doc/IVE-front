import { z } from 'zod'

// Las MISMAS reglas que valida el back (auth.schemas.ts). El back es quien
// manda; aquí solo damos retroalimentación inmediata al usuario.
export const NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{2,50}$/

export const PASSWORD_RULES = [
  { label: 'Mínimo 8 caracteres', regex: /.{8,}/ },
  { label: 'Una mayúscula', regex: /[A-Z]/ },
  { label: 'Una minúscula', regex: /[a-z]/ },
  { label: 'Un número', regex: /\d/ },
  { label: 'Un símbolo (!@#$…)', regex: /[^A-Za-z0-9]/ },
] as const

const email = z.string().trim().toLowerCase().pipe(z.email('Escribe un correo válido, como nombre@correo.com'))

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Escribe tu contraseña'),
  remember: z.boolean(),
})
export type LoginValues = z.infer<typeof loginSchema>

/** Edad cumplida a partir de "AAAA-MM-DD" */
export function ageFrom(iso: string, today = new Date()) {
  const [y, m, d] = iso.split('-').map(Number)
  let age = today.getFullYear() - y!
  if (today.getMonth() + 1 < m! || (today.getMonth() + 1 === m! && today.getDate() < d!)) age--
  return age
}

export const registerStep1Schema = z.object({
  firstName: z.string().trim().regex(NAME_REGEX, 'Escribe tu nombre (solo letras)'),
  lastName: z.string().trim().regex(NAME_REGEX, 'Escribe tu apellido (solo letras)'),
  email,
  // "55 1234-5678" → "5512345678"
  phone: z
    .string()
    .transform((s) => s.replace(/[\s-]/g, ''))
    .pipe(z.string().regex(/^\d{10}$/, 'Tu celular a 10 dígitos, ej. 55 1234 5678')),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige tu fecha de nacimiento')
    .refine((s) => ageFrom(s) >= 13, 'Debes tener al menos 13 años')
    .refine((s) => ageFrom(s) <= 120, 'Revisa el año'),
})
export type RegisterStep1Input = z.input<typeof registerStep1Schema>
export type RegisterStep1Values = z.output<typeof registerStep1Schema>

export const registerStep2Schema = z
  .object({
    password: PASSWORD_RULES.reduce(
      (schema, rule) => schema.regex(rule.regex, rule.label),
      z.string().max(128, 'Máximo 128 caracteres'),
    ),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
    terms: z.boolean().refine((v) => v, 'Debes aceptar los términos'),
    channel: z.enum(['email', 'sms']),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
export type RegisterStep2Values = z.infer<typeof registerStep2Schema>
