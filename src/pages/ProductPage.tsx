import { useEffect, useId, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { ErrorState } from '../components/ui/ErrorState'
import { ProductReviews } from '../components/reviews/ProductReviews'
import { FavoriteButton } from '../components/ui/FavoriteButton'
import { ChevronDownIcon, ReturnIcon, TruckIcon } from '../components/ui/icons'
import { Price } from '../components/ui/Price'
import { SizeCalculator } from '../components/ui/SizeCalculator'
import { Stars } from '../components/ui/Stars'
import { ProductCard, ProductCardSkeleton } from '../components/ui/ProductCard'
import { ProductGallery } from '../components/ui/ProductGallery'
import { ProductImage } from '../components/ui/ProductImage'
import { QuantityStepper } from '../components/ui/QuantityStepper'
import { useCart } from '../features/cart/useCart'
import { useGetProductQuery, useGetRelatedProductsQuery, useRegisterViewMutation } from '../features/catalog/catalogApi'
import { useGetReviewsQuery } from '../features/reviews/reviewsApi'
import type { ProductDetail } from '../features/catalog/types'
import { swatchFor } from '../lib/colors'
import { shouldSendView } from '../lib/viewOnce'
import { capitalize, formatMoney } from '../lib/format'
import { genderLabel } from '../lib/gender'
import { FREE_SHIPPING_FROM_CENTS } from '../lib/shipping'
import { getErrorMessage } from '../services/api'
import { NotFoundPage } from './NotFoundPage'

export function ProductPage() {
  const { slug = '' } = useParams()
  const { data: product, isLoading, error, refetch } = useGetProductQuery(slug)

  if (isLoading) return <ProductSkeleton />
  if (error) {
    if ('status' in error && error.status === 404) return <NotFoundPage />
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-16 md:px-16">
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      </div>
    )
  }
  if (!product) return null

  // key={slug}: al navegar a otro producto, React crea el componente de cero
  // y su estado (color, talla, cantidad) se reinicia solo.
  return <ProductView key={product.slug} product={product} />
}

