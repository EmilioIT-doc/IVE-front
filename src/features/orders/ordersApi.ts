import { api } from '../../services/api'
import type { CreateOrderInput, Order, OrderSummary } from './types'

export const ordersApi = api.injectEndpoints({
  endpoints: (build) => ({
    getOrders: build.query<OrderSummary[], void>({
      query: () => '/orders',
      transformResponse: (res: { orders: OrderSummary[] }) => res.orders,
      providesTags: ['Orders'],
    }),
    getOrder: build.query<Order, string>({
      query: (id) => `/orders/${id}`,
      transformResponse: (res: { order: Order }) => res.order,
      providesTags: (_r, _e, id) => [{ type: 'Orders', id }],
    }),
    createOrder: build.mutation<Order, CreateOrderInput>({
      query: ({ idempotencyKey, ...body }) => ({
        url: '/orders',
        method: 'POST',
        body,
        // Si el usuario da doble clic o reintenta, el back ve la misma llave
        // y regresa el mismo pedido en lugar de cobrar dos veces.
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
      transformResponse: (res: { order: Order }) => res.order,
      // Tras comprar: la bolsa quedó vacía, hay un pedido nuevo y quizá una dirección nueva
      invalidatesTags: ['Cart', 'Orders', 'Addresses'],
    }),
  }),
})

export const { useGetOrdersQuery, useGetOrderQuery, useCreateOrderMutation } = ordersApi
