import type { Gender } from '../catalog/types'
import type { Framing } from '../../lib/framing'

export type AdminProductRow = {
  id: string
  slug: string
  name: string
  priceCents: number
  compareAtCents: number | null
  viewCount: number
  isActive: boolean
  gender: Gender
  categoryName: string
  imageUrl: string | null
  variantCount: number
  totalStock: number
  updatedAt: string
}

export type AdminVariant = {
  id: string
  sku: string
  size: string
  color: string
  stock: number
  priceCents: number | null
  isActive: boolean
}

export type AdminImage = { id: string; url: string; altText: string | null; position: number }

export type AdminProduct = {
  id: string
  categoryId: string
  gender: Gender
  name: string
  slug: string
  description: string | null
  priceCents: number
  compareAtCents: number | null
  viewCount: number
  isActive: boolean
  variants: AdminVariant[]
  images: AdminImage[]
}

export type ProductInfoInput = {
  categoryId: string
  gender: Gender
  name: string
  description: string | null
  priceCents: number
  compareAtCents: number | null
  isActive: boolean
}

export type VariantInput = {
  id?: string
  size: string
  color: string
  stock: number
  priceCents: number | null
  isActive: boolean
}

export type AdminCategory = {
  id: string
  name: string
  slug: string
  coverUrl: string | null
  coverFraming: Framing
  position: number
  isActive: boolean
  productCount: number // todos (visibles y ocultos)
  activeProductCount: number
}

export type CategoryInput = { name: string; slug?: string; isActive: boolean }
