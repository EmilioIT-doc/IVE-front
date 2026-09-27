import { skipToken } from '@reduxjs/toolkit/query'
import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { FREE_SHIPPING_FROM_CENTS, STANDARD_SHIPPING_CENTS } from '../../lib/shipping'
import { getErrorMessage } from '../../services/api'
import { useAuth } from '../auth/useAuth'
import {
  useAddCartItemMutation,
  useGetCartQuery,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from './cartApi'
import {
  cartClosed,
  cartOpened,
  itemAdded,
  itemRemoved,
  quantityChanged,
  selectCartIsOpen,
  selectCartItems,
  type CartLine,
} from './cartSlice'

/**
 * Único punto de entrada a la bolsa para los componentes.
 * - Invitado → bolsa en Redux (localStorage).
 * - Con sesión → bolsa del servidor (RTK Query).
 * Los componentes no saben ni les importa cuál de las dos es.
 */
export function useCart() {
  const dispatch = useAppDispatch()
  const { user } = useAuth()
  const guestItems = useAppSelector(selectCartItems)
  const isOpen = useAppSelector(selectCartIsOpen)

  const server = useGetCartQuery(user ? undefined : skipToken)
  const [addServer] = useAddCartItemMutation()
  const [updateServer] = useUpdateCartItemMutation()
  const [removeServer] = useRemoveCartItemMutation()

  const items: CartLine[] = user
    ? (server.data?.items ?? []).map((i) => ({
        variantId: i.variantId,
        sku: i.sku,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        stock: i.stock,
        unitPriceCents: i.unitPriceCents,
        isAvailable: i.isAvailable,
        product: i.product,
      }))
    : guestItems

  // useCallback: la misma función entre renders (otros hooks dependen de ellas)
  const open = useCallback(() => dispatch(cartOpened()), [dispatch])
  const close = useCallback(() => dispatch(cartClosed()), [dispatch])

  const count = items.reduce((n, i) => n + i.quantity, 0)
  const subtotalCents = items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0)
  const isFree = subtotalCents >= FREE_SHIPPING_FROM_CENTS
  const shippingCents = items.length === 0 || isFree ? 0 : STANDARD_SHIPPING_CENTS

  /** Regresa null si todo salió bien, o el mensaje de error. */
  async function add(line: CartLine): Promise<string | null> {
    if (!user) {
      dispatch(itemAdded(line))
      return null
    }
    try {
      await addServer({ variantId: line.variantId, quantity: line.quantity }).unwrap()
      return null
    } catch (err) {
      return getErrorMessage(err)
    }
  }

  return {
    items,
    count,
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
    remainingForFreeCents: Math.max(0, FREE_SHIPPING_FROM_CENTS - subtotalCents),
    freeShippingProgress: Math.min(1, subtotalCents / FREE_SHIPPING_FROM_CENTS),
    isLoading: !!user && server.isLoading,
    isOpen,
    open,
    close,
    add,
    setQuantity: (variantId: string, quantity: number) =>
      user ? void updateServer({ variantId, quantity }) : dispatch(quantityChanged({ variantId, quantity })),
    remove: (variantId: string) => (user ? void removeServer(variantId) : dispatch(itemRemoved(variantId))),
  }
}
