import { useGetMeQuery } from './authApi'

/** ¿Quién está usando la tienda? null = invitado. */
export function useAuth() {
  const { data, isLoading, isFetching } = useGetMeQuery()
  return { user: data ?? null, isLoading: isLoading || (isFetching && data === undefined) }
}
