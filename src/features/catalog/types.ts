import type { Framing } from '../../lib/framing'

/** Para quién es la prenda. En la tienda "Mujer" = mujer + unisex (igual "Hombre"). */
export type Gender = 'unisex' | 'hombre' | 'mujer'

/** Tipo de prenda: T-shirts, Crop tops, Gym, Sudaderas… (las crea el admin) */
export type Category = {
  id: string
  name: string
  slug: string
  coverUrl: string | null // foto que la representa en el home
  coverFraming: Framing // zoom y posición de esa foto (se edita en el panel)
  productCount: number
}

export type ProductListItem = {
  id: string
  slug: string
  name: string
  priceCents: number
  compareAtCents: number | null // precio "antes" (oferta)
  gender: Gender
  category: { slug: string; name: string }
  colors: string[]
  ratingAverage: number | null
  reviewCount: number
  imageUrl: string | null
  hoverImageUrl: string | null // la 2ª foto (p. ej. la espalda), para el hover
  isNew: boolean
}

export type ProductList = {
  items: ProductListItem[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type SortOption = 'newest' | 'price_asc' | 'price_desc'

export type ProductFilters = {
  category?: string
  gender?: Gender
  sale?: boolean
  size?: string[]
  color?: string[]
  minPriceCents?: number
  maxPriceCents?: number
  q?: string
  sort?: SortOption
  page?: number
  limit?: number
}

export type FilterOptions = {
  sizes: string[]
  colors: string[]
  minPriceCents: number
  maxPriceCents: number
}

export type Variant = {
  id: string
  sku: string
  size: string
  color: string
  priceCents: number
  stock: number
}

export type ProductDetail = {
  id: string
  slug: string
  name: string
  description: string | null
  priceCents: number
  compareAtCents: number | null
  viewCount: number
  gender: Gender
  category: { name: string; slug: string }
  images: { url: string; altText: string | null }[]
  colors: string[]
  sizes: string[]
  variants: Variant[]
}
