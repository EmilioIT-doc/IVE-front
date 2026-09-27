import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'

/**
 * Bolsa de INVITADO: vive en Redux y se guarda en localStorage.
 * Cuando el usuario inicie sesión, se fusiona con la bolsa del servidor
 * (POST /api/cart/merge) — eso lo conectamos en el siguiente paso.
 */
export type CartLine = {
  variantId: string
  sku: string
  size: string
  color: string
  quantity: number
  stock: number
  unitPriceCents: number
  product: { name: string; slug: string; imageUrl?: string | null }
  isAvailable?: boolean
}

type CartState = {
  items: CartLine[]
  isOpen: boolean // el drawer de la bolsa
}

const MAX_PER_ITEM = 20
const STORAGE_KEY = 'ive:guest-cart'

function loadItems(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartLine[]) : []
  } catch {
    return []
  }
}

export function saveItems(items: CartLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // modo incógnito o almacenamiento lleno: seguimos sin persistir
  }
}

const limit = (qty: number, stock: number) => Math.max(1, Math.min(qty, stock, MAX_PER_ITEM))

const initialState: CartState = { items: loadItems(), isOpen: false }

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Redux Toolkit usa Immer: parece que "mutamos" el estado,
    // pero por debajo se crea una copia inmutable.
    itemAdded(state, action: PayloadAction<CartLine>) {
      const line = action.payload
      const existing = state.items.find((i) => i.variantId === line.variantId)
      if (existing) {
        existing.stock = line.stock
        existing.quantity = limit(existing.quantity + line.quantity, line.stock)
      } else {
        state.items.push({ ...line, quantity: limit(line.quantity, line.stock) })
      }
    },
    quantityChanged(state, action: PayloadAction<{ variantId: string; quantity: number }>) {
      const item = state.items.find((i) => i.variantId === action.payload.variantId)
      if (item) item.quantity = limit(action.payload.quantity, item.stock)
    },
    itemRemoved(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.variantId !== action.payload)
    },
    cartCleared(state) {
      state.items = []
    },
    cartOpened(state) {
      state.isOpen = true
    },
    cartClosed(state) {
      state.isOpen = false
    },
  },
})

export const { itemAdded, quantityChanged, itemRemoved, cartCleared, cartOpened, cartClosed } = cartSlice.actions
export default cartSlice.reducer

// Selectores
export const selectCartItems = (s: RootState) => s.cart.items
export const selectCartIsOpen = (s: RootState) => s.cart.isOpen
export const selectCartCount = (s: RootState) => s.cart.items.reduce((n, i) => n + i.quantity, 0)
export const selectCartSubtotal = (s: RootState) =>
  s.cart.items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0)
