import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../../features/auth/useAuth'

/** Solo administradores. Ojo: esto es solo UX; quien de verdad protege es el back (requireAdmin). */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">Cargando…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.role !== 'admin') {
    return (
      <div className="mx-auto flex max-w-[1440px] flex-col items-start gap-4 px-4 py-24 md:px-16">
        <h1 className="font-display text-5xl">Sin acceso</h1>
        <p className="text-muted">Esta sección es solo para administradores.</p>
      </div>
    )
  }
  return children
}
