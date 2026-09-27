import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import cartReducer, { saveItems } from '../features/cart/cartSlice'
import { api } from '../services/api'

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    [api.reducerPath]: api.reducer, // caché de RTK Query
  },
  middleware: (getDefault) => getDefault().concat(api.middleware),
})

// Vuelve a pedir datos al recuperar el foco o la conexión
setupListeners(store.dispatch)

// Persistimos la bolsa de invitado cada vez que cambia
let lastItems = store.getState().cart.items
store.subscribe(() => {
  const items = store.getState().cart.items
  if (items !== lastItems) {
    lastItems = items
    saveItems(items)
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
