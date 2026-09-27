import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { api } from '../../services/api'
import { useMergeCartMutation } from '../cart/cartApi'
import { cartCleared, selectCartItems } from '../cart/cartSlice'
import { authApi, useLoginMutation, useLogoutMutation, useRegisterMutation, useVerifyCodeMutation } from './authApi'
import type { RegisterInput, User } from './types'

/** Acciones de sesión: login, registro y logout, con todo lo que pasa alrededor. */
export function useSession() {
  const dispatch = useAppDispatch()
  const guestItems = useAppSelector(selectCartItems)
  const [loginMutation, loginState] = useLoginMutation()
  const [registerMutation, registerState] = useRegisterMutation()
  const [verifyMutation] = useVerifyCodeMutation()
  const [logoutMutation] = useLogoutMutation()
  const [mergeCart] = useMergeCartMutation()

  /** Al entrar: guarda el usuario en caché y pasa la bolsa de invitado al servidor. */
  async function onSignedIn(user: User) {
    dispatch(authApi.util.upsertQueryData('getMe', undefined, user))
    if (guestItems.length > 0) {
      try {
        await mergeCart({ items: guestItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity })) }).unwrap()
      } catch {
        // si falla, la bolsa del servidor se carga igual; no bloqueamos el login
      }
    }
    dispatch(cartCleared())
    dispatch(api.util.invalidateTags(['Cart', 'Orders', 'Addresses']))
  }

  return {
    login: async (values: { email: string; password: string; remember: boolean }) => {
      const user = await loginMutation(values).unwrap()
      await onSignedIn(user)
      return user
    },
    /** Crea la cuenta; regresa a dónde se mandó el código (aún sin sesión). */
    register: (values: RegisterInput) => registerMutation(values).unwrap(),
    /** Código correcto → ya hay sesión: se hace todo lo del login (bolsa de invitado, etc.). */
    verify: async (values: { email: string; code: string }) => {
      const user = await verifyMutation(values).unwrap()
      await onSignedIn(user)
      return user
    },
    logout: async () => {
      try {
        await logoutMutation().unwrap()
      } finally {
        // Borra TODA la caché de la API (pedidos, direcciones, bolsa…) de la sesión anterior
        dispatch(api.util.resetApiState())
      }
    },
    isLoggingIn: loginState.isLoading,
    isRegistering: registerState.isLoading,
  }
}
