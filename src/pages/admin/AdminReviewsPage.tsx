import { useState } from 'react'
import { Link } from 'react-router'
import { ErrorState } from '../../components/ui/ErrorState'
import { Stars } from '../../components/ui/Stars'
import { useGetAdminReviewsQuery, useModerateReviewMutation, type AdminReview } from '../../features/reviews/reviewsApi'
import { formatDate } from '../../lib/format'
import { getErrorMessage } from '../../services/api'

type Status = 'all' | 'visible' | 'hidden'

const FILTERS: { value: Status; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'visible', label: 'Visibles' },
  { value: 'hidden', label: 'Ocultas' },
]

export function AdminReviewsPage() {
  const [status, setStatus] = useState<Status>('all')
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, error, refetch } = useGetAdminReviewsQuery({ status, page })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-5xl leading-none">Reseñas</h1>
        <p className="text-sm text-muted">Una reseña oculta deja de verse en la tienda y no cuenta para el promedio. Su autor sí la sigue viendo.</p>
      </div>

      <div role="group" aria-label="Filtrar reseñas" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={status === f.value}
            onClick={() => {
              setStatus(f.value)
              setPage(1)
            }}
            className={`h-10 px-4 text-sm font-semibold ${status === f.value ? 'bg-ink text-bone' : 'border border-field hover:bg-sand'}`}
          >
            {f.label}
          </button>
        ))}
        {data && <span className="ml-auto self-center text-sm text-muted">{data.total} {data.total === 1 ? 'reseña' : 'reseñas'}</span>}
      </div>

      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : isLoading || !data ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : data.items.length === 0 ? (
        <p className="text-sm text-muted">No hay reseñas aquí.</p>
      ) : (
        <ul className={`flex flex-col gap-3 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
          {data.items.map((r) => <ReviewRow key={r.id} review={r} />)}
        </ul>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-11 border border-field px-5 text-sm font-semibold disabled:opacity-40">Anteriores</button>
          <span className="text-sm text-muted">Página {data.page} de {data.totalPages}</span>
          <button type="button" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="h-11 border border-field px-5 text-sm font-semibold disabled:opacity-40">Siguientes</button>
        </div>
      )}
    </div>
  )
}

function ReviewRow({ review: r }: { review: AdminReview }) {
  const [moderate, state] = useModerateReviewMutation()
  const [error, setError] = useState<string | null>(null)

  const toggle = async () => {
    setError(null)
    try {
      await moderate({ id: r.id, isHidden: !r.isHidden, productSlug: r.productSlug }).unwrap()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <li className={`flex flex-col gap-3 border border-line p-5 sm:flex-row sm:items-start sm:justify-between ${r.isHidden ? 'bg-linen' : 'bg-white'}`}>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Stars value={r.rating} size={15} />
          {r.title && <span className="font-semibold">{r.title}</span>}
          {r.isHidden && <span className="bg-white px-2 py-0.5 text-[11px] font-semibold tracking-wide text-muted uppercase">Oculta</span>}
        </div>
        {r.comment && <p className="text-sm leading-relaxed whitespace-pre-line text-muted">{r.comment}</p>}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
          <Link to={`/producto/${r.productSlug}#resenas`} className="font-semibold text-ink">{r.productName}</Link>
          <span>{r.authorName} · {r.userEmail}</span>
          {r.verifiedPurchase && <span className="font-semibold text-olive">✓ Compra verificada</span>}
          <span>{formatDate(r.createdAt)}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
        <button type="button" disabled={state.isLoading} onClick={toggle} className="h-10 border border-ink px-4 text-sm font-semibold hover:bg-ink hover:text-bone disabled:opacity-50">
          {r.isHidden ? 'Mostrar' : 'Ocultar'}
        </button>
        {error && <span role="alert" className="text-xs text-danger">{error}</span>}
      </div>
    </li>
  )
}
