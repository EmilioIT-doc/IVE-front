import { api } from '../../services/api'
import type { Category, FilterOptions, ProductDetail, ProductFilters, ProductList, ProductListItem } from './types'

/** Convierte los filtros en query string: { size: ['M','L'] } → "size=M,L" */
function toQuery(f: ProductFilters): string {
  const params = new URLSearchParams()
  if (f.category) params.set('category', f.category)
  if (f.gender) params.set('gender', f.gender)
  if (f.sale) params.set('sale', '1')
  if (f.size?.length) params.set('size', f.size.join(','))
  if (f.color?.length) params.set('color', f.color.join(','))
  if (f.minPriceCents !== undefined) params.set('minPriceCents', String(f.minPriceCents))
  if (f.maxPriceCents !== undefined) params.set('maxPriceCents', String(f.maxPriceCents))
  if (f.q) params.set('q', f.q)
  if (f.sort) params.set('sort', f.sort)
  if (f.page) params.set('page', String(f.page))
  if (f.limit) params.set('limit', String(f.limit))
  return params.toString()
}

export const catalogApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCategories: build.query<Category[], void>({
      query: () => '/categories',
      transformResponse: (res: { categories: Category[] }) => res.categories,
      providesTags: ['Categories'],
    }),
    getProducts: build.query<ProductList, ProductFilters>({
      query: (filters) => `/products?${toQuery(filters)}`,
    }),
    getFilterOptions: build.query<FilterOptions, void>({
      query: () => '/products/filters',
    }),
    getProduct: build.query<ProductDetail, string>({
      query: (slug) => `/products/${slug}`,
      transformResponse: (res: { product: ProductDetail }) => res.product,
    }),
    /** Cuenta una visita (el back ignora recargas del mismo navegador en 30 min). */
    registerView: build.mutation<{ viewCount: number; counted: boolean }, string>({
      query: (slug) => ({ url: `/products/${slug}/views`, method: 'POST' }),
    }),
    getRelatedProducts: build.query<ProductListItem[], { slug: string; limit?: number }>({
      query: ({ slug, limit = 4 }) => `/products/${slug}/related?limit=${limit}`,
      transformResponse: (res: { items: ProductListItem[] }) => res.items,
    }),
  }),
})

export const {
  useGetCategoriesQuery,
  useGetProductsQuery,
  useGetFilterOptionsQuery,
  useGetProductQuery,
  useGetRelatedProductsQuery,
  useRegisterViewMutation,
} = catalogApi
