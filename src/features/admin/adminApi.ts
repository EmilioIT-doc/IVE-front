import type { Framing } from '../../lib/framing'
import { api } from '../../services/api'
import type { AdminCategory, AdminProduct, AdminProductRow, CategoryInput, ProductInfoInput, VariantInput } from './types'

type ProductResponse = { product: AdminProduct }
const unwrap = (res: ProductResponse) => res.product
const unwrapCategory = (res: { category: AdminCategory }) => res.category

// Tocar categorías cambia el home y el menú (Categories) y los nombres en la lista de productos
const categoryTags = (id?: string) =>
  [
    { type: 'AdminCategories', id: 'LIST' },
    ...(id ? [{ type: 'AdminCategories', id } as const] : []),
    'Categories',
    { type: 'AdminProducts', id: 'LIST' },
  ] as const

export const adminApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAdminProducts: build.query<AdminProductRow[], void>({
      query: () => '/admin/products',
      transformResponse: (res: { products: AdminProductRow[] }) => res.products,
      providesTags: [{ type: 'AdminProducts', id: 'LIST' }],
    }),
    getAdminProduct: build.query<AdminProduct, string>({
      query: (id) => `/admin/products/${id}`,
      transformResponse: unwrap,
      providesTags: (_r, _e, id) => [{ type: 'AdminProducts', id }],
    }),
    createProduct: build.mutation<AdminProduct, ProductInfoInput & { variants: Omit<VariantInput, 'id'>[] }>({
      query: (body) => ({ url: '/admin/products', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: [{ type: 'AdminProducts', id: 'LIST' }, 'Categories', { type: 'AdminCategories', id: 'LIST' }],
    }),
    updateProduct: build.mutation<AdminProduct, { id: string } & Partial<ProductInfoInput>>({
      query: ({ id, ...body }) => ({ url: `/admin/products/${id}`, method: 'PATCH', body }),
      transformResponse: unwrap,
      // Cambiar de categoría u ocultar el producto cambia los conteos del home
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'AdminProducts', id },
        { type: 'AdminProducts', id: 'LIST' },
        'Categories',
        { type: 'AdminCategories', id: 'LIST' },
      ],
    }),
    syncVariants: build.mutation<AdminProduct, { id: string; variants: VariantInput[] }>({
      query: ({ id, variants }) => ({ url: `/admin/products/${id}/variants`, method: 'PUT', body: { variants } }),
      transformResponse: unwrap,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'AdminProducts', id }, { type: 'AdminProducts', id: 'LIST' }],
    }),
    reorderImages: build.mutation<AdminProduct, { id: string; ids: string[] }>({
      query: ({ id, ids }) => ({ url: `/admin/products/${id}/images/order`, method: 'PATCH', body: { ids } }),
      transformResponse: unwrap,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'AdminProducts', id }, { type: 'AdminProducts', id: 'LIST' }],
    }),
    deleteImage: build.mutation<AdminProduct, { id: string; imageId: string }>({
      query: ({ id, imageId }) => ({ url: `/admin/products/${id}/images/${imageId}`, method: 'DELETE' }),
      transformResponse: unwrap,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'AdminProducts', id }, { type: 'AdminProducts', id: 'LIST' }],
    }),

    // ------------------------------------------------ categorías
    getAdminCategories: build.query<AdminCategory[], void>({
      query: () => '/admin/categories',
      transformResponse: (res: { categories: AdminCategory[] }) => res.categories,
      providesTags: [{ type: 'AdminCategories', id: 'LIST' }],
    }),
    getAdminCategory: build.query<AdminCategory, string>({
      query: (id) => `/admin/categories/${id}`,
      transformResponse: unwrapCategory,
      providesTags: (_r, _e, id) => [{ type: 'AdminCategories', id }],
    }),
    createCategory: build.mutation<AdminCategory, CategoryInput>({
      query: (body) => ({ url: '/admin/categories', method: 'POST', body }),
      transformResponse: unwrapCategory,
      invalidatesTags: () => [...categoryTags()],
    }),
    updateCategory: build.mutation<AdminCategory, { id: string } & Partial<CategoryInput>>({
      query: ({ id, ...body }) => ({ url: `/admin/categories/${id}`, method: 'PATCH', body }),
      transformResponse: unwrapCategory,
      invalidatesTags: (_r, _e, { id }) => [...categoryTags(id)],
    }),
    reorderCategories: build.mutation<AdminCategory[], string[]>({
      query: (ids) => ({ url: '/admin/categories/order', method: 'PATCH', body: { ids } }),
      transformResponse: (res: { categories: AdminCategory[] }) => res.categories,
      invalidatesTags: () => [...categoryTags()],
    }),
    deleteCategory: build.mutation<void, string>({
      query: (id) => ({ url: `/admin/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: () => [...categoryTags()],
    }),
    updateCategoryCoverFraming: build.mutation<AdminCategory, { id: string; framing: Framing }>({
      query: ({ id, framing }) => ({ url: `/admin/categories/${id}/cover-framing`, method: 'PUT', body: framing }),
      transformResponse: unwrapCategory,
      invalidatesTags: (_r, _e, { id }) => [...categoryTags(id)],
    }),
    removeCategoryCover: build.mutation<AdminCategory, string>({
      query: (id) => ({ url: `/admin/categories/${id}/cover`, method: 'DELETE' }),
      transformResponse: unwrapCategory,
      invalidatesTags: (_r, _e, id) => [...categoryTags(id)],
    }),
  }),
})

export const {
  useGetAdminProductsQuery,
  useGetAdminProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useSyncVariantsMutation,
  useReorderImagesMutation,
  useDeleteImageMutation,
  useGetAdminCategoriesQuery,
  useGetAdminCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useReorderCategoriesMutation,
  useDeleteCategoryMutation,
  useRemoveCategoryCoverMutation,
  useUpdateCategoryCoverFramingMutation,
} = adminApi