function ProductView({ product }: { product: ProductDetail }) {
  const cart = useCart()
  const stockOf = (color: string, size: string) =>
    product.variants.find((v) => v.color === color && v.size === size)?.stock ?? 0
  const hasStock = (color: string) => product.sizes.some((s) => stockOf(color, s) > 0)

  // Selección inicial: el primer color y talla que tengan stock
  const [color, setColor] = useState(() => product.colors.find(hasStock) ?? product.colors[0] ?? '')
  const [size, setSize] = useState<string | null>(() => product.sizes.find((s) => stockOf(color, s) > 0) ?? null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [sizeHelp, setSizeHelp] = useState(false)
  const [views, setViews] = useState(product.viewCount)
  const [registerView] = useRegisterViewMutation()
  const reviews = useGetReviewsQuery({ slug: product.slug, sort: 'recent', page: 1 })
  const summary = reviews.data?.summary

  // Cuenta la visita (el back ignora recargas del mismo navegador durante 30 min)
  useEffect(() => {
    if (!shouldSendView(product.slug)) return
    registerView(product.slug)
      .unwrap()
      .then((r) => setViews(r.viewCount))
      .catch(() => undefined)
  }, [product.slug, registerView])

  const variant = size ? product.variants.find((v) => v.color === color && v.size === size) : undefined
  const available = variant?.stock ?? 0
  const priceCents = variant?.priceCents ?? product.priceCents

  let stockText = 'Elige una talla'
  let lowStock = false
  if (size) {
    if (available === 0) {
      stockText = `Agotado en talla ${size}`
      lowStock = true
    } else if (available <= 3) {
      stockText = available === 1 ? `Última pieza en talla ${size}` : `Quedan ${available} piezas en talla ${size}`
      lowStock = true
    } else {
      stockText = 'Disponible'
    }
  }

  const pickColor = (c: string) => {
    setColor(c)
    setQty(1)
    // Si la talla elegida no existe en el nuevo color, se quita
    if (size && stockOf(c, size) === 0) setSize(null)
  }

  const addToBag = async () => {
    if (!variant || available === 0) return
    setAdding(true)
    setAddError(null)
    const error = await cart.add({
      variantId: variant.id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      quantity: qty,
      stock: variant.stock,
      unitPriceCents: variant.priceCents,
      product: { name: product.name, slug: product.slug, imageUrl: product.images[0]?.url ?? null },
    })
    setAdding(false)
    if (error) {
      setAddError(error)
      return
    }
    setAdded(true)
    cart.open()
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 md:px-16">
      <nav aria-label="Migas de pan" className="flex flex-wrap gap-2 py-6 text-[13px] text-muted">
        <Link to="/" className="text-muted no-underline hover:underline">Inicio</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/tienda/${product.category.slug}`} className="text-muted no-underline hover:underline">
          {product.category.name}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <section className="grid grid-cols-1 items-start gap-10 md:grid-cols-12 md:gap-6">
        {/* Galería */}
        <div className="md:col-span-7">
          {product.images.length > 0 ? (
            <ProductGallery images={product.images} productName={product.name} />
          ) : (
            <ProductImage src={null} alt={`${product.name} en color ${color}`} seed={`${product.slug}-${color}`} label={`${product.name} · ${capitalize(color)}`} />
          )}
        </div>

        {/* Información */}
        <div className="flex flex-col gap-7 md:sticky md:top-28 md:col-span-5 md:pl-10">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
              {product.category.name} · {genderLabel(product.gender)}
            </span>
            <h1 className="font-display text-5xl leading-none md:text-[60px]">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
              {summary && summary.count > 0 && summary.average !== null ? (
                <a href="#resenas" className="flex items-center gap-2 text-muted no-underline hover:underline">
                  <Stars value={summary.average} size={15} /> {summary.average.toFixed(1)} · {summary.count} {summary.count === 1 ? 'reseña' : 'reseñas'}
                </a>
              ) : (
                <a href="#resenas" className="text-muted">Sé la primera reseña</a>
              )}
              <span className="flex items-center gap-1.5" title="Veces que han visto este producto">
                <EyeIcon /> Visto {views.toLocaleString('es-MX')} {views === 1 ? 'vez' : 'veces'}
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              {/* Si la variante tiene precio especial propio, no mostramos el "antes" del producto */}
              <Price size="lg" priceCents={priceCents} compareAtCents={priceCents === product.priceCents ? product.compareAtCents : null} />
              <span className="text-[13px] text-muted">IVA incluido</span>
            </div>
          </div>

          {product.description && <p className="text-[15px] leading-relaxed text-muted">{product.description}</p>}

          {/* Color */}
          <div className="flex flex-col gap-3.5 border-t border-line pt-6">
            <span className="text-sm"><strong className="font-semibold">Color:</strong> {capitalize(color)}</span>
            <div role="group" aria-label="Color" className="flex gap-2">
              {product.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={capitalize(c)}
                  aria-pressed={c === color}
                  onClick={() => pickColor(c)}
                  className="flex size-11 items-center justify-center"
                >
                  <span
                    className={`rounded-full border border-ink/20 ${c === color ? 'size-[30px] ring-2 ring-ink ring-offset-[3px] ring-offset-bone' : 'size-8'} ${hasStock(c) ? '' : 'opacity-40'}`}
                    style={{ backgroundColor: swatchFor(c) }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Talla */}
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm"><strong className="font-semibold">Talla:</strong> {size ?? '—'}</span>
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setSizeHelp(true)} className="flex items-center gap-1.5 text-[13px] font-semibold underline underline-offset-4">
                  <RulerIcon /> Calcular mi talla
                </button>
                <Link to="/ayuda/tallas" className="text-[13px] text-muted">Guía de tallas</Link>
              </div>
            </div>
            <div role="group" aria-label="Talla" className="grid grid-cols-4 gap-2">
              {product.sizes.map((s) => {
                const soldOut = stockOf(color, s) === 0
                const selected = s === size
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={soldOut}
                    aria-pressed={selected}
                    aria-label={soldOut ? `${s}, agotada` : s}
                    onClick={() => {
                      setSize(s)
                      setQty(1)
                    }}
                    className={`h-[52px] border text-sm ${
                      soldOut
                        ? 'border-dashed border-field bg-[#ede9e2] text-[#8a857c] line-through'
                        : selected
                          ? 'border-ink bg-ink font-semibold text-bone'
                          : 'border-field font-medium hover:border-ink'
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
            <p className={`flex items-center gap-2 text-[13px] font-medium ${lowStock ? 'text-warn' : size ? 'text-olive' : 'text-muted'}`} aria-live="polite">
              <span className="size-2 rounded-full bg-current" aria-hidden="true" />
              {stockText}
            </p>
          </div>

          {/* Cantidad + agregar */}
          <div className="flex gap-3">
            <QuantityStepper label="Cantidad" value={qty} max={Math.max(1, Math.min(available, 20))} onChange={setQty} />
            <button
              type="button"
              onClick={addToBag}
              disabled={!variant || available === 0 || adding}
              className="h-14 flex-1 bg-ink text-sm font-semibold tracking-[0.08em] text-bone uppercase disabled:bg-[#d8d3ca] disabled:text-[#5e5a53]"
            >
              {!size ? 'Elige una talla' : available === 0 ? 'Agotado' : adding ? 'Agregando…' : added ? 'Agregar otra vez' : 'Agregar a la bolsa'}
            </button>
            <FavoriteButton variant="page" product={{ id: product.id }} name={product.name} />
          </div>

          {addError && (
            <p role="alert" className="-mt-3 animate-fade-in text-sm font-medium text-danger">
              {addError}
            </p>
          )}

          <div className="flex flex-col gap-2.5 text-[13px] text-muted">
            <p className="flex items-center gap-2.5"><TruckIcon size={18} /> Envío gratis en compras mayores a {formatMoney(FREE_SHIPPING_FROM_CENTS)}</p>
            <p className="flex items-center gap-2.5"><ReturnIcon size={18} /> Cambios en 30 días</p>
            {variant && <p className="pt-1 text-xs tracking-wide text-subtle">SKU: {variant.sku}</p>}
          </div>

          <div className="border-t border-line">
            <Accordion title="Detalles" open>
              {product.description ?? 'Sin descripción.'}
            </Accordion>
            <Accordion title="Envíos y cambios">
              Entrega de 3 a 5 días hábiles. Cambios gratis dentro de los primeros 30 días.
            </Accordion>
          </div>
        </div>
      </section>

      <ProductReviews slug={product.slug} productName={product.name} />

      <Related slug={product.slug} />

      {sizeHelp && (
        <SizeCalculator
          sizes={product.sizes}
          gender={product.gender}
          onClose={() => setSizeHelp(false)}
          onPick={(s) => {
            if (stockOf(color, s) > 0) {
              setSize(s)
              setQty(1)
            }
          }}
        />
      )}
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function RulerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <rect x="2" y="8" width="20" height="8" rx="1" />
      <path d="M6 8v3M10 8v4M14 8v3M18 8v4" />
    </svg>
  )
}

/** Acordeón con animación de altura (truco de grid: 0fr → 1fr). */
function Accordion({ title, open = false, children }: { title: string; open?: boolean; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(open)
  const id = useId()
  return (
    <div className="border-b border-line">
      <h3>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={id}
          onClick={() => setIsOpen((v) => !v)}
          className="flex min-h-14 w-full items-center justify-between text-left text-[15px] font-semibold"
        >
          {title}
          <ChevronDownIcon size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </h3>
      <div
        id={id}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden" inert={!isOpen}>
          <div className="pb-5 text-sm leading-relaxed text-muted">{children}</div>
        </div>
      </div>
    </div>
  )
}

function Related({ slug }: { slug: string }) {
  const { data, isLoading } = useGetRelatedProductsQuery({ slug, limit: 4 })
  if (!isLoading && (!data || data.length === 0)) return null
  return (
    <section className="flex flex-col gap-10 pt-30">
      <h2 className="font-display text-5xl leading-none md:text-[52px]">También te puede gustar</h2>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {isLoading ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />) : data!.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  )
}

function ProductSkeleton() {
  return (
    <div className="mx-auto grid max-w-[1440px] animate-pulse grid-cols-1 gap-10 px-4 pt-20 md:grid-cols-12 md:px-16" aria-busy="true">
      <div className="aspect-[3/4] bg-sand md:col-span-7" />
      <div className="flex flex-col gap-4 md:col-span-5 md:pl-10">
        <div className="h-4 w-32 bg-sand" />
        <div className="h-14 w-3/4 bg-sand" />
        <div className="h-6 w-24 bg-sand" />
        <div className="h-32 w-full bg-sand" />
      </div>
    </div>
  )
}
