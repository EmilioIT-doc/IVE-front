import type { AddressInput } from '../addresses/types'

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
export type ShippingMethod = 'standard' | 'express'

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export type OrderSummary = {
  id: string
  status: OrderStatus
  totalCents: number
  createdAt: string
  itemCount: number
}

export type OrderItem = {
  variantId: string
  productName: string
  sku: string
  size: string
  color: string
  unitPriceCents: number
  quantity: number
  lineTotalCents: number
}

export type Order = {
  id: string
  status: OrderStatus
  subtotalCents: number
  discountCents: number
  couponCode: string | null
  shippingCents: number
  totalCents: number
  shippingMethod: ShippingMethod
  shippingAddress: AddressInput & { country: string }
  createdAt: string
  paymentStatus: string | null
  items: OrderItem[]
}

export type CreateOrderInput = {
  idempotencyKey: string
  shippingMethod: ShippingMethod
  paymentToken: string
  couponCode?: string
} & ({ addressId: string } | { address: AddressInput; saveAddress: boolean })
