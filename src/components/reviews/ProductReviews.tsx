import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from '../../features/auth/useAuth'
import {
  useDeleteReviewMutation,
  useGetReviewsQuery,
  useSaveReviewMutation,
  type Review,
  type ReviewSort,
  type ReviewSummary,
} from '../../features/reviews/reviewsApi'
import { formatDate } from '../../lib/format'
import { getErrorMessage } from '../../services/api'
import { ErrorState } from '../ui/ErrorState'
import { StarInput, Stars } from '../ui/Stars'

const SORTS: { value: ReviewSort; label: string }[] = [
  { value: 'recent', label: 'Más recientes' },
  { value: 'best', label: 'Mejor calificadas' },
  { value: 'worst', label: 'Peor calificadas' },
]

/** Sección de reseñas de la ficha: resumen, tu reseña y la lista. */
export function ProductReviews({ slug, productName }: { slug: string; productName: string }) {
  const [sort, setSort] = useState<ReviewSort>('recent')
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, error, refetch } = useGetReviewsQuery({ slug, sort, page })

  return (
    <section id="resenas" aria-labelledby="resenas-titulo" className="flex scroll-mt-28 flex-col gap-10 border-t border-line pt-16 mt-24">
      <h2 id="resenas-titulo" className="font-display text-5xl leading-none md:text-[52px]">Reseñas</h2>

      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : isLoading || !data ? (
        <p className="text-sm text-muted">Cargando reseñas…</p>
      ) : (
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="flex flex-col gap-8">
            <Summary summary={data.summary} />
            <MyReview slug={slug} productName={productName} mine={data.mine} />
          </div>

          <div className="flex flex-col gap-6">
            {data.summary.count > 0 && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted">{data.summary.count} {data.summary.count === 1 ? 'reseña' : 'reseñas'}</span>
                <label className="flex items-center gap-2.5 text-sm text-muted">
                  Ordenar
                  <select
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value as ReviewSort)
                      setPage(1)
                    }}
                    className="h-11 border border-field bg-white px-3 text-sm text-ink"
                  >
                    {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </label>
              </div>
            )}

            {data.items.length === 0 ? (
              <div className="flex flex-col items-start gap-2 bg-sand p-8">
                <p className="font-display text-3xl">Todavía no hay reseñas</p>
                <p className="text-sm text-muted">Sé la primera persona en contar qué tal te quedó.</p>
              </div>
            ) : (
              <ul className={`flex flex-col divide-y divide-line transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
                {data.items.map((r) => <ReviewItem key={r.id} review={r} />)}
              </ul>
            )}

            {data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-11 border border-field px-5 text-sm font-semibold disabled:opacity-40">Anteriores</button>
                <span className="text-sm text-muted">Página {data.page} de {data.totalPages}</span>
                <button type="button" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="h-11 border border-field px-5 text-sm font-semibold disabled:opacity-40">Siguientes</button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function Summary({ summary }: { summary: ReviewSummary }) {
  if (summary.count === 0 || summary.average === null) {
    return <p className="text-sm text-muted">Aún sin calificaciones.</p>
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-4">
        <span className="font-display text-7xl leading-none">{summary.average.toFixed(1)}</span>
        <div className="flex flex-col gap-1 pb-1.5">
          <Stars value={summary.average} size={20} />
          <span className="text-sm text-muted">{summary.count} {summary.count === 1 ? 'reseña' : 'reseñas'}</span>
        </div>
      </div>
      <ul className="flex flex-col gap-1.5" aria-label="Reseñas por estrellas">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const n = summary.distribution[String(star) as '5']
          const pct = summary.count ? Math.round((n / summary.count) * 100) : 0
          return (
            <li key={star} className="flex items-center gap-3 text-xs text-muted">
              <span className="w-12 shrink-0">{star} {star === 1 ? 'estrella' : 'estrellas'}</span>
              <span className="relative h-1.5 flex-1 overflow-hidden bg-sand" aria-hidden="true">
                <span className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-500" style={{ width: `${pct}%` }} />
              </span>
              <span className="w-8 shrink-0 text-right tabular-nums">{n}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ReviewItem({ review: r }: { review: Review }) {
  const edited = new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime() > 60_000
  return (
    <li className="flex animate-fade-in flex-col gap-2.5 py-6 first:pt-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stars value={r.rating} size={15} />
        {r.title && <span className="font-semibold">{r.title}</span>}
      </div>
      {r.comment && <p className="text-[15px] leading-relaxed whitespace-pre-line text-muted">{r.comment}</p>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
        <span className="font-semibold text-ink">{r.authorName}{r.isMine ? ' (tú)' : ''}</span>
        {r.verifiedPurchase && <span className="bg-[#dfe3d8] px-2 py-0.5 font-semibold text-olive">✓ Compra verificada</span>}
        <span>{formatDate(r.createdAt)}{edited ? ' · editada' : ''}</span>
      </div>
    </li>
  )
}

/** "Tu reseña": invitar a iniciar sesión, escribirla, verla o editarla. */
function MyReview({ slug, productName, mine }: { slug: string; productName: string; mine: Review | null }) {
  const { user } = useAuth()
  const location = useLocation()
  const [editing, setEditing] = useState(false)
  const [remove, removeState] = useDeleteReviewMutation()

  if (!user) {
    return (
      <div className="flex flex-col gap-3 border border-line bg-white p-5">
        <span className="font-semibold">¿Ya lo tienes?</span>
        <p className="text-sm text-muted">Inicia sesión para dejar tu reseña.</p>
        <Link to="/login" state={{ from: `${location.pathname}#resenas` }} className="flex h-11 items-center justify-center bg-ink text-sm font-semibold text-bone no-underline">
          Iniciar sesión
        </Link>
      </div>
    )
  }

  if (editing) return <ReviewForm slug={slug} productName={productName} initial={mine} onDone={() => setEditing(false)} />
  if (!mine) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="h-12 border border-ink text-sm font-semibold hover:bg-ink hover:text-bone">
        Escribir una reseña
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3 border border-line bg-white p-5">
      <span className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">Tu reseña</span>
      <Stars value={mine.rating} size={16} />
      {mine.title && <span className="font-semibold">{mine.title}</span>}
      {mine.comment && <p className="text-sm text-muted">{mine.comment}</p>}
      {mine.isHidden && <p className="bg-linen px-3 py-2 text-xs text-muted">La ocultamos por moderación; solo tú la ves.</p>}
      <div className="flex gap-4 text-sm">
        <button type="button" onClick={() => setEditing(true)} className="font-semibold underline">Editar</button>
        <button type="button" disabled={removeState.isLoading} onClick={() => void remove(slug)} className="text-danger underline disabled:opacity-50">Borrar</button>
      </div>
    </div>
  )
}

