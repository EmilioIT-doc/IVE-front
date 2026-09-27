import { Link } from 'react-router'
import { ErrorState } from '../../components/ui/ErrorState'
import { useGetAdminProductsQuery } from '../../features/admin/adminApi'
import { toneFor } from '../../lib/colors'
import { formatMoney } from '../../lib/format'
import { genderLabel } from '../../lib/gender'
import { getErrorMessage } from '../../services/api'

export function AdminProductsPage() {
  const { data: products, isLoading, error, refetch } = useGetAdminProductsQuery()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-5xl leading-none">Productos</h1>
          <p className="text-sm text-muted">{products ? `${products.length} productos` : ' '}</p>
        </div>
        <Link to="/admin/productos/nuevo" className="flex h-12 items-center bg-ink px-6 text-sm font-semibold tracking-wide text-bone no-underline hover:bg-olive">
          + Nuevo producto
        </Link>
      </div>

      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : isLoading ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : (
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line bg-sand text-xs tracking-wide text-muted uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Producto</th>
                <th scope="col" className="px-4 py-3 font-semibold">Categoría</th>
                <th scope="col" className="px-4 py-3 font-semibold">Precio</th>
                <th scope="col" className="px-4 py-3 font-semibold">Variantes</th>
                <th scope="col" className="px-4 py-3 font-semibold">Stock</th>
                <th scope="col" className="px-4 py-3 font-semibold">Vistas</th>
                <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {products?.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-bone">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden bg-white ring-1 ring-line" style={p.imageUrl ? undefined : { backgroundColor: toneFor(p.slug) }}>
                        {p.imageUrl && <img src={p.imageUrl} alt="" className="h-full w-full object-contain" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-xs text-subtle">/{p.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.categoryName} · {genderLabel(p.gender)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span>{formatMoney(p.priceCents)}</span>
                      {p.compareAtCents != null && <span className="text-xs text-subtle line-through">{formatMoney(p.compareAtCents)}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.variantCount}</td>
                  <td className={`px-4 py-3 ${p.totalStock === 0 ? 'font-semibold text-warn' : ''}`}>{p.totalStock}</td>
                  <td className="px-4 py-3 tabular-nums text-muted">{p.viewCount.toLocaleString('es-MX')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[11px] font-semibold tracking-wide uppercase ${p.isActive ? 'bg-[#dfe3d8] text-olive' : 'bg-linen text-muted'}`}>
                      {p.isActive ? 'Visible' : 'Oculto'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/productos/${p.id}`} className="font-semibold">Editar</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
