import { z } from 'zod'

/** Mismas reglas que el back (categories.schemas.ts). */
const RESERVED = ['mujer', 'hombre', 'unisex']

export const categoryNameSchema = z.string().trim().min(2, 'Escribe el nombre').max(40, 'Máximo 40 caracteres')

export const categoryFormSchema = z.object({
  name: categoryNameSchema,
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones (ej. crop-tops)')
    .refine((s) => !RESERVED.includes(s), 'Mujer, hombre y unisex ya son secciones de la tienda'),
  isActive: z.boolean(),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>