function ReviewForm({ slug, productName, initial, onDone }: { slug: string; productName: string; initial: Review | null; onDone: () => void }) {
  const [rating, setRating] = useState(initial?.rating ?? 0)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [comment, setComment] = useState(initial?.comment ?? '')
  const [error, setError] = useState<string | null>(null)
  const [save, saveState] = useSaveReviewMutation()

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (rating < 1) return setError('Elige de 1 a 5 estrellas')
    setError(null)
    try {
      await save({ slug, rating, title: title.trim() || null, comment: comment.trim() || null }).unwrap()
      onDone()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex animate-fade-in flex-col gap-4 border border-line bg-white p-5">
      <span className="font-semibold">¿Qué te pareció {productName}?</span>
      <StarInput value={rating} onChange={setRating} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="resena-titulo" className="text-[13px] font-semibold">Título <span className="font-normal text-subtle">(opcional)</span></label>
        <input id="resena-titulo" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Me encantó la tela" className="h-11 border border-field bg-white px-3 text-sm" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="resena-comentario" className="text-[13px] font-semibold">Comentario <span className="font-normal text-subtle">(opcional)</span></label>
        <textarea id="resena-comentario" value={comment} maxLength={2000} rows={4} onChange={(e) => setComment(e.target.value)} placeholder="¿Cómo te quedó la talla? ¿Qué tal la tela?" className="border border-field bg-white px-3 py-2 text-sm" />
        <span className="self-end text-xs text-subtle">{comment.length}/2000</span>
      </div>
      {error && <p role="alert" className="animate-fade-in text-sm font-medium text-danger">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saveState.isLoading} className="h-11 flex-1 bg-ink text-sm font-semibold text-bone hover:bg-olive disabled:opacity-60">
          {saveState.isLoading ? 'Publicando…' : initial ? 'Guardar cambios' : 'Publicar reseña'}
        </button>
        <button type="button" onClick={onDone} className="h-11 border border-field px-4 text-sm">Cancelar</button>
      </div>
    </form>
  )
}
