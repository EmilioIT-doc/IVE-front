import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ErrorState } from '../components/ui/ErrorState'
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon } from '../components/ui/icons'
import { ProductCard, ProductCardSkeleton } from '../components/ui/ProductCard'
import { useGetCategoriesQuery, useGetFilterOptionsQuery, useGetProductsQuery } from '../features/catalog/catalogApi'
import type { Gender, ProductFilters, SortOption } from '../features/catalog/types'
import { swatchFor } from '../lib/colors'
import { capitalize } from '../lib/format'
import { GENDERS, genderLabel, isGender, shopPath } from '../lib/gender'
import { getErrorMessage } from '../services/api'

const PAGE_SIZE = 12
const SORTS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Más nuevos' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
]

const list = (v: string | null) => (v ? v.split(',').filter(Boolean) : [])
const pesosToCents = (v: string | null) => (v && /^\d+$/.test(v) ? Number(v) * 100 : undefined)

/**
 * /tienda/:first/:second → para quién y/o categoría.
 *   /tienda/mujer → { gender: 'mujer' }   /tienda/gym → { category: 'gym' }
 *   /tienda/mujer/gym → las dos
 */
function parseSection(first?: string, second?: string): { gender?: Gender; category?: string } {
  if (second) return { gender: isGender(first) ? first : undefined, category: second }
  if (isGender(first)) return { gender: first }
  return { category: first }
}

