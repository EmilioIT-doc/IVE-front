import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'

/** Forma de los errores del back: { error: { code, message, details? } } */
export type ApiErrorBody = { error: { code: string; message: string; details?: unknown } }

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include', // manda y recibe las cookies de sesión
})

function errorCode(error: FetchBaseQueryError | undefined): string | undefined {
  const data = error?.data as ApiErrorBody | undefined
  return data?.error?.code
}

// Si varias peticiones ven el token expirado a la vez, solo UNA pide el refresh.
// Importante: el back rota el refresh token y detecta si se reutiliza, así que dos
// refresh en paralelo cerrarían la sesión. Por eso todo el front usa esta función.
let refreshing: Promise<boolean> | null = null

/** Pide un access token nuevo con la cookie del refresh token. true = sesión renovada. */
export function refreshSession(): Promise<boolean> {
  refreshing ??= fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

/**
 * Envuelve cada petición: si el back responde TOKEN_EXPIRED, pide un token nuevo
 * con /auth/refresh (usa la cookie del refresh token) y reintenta la original.
 */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  const url = typeof args === 'string' ? args : args.url
  const code = errorCode(result.error)
  // TOKEN_EXPIRED: el access token caducó.
  // UNAUTHORIZED en /auth/me: no hay access token (p. ej. cerraste el navegador con
  // "mantener mi sesión"), pero quizá sí hay refresh token: vale la pena intentarlo.
  const shouldRefresh =
    result.error?.status === 401 &&
    (code === 'TOKEN_EXPIRED' || (code === 'UNAUTHORIZED' && url === '/auth/me')) &&
    !url.startsWith('/auth/refresh')

  if (shouldRefresh) {
    if (await refreshSession()) {
      result = await rawBaseQuery(args, api, extraOptions)
    }
  }
  return result
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Me', 'Cart', 'Addresses', 'Orders', 'AdminProducts', 'Categories', 'AdminCategories', 'Site', 'Favorites', 'Reviews', 'AdminCoupons', 'AdminReviews'],
  endpoints: () => ({}), // cada feature agrega los suyos con injectEndpoints
})

/** Mensaje amigable para cualquier error de RTK Query. */
export function getErrorMessage(error: unknown, fallback = 'Algo salió mal, intenta de nuevo'): string {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const message = (error as { data?: ApiErrorBody }).data?.error?.message
    if (message) return message
  }
  if (typeof error === 'object' && error !== null && 'status' in error && error.status === 'FETCH_ERROR') {
    return 'No hay conexión con el servidor. ¿Está corriendo el back?'
  }
  return fallback
}
