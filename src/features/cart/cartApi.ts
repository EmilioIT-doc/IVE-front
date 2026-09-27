import { api } from '../../services/api'

export type ServerCartItem = {
  variantId: string
  sku: string
  size: string
  color: string
  quantity: number
  stock: number
  isAvailable: boolean
  unitPriceCents: number
  lineTotalCents: number
  product: { name: string; slug: string; imageUrl: string | null }
}

export type ServerCart = {
  items: ServerCartItem[]
  itemCount: number
  subtotalCents: number
  shipping: { freeFromCents: number; remainingForFreeCents: number; standardCents: number }
}

type CartResponse = { cart: ServerCart }

export const cartApi = api.injectEndpoints({
  endpoints: (build) => {
    // Cada mutación regresa la bolsa completa: la escribimos directo en la caché
    // de getCart en lugar de volver a pedirla ("actualización pesimista").
    const writeCart = {
      transformResponse: (res: CartResponse) => res.cart,
      async onQueryStarted(_arg: unknown, { dispatch, queryFulfilled }: { dispatch: (a: unknown) => unknown; queryFulfilled: Promise<{ data: ServerCart }> }) {
        try {
          const { data } = await queryFulfilled
          dispatch(cartApi.util.upsertQueryData('getCart', undefined, data))
        } catch {
          // el componente que llamó muestra el error
        }
      },
    }

    return {
      getCart: build.query<ServerCart, void>({
        query: () => '/cart',
        transformResponse: (res: CartResponse) => res.cart,
        providesTags: ['Cart'],
      }),
      addCartItem: build.mutation<ServerCart, { variantId: string; quantity: number }>({
        query: (body) => ({ url: '/cart/items', method: 'POST', body }),
        ...writeCart,
      }),
      updateCartItem: build.mutation<ServerCart, { variantId: string; quantity: number }>({
        query: ({ variantId, quantity }) => ({ url: `/cart/items/${variantId}`, method: 'PATCH', body: { quantity } }),
        ...writeCart,
      }),
      removeCartItem: build.mutation<ServerCart, string>({
        query: (variantId) => ({ url: `/cart/items/${variantId}`, method: 'DELETE' }),
        ...writeCart,
      }),
      mergeCart: build.mutation<ServerCart, { items: { variantId: string; quantity: number }[] }>({
        query: (body) => ({ url: '/cart/merge', method: 'POST', body }),
        ...writeCart,
      }),
    }
  },
})

export const {
  useGetCartQuery,
  useAddCartItemMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useMergeCartMutation,
} = cartApi
