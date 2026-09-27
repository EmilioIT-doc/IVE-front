import { NavLink, Outlet } from 'react-router'
import { useActiveUploadCount } from '../../features/admin/uploads/useUploads'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex h-11 items-center px-3 text-sm font-medium no-underline ${isActive ? 'bg-ink text-bone' : 'hover:bg-sand'}`

export function AdminLayout() {
  const activeUploads = useActiveUploadCount()
  return (
    <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-4 py-10 md:px-16 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-4">
        <span className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">Administración</span>
        <nav aria-label="Administración" className="flex flex-row flex-wrap gap-1 lg:flex-col">
          <NavLink to="/admin" end className={linkClass}>
            Productos
          </NavLink>
          <NavLink to="/admin/productos/nuevo" className={linkClass}>
            + Nuevo producto
          </NavLink>
          <NavLink to="/admin/categorias" className={linkClass}>
            Categorías
          </NavLink>
          <NavLink to="/admin/inicio" className={linkClass}>
            Fotos del inicio
          </NavLink>
          <NavLink to="/admin/cupones" className={linkClass}>
            Cupones
          </NavLink>
          <NavLink to="/admin/resenas" className={linkClass}>
            Reseñas
          </NavLink>
        </nav>
        {/* Las subidas siguen aunque te muevas por el panel: aquí se ve que siguen en camino */}
        {activeUploads > 0 && (
          <p role="status" className="flex animate-fade-in items-center gap-2 text-xs font-medium text-muted">
            <span className="size-2 animate-pulse rounded-full bg-olive" aria-hidden="true" />
            {activeUploads === 1 ? '1 imagen en camino…' : `${activeUploads} imágenes en camino…`}
          </p>
        )}
      </aside>
      <div className="min-w-0 animate-fade-in">
        <Outlet />
      </div>
    </div>
  )
}
