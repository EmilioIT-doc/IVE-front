import type { Gender } from '../features/catalog/types'

/** Las "secciones" de la tienda por público. El orden es el del menú. */
export const GENDERS: { slug: Gender; label: string }[] = [
  { slug: 'mujer', label: 'Mujer' },
  { slug: 'hombre', label: 'Hombre' },
  { slug: 'unisex', label: 'Unisex' },
]

export const isGender = (value: string | undefined): value is Gender => GENDERS.some((g) => g.slug === value)

export const genderLabel = (gender: Gender) => GENDERS.find((g) => g.slug === gender)!.label

/**
 * URL de la tienda:
 *   /tienda                      todo
 *   /tienda/mujer                mujer (incluye unisex)
 *   /tienda/crop-tops            una categoría
 *   /tienda/mujer/crop-tops      las dos cosas
 */
export function shopPath(gender?: Gender, category?: string) {
  return ['/tienda', gender, category].filter(Boolean).join('/')
}