export function CatalogPage() {
  const { first, second } = useParams()
  const { gender, category } = parseSection(first, second)
  const [params, setParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)

  // Los filtros viven en la URL: se pueden compartir, recargar y usar "atrás".
  const filters: ProductFilters = {
    category,
    gender,
    sale: params.get('oferta') === '1',
    size: list(params.get('size')),
    color: list(params.get('color')),
    minPriceCents: pesosToCents(params.get('min')),
    maxPriceCents: pesosToCents(params.get('max')),
    q: params.get('q') ?? undefined,
    sort: (params.get('sort') as SortOption | null) ?? 'newest',
    page: Number(params.get('page')) || 1,
    limit: PAGE_SIZE,
  }

  const products = useGetProductsQuery(filters)
  const { data: categories } = useGetCategoriesQuery()
  const { data: options } = useGetFilterOptionsQuery()
  const found = categories?.find((c) => c.slug === category)

  /** Cambia (o borra) un parámetro y regresa a la página 1. */
  const update = (changes: Record<string, string | null>) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === '') next.delete(key)
        else next.set(key, value)
      }
      if (!('page' in changes)) next.delete('page')
      return next
    })
  }

  const toggleIn = (key: 'size' | 'color', value: string) => {
    const current = list(params.get(key))
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    update({ [key]: next.join(',') })
  }

  const chips = (() => {
    const c: { label: string; onRemove: () => void }[] = []
    for (const s of list(params.get('size'))) c.push({ label: `Talla ${s}`, onRemove: () => toggleIn('size', s) })
    for (const s of list(params.get('color'))) c.push({ label: capitalize(s), onRemove: () => toggleIn('color', s) })
    const min = params.get('min')
    const max = params.get('max')
    if (min || max) {
      c.push({ label: `Precio ${min ? `desde $${min}` : ''} ${max ? `hasta $${max}` : ''}`.trim(), onRemove: () => update({ min: null, max: null }) })
    }
    if (params.get('oferta') === '1') c.push({ label: 'En oferta', onRemove: () => update({ oferta: null }) })
    const q = params.get('q')
    if (q) c.push({ label: `“${q}”`, onRemove: () => update({ q: null }) })
    return c
  })()

  const title = found?.name ?? (gender ? genderLabel(gender) : filters.q ? 'Resultados' : 'Toda la tienda')
  const keepSearch = (() => {
    const s = new URLSearchParams(params)
    s.delete('page')
    const str = s.toString()
    return str ? `?${str}` : ''
  })()

  return (
    <div className="mx-auto max-w-[1440px] px-4 md:px-16">
      <section className="flex flex-col gap-4 pt-10 pb-12">
        <nav aria-label="Migas de pan" className="flex gap-2 text-[13px] text-muted">
          <Link to="/" className="text-muted no-underline hover:underline">Inicio</Link>
          <span aria-hidden="true">/</span>
          {gender && found ? (
            <>
              <Link to={shopPath(gender)} className="text-muted no-underline hover:underline">{genderLabel(gender)}</Link>
              <span aria-hidden="true">/</span>
            </>
          ) : null}
          <span className="text-ink">{found?.name ?? (gender ? genderLabel(gender) : 'Tienda')}</span>
        </nav>
        <h1 className="font-display text-6xl leading-none md:text-[72px]">
          {gender && found ? <span className="text-muted">{genderLabel(gender)} · </span> : null}
          {title}
        </h1>
      </section>

      <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-16">
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          className="h-11 self-start border border-field px-4 text-sm font-semibold md:hidden"
        >
          {showFilters ? 'Ocultar filtros' : 'Filtros'}
        </button>

        {/* Filtros */}
        <div
          className={`grid w-full shrink-0 transition-[grid-template-rows,opacity] duration-300 ease-out md:w-[260px] md:grid-rows-[1fr] md:opacity-100 ${showFilters ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        >
        <aside aria-label="Filtros" className="flex min-h-0 flex-col overflow-hidden md:overflow-visible">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <span className="text-[13px] font-bold tracking-[0.12em] uppercase">Filtros</span>
            <Link to={shopPath(gender, category)} className="flex h-11 items-center text-[13px] text-muted">
              Limpiar
            </Link>
          </div>

          <FilterGroup title="Para">
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <Link to={`${shopPath(undefined, category)}${keepSearch}`} className={`no-underline hover:underline ${!gender ? 'font-bold' : ''}`}>Todos</Link>
              </li>
              {GENDERS.map((g) => (
                <li key={g.slug}>
                  <Link
                    to={`${shopPath(g.slug, category)}${keepSearch}`}
                    aria-current={gender === g.slug ? 'page' : undefined}
                    className={`no-underline hover:underline ${gender === g.slug ? 'font-bold' : ''}`}
                  >
                    {g.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="pt-3 text-xs text-subtle">Mujer y Hombre incluyen los diseños unisex.</p>
          </FilterGroup>

          <FilterGroup title="Categoría">
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <Link to={`${shopPath(gender)}${keepSearch}`} className={`no-underline hover:underline ${!category ? 'font-bold' : ''}`}>Todo</Link>
              </li>
              {categories?.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`${shopPath(gender, c.slug)}${keepSearch}`}
                    aria-current={category === c.slug ? 'page' : undefined}
                    className={`no-underline hover:underline ${category === c.slug ? 'font-bold' : ''}`}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </FilterGroup>

          <FilterGroup title="Ofertas">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input type="checkbox" className="size-[18px]" checked={params.get('oferta') === '1'} onChange={(e) => update({ oferta: e.target.checked ? '1' : null })} />
              Solo lo que está en oferta
            </label>
          </FilterGroup>

          <FilterGroup title="Talla">
            <div className="grid grid-cols-4 gap-2">
              {options?.sizes.map((size) => {
                const active = filters.size!.includes(size)
                return (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleIn('size', size)}
                    className={`h-11 border text-[13px] ${active ? 'border-ink bg-ink font-semibold text-bone' : 'border-field font-medium hover:border-ink'}`}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
          </FilterGroup>

          <FilterGroup title="Color">
            <div className="flex flex-col gap-1">
              {options?.colors.map((color) => {
                const active = filters.color!.includes(color)
                return (
                  <button
                    key={color}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleIn('color', color)}
                    className="flex h-10 items-center gap-3 text-left text-sm"
                  >
                    <span
                      className={`size-[26px] rounded-full border border-ink/20 ${active ? 'ring-2 ring-ink ring-offset-2 ring-offset-bone' : ''}`}
                      style={{ backgroundColor: swatchFor(color) }}
                    />
                    <span className={active ? 'font-semibold' : ''}>{capitalize(color)}</span>
                  </button>
                )
              })}
            </div>
          </FilterGroup>

          <FilterGroup title="Precio" last>
            <PriceForm
              key={`${params.get('min')}-${params.get('max')}`}
              min={params.get('min') ?? ''}
              max={params.get('max') ?? ''}
              placeholderMax={options ? String(Math.ceil(options.maxPriceCents / 100)) : ''}
              onApply={(min, max) => update({ min, max })}
            />
          </FilterGroup>
        </aside>
        </div>

        {/* Resultados */}
        <section className="flex min-w-0 flex-1 flex-col gap-6" aria-labelledby="resultados">
          <div className="flex min-h-11 flex-wrap items-center justify-between gap-4">
            <span id="resultados" className="text-sm text-muted" aria-live="polite">
              {products.data ? `${products.data.total} ${products.data.total === 1 ? 'producto' : 'productos'}` : ' '}
            </span>
            <div className="flex items-center gap-2.5">
              <label htmlFor="orden" className="text-sm text-muted">Ordenar por</label>
              <select
                id="orden"
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value === 'newest' ? null : e.target.value })}
                className="h-11 border border-field bg-white px-3 text-sm"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="flex animate-fade-in flex-wrap gap-2">
              {chips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={chip.onRemove}
                  aria-label={`Quitar filtro ${chip.label}`}
                  className="flex h-9 items-center gap-2 bg-linen pr-3 pl-3.5 text-[13px] font-medium"
                >
                  {chip.label} <CloseIcon size={14} strokeWidth={2} />
                </button>
              ))}
            </div>
          )}

          {products.error ? (
            <ErrorState message={getErrorMessage(products.error)} onRetry={products.refetch} />
          ) : products.isLoading ? (
            <Grid>{Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />)}</Grid>
          ) : products.data && products.data.items.length > 0 ? (
            <div className={products.isFetching ? 'opacity-60 transition-opacity' : ''}>
              <Grid>{products.data.items.map((p) => <ProductCard key={p.id} product={p} />)}</Grid>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-4 bg-sand p-10">
              <p className="font-display text-3xl">No encontramos productos con esos filtros</p>
              <Link to="/tienda" className="text-sm font-semibold">Ver toda la tienda</Link>
            </div>
          )}

          {products.data && products.data.totalPages > 1 && (
            <Pagination
              page={products.data.page}
              totalPages={products.data.totalPages}
              onChange={(page) => update({ page: page === 1 ? null : String(page) })}
            />
          )}
        </section>
      </div>
    </div>
  )
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-11 lg:grid-cols-3">{children}</div>
}

function FilterGroup({ title, children, last }: { title: string; children: ReactNode; last?: boolean }) {
  return (
    <fieldset className={`flex flex-col gap-3.5 py-6 ${last ? '' : 'border-b border-line'}`}>
      <legend className="float-left mb-3.5 w-full text-sm font-semibold">{title}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  )
}

function PriceForm(props: { min: string; max: string; placeholderMax: string; onApply: (min: string | null, max: string | null) => void }) {
  const [min, setMin] = useState(props.min)
  const [max, setMax] = useState(props.max)
  const onlyDigits = (v: string) => v.replace(/\D/g, '') // regex: solo números

  const submit = (e: FormEvent) => {
    e.preventDefault()
    props.onApply(min || null, max || null)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="precio-min" className="text-xs text-muted">Mínimo ($)</label>
          <input id="precio-min" inputMode="numeric" value={min} onChange={(e) => setMin(onlyDigits(e.target.value))} placeholder="0" className="h-11 border border-field bg-white px-3 text-sm" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="precio-max" className="text-xs text-muted">Máximo ($)</label>
          <input id="precio-max" inputMode="numeric" value={max} onChange={(e) => setMax(onlyDigits(e.target.value))} placeholder={props.placeholderMax} className="h-11 border border-field bg-white px-3 text-sm" />
        </div>
      </div>
      <button type="submit" className="h-11 border border-ink text-sm font-semibold">Aplicar</button>
    </form>
  )
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-2 pt-14">
      <button type="button" aria-label="Página anterior" disabled={page <= 1} onClick={() => onChange(page - 1)} className="flex size-11 items-center justify-center border border-line disabled:text-field">
        <ArrowLeftIcon size={18} />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          aria-current={p === page ? 'page' : undefined}
          onClick={() => onChange(p)}
          className={`size-11 text-sm font-semibold ${p === page ? 'bg-ink text-bone' : 'hover:bg-sand'}`}
        >
          {p}
        </button>
      ))}
      <button type="button" aria-label="Página siguiente" disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="flex size-11 items-center justify-center border border-line disabled:text-field">
        <ArrowRightIcon size={18} />
      </button>
    </nav>
  )
}

