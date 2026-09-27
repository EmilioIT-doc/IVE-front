import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ErrorState } from '../../components/ui/ErrorState'
import { ArrowDownIcon, ArrowUpIcon } from '../../components/ui/icons'
import { useCreateCategoryMutation, useGetAdminCategoriesQuery, useReorderCategoriesMutation } from '../../features/admin/adminApi'
import { categoryNameSchema } from '../../features/admin/categoryForm'
import { toneFor } from '../../lib/colors'
import { framingStyle } from '../../lib/framing'
import { getErrorMessage } from '../../services/api'

/** /admin/categorias: lista, orden (el del home) y alta rápida. */
export function AdminCategoriesPage() {
  const navigate = useNavigate()
  const { data: categories, isLoading, error, refetch } = useGetAdminCategoriesQuery()
  const [createCategory, createState] = useCreateCategoryMutation()
  const [reorder, reorderState] = useReorderCategoriesMutation()
  const [name, setName] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  const onCreate = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = categoryNameSchema.safeParse(name)
    if (!parsed.success) return setFormError(parsed.error.issues[0]!.message)
    setFormError(null)
    try {
      const category = await createCategory({ name: parsed.data, isActive: true }).unwrap()
      // Directo a su edición para subirle la portada
      navigate(`/admin/categorias/${category.id}`, { state: { created: true } })
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  const move = async (index: number, delta: number) => {
    if (!categories) return
    const ids = categories.map((c) => c.id)
    const target = index + delta
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target]!, ids[index]!]
    setListError(null)
    try {
      await reorder(ids).unwrap()
    } catch (err) {
      setListError(getErrorMessage(err))
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-5xl leading-none">Categorías</h1>
        <p className="text-sm text-muted">El orden de esta lista es el orden en el home y en los filtros de la tienda.</p>
      </div>

      <form onSubmit={onCreate} noValidate className="flex flex-col gap-2 border border-line bg-white p-5">
        <label htmlFor="nueva-categoria" className="text-[13px] font-semibold">Nueva categoría</label>
        <div className="flex flex-wrap gap-3">
          <input
            id="nueva-categoria"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Oversize"
            aria-invalid={formError ? true : undefined}
            className={`h-12 min-w-0 flex-1 bg-white px-4 text-[15px] ${formError ? 'border-[1.5px] border-danger' : 'border border-field'}`}
          />
          <button type="submit" disabled={createState.isLoading} className="h-12 bg-ink px-6 text-sm font-semibold text-bone hover:bg-olive disabled:opacity-60">
            {createState.isLoading ? 'Creando…' : 'Agregar'}
          </button>
        </div>
        {formError && <p role="alert" className="animate-fade-in text-sm font-medium text-danger">{formError}</p>}
      </form>

      {listError && <p role="alert" className="animate-fade-in text-sm font-medium text-danger">{listError}</p>}

      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : isLoading ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : (
        <ol className={`flex flex-col divide-y divide-line border border-line bg-white transition-opacity ${reorderState.isLoading ? 'opacity-60' : ''}`}>
          {categories?.map((c, i) => (
            <li key={c.id} className="flex animate-fade-in items-center gap-4 px-4 py-3">
              <div className="flex shrink-0 flex-col gap-1">
                <button type="button" aria-label={`Subir ${c.name}`} disabled={i === 0} onClick={() => void move(i, -1)} className="flex size-8 items-center justify-center border border-field hover:border-ink disabled:opacity-30">
                  <ArrowUpIcon size={14} />
                </button>
                <button type="button" aria-label={`Bajar ${c.name}`} disabled={i === categories.length - 1} onClick={() => void move(i, 1)} className="flex size-8 items-center justify-center border border-field hover:border-ink disabled:opacity-30">
                  <ArrowDownIcon size={14} />
                </button>
              </div>

              <div className="h-[60px] w-12 shrink-0 overflow-hidden ring-1 ring-line" style={c.coverUrl ? undefined : { backgroundColor: toneFor(c.slug) }}>
                {c.coverUrl && <img src={c.coverUrl} alt="" className="h-full w-full" style={framingStyle(c.coverFraming)} />}
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold">{c.name}</span>
                <span className="text-xs text-subtle">
                  /tienda/{c.slug} · {c.productCount} {c.productCount === 1 ? 'producto' : 'productos'}
                  {c.productCount !== c.activeProductCount ? ` (${c.activeProductCount} visibles)` : ''}
                  {c.coverUrl ? '' : ' · sin portada'}
                </span>
              </div>

              <span className={`shrink-0 px-2 py-1 text-[11px] font-semibold tracking-wide uppercase ${c.isActive ? 'bg-[#dfe3d8] text-olive' : 'bg-linen text-muted'}`}>
                {c.isActive ? 'Visible' : 'Oculta'}
              </span>
              <Link to={`/admin/categorias/${c.id}`} className="shrink-0 text-sm font-semibold">Editar</Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
