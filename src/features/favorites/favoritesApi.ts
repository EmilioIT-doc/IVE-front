import { api } from '../../services/api'
import type { ProductListItem } from '../catalog/types'

export const favoritesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getFavorites: build.query<ProductListItem[], void>({
      query: () => '/favorites',
      transformResponse: (res: { items: ProductListItem[] }) => res.items,
      providesTags: ['Favorites'],
    }),
    setFavorite: build.mutation<void, { product: ProductListItem | { id: string }; on: boolean }>({
      query: ({ product, on }) => ({ url: `/favorites/${product.id}`, method: on ? 'PUT' : 'DELETE' }),
      // Actualización optimista: el corazón cambia al instante; si el back falla, se revierte
      async onQueryStarted({ product, on }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          favoritesApi.util.updateQueryData('getFavorites', undefined, (draft) => {
            const i = draft.findIndex((p) => p.id === product.id)
            if (on && i === -1 && 'slug' in product) draft.unshift(product)
            if (!on && i !== -1) draft.splice(i, 1)
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: ['Favorites'],
    }),
  }),
})

export const { useGetFavoritesQuery, useSetFavoriteMutation } = favoritesApi
