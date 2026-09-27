import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import type { ProductListItem } from '../catalog/types'
import { useGetFavoritesQuery, useSetFavoriteMutation } from './favoritesApi'

/** ¿Está en favoritos? + alternar. Si no hay sesión, manda a iniciar sesión y regresa aquí. */
export function useFavorites() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { data } = useGetFavoritesQuery(undefined, { skip: !user })
  const [setFavorite] = useSetFavoriteMutation()
  const ids = useMemo(() => new Set((data ?? []).map((p) => p.id)), [data])

  const toggle = (product: ProductListItem | { id: string }) => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search, reason: 'favoritos' } })
      return
    }
    void setFavorite({ product, on: !ids.has(product.id) })
  }

  return { isFavorite: (id: string) => ids.has(id), toggle, count: ids.size }
}
