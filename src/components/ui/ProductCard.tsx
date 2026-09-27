import { Link } from 'react-router'
import type { ProductListItem } from '../../features/catalog/types'
import { capitalize } from '../../lib/format'
import { discountPercent } from '../../lib/pricing'
import { FavoriteButton } from './FavoriteButton'
import { Price } from './Price'
import { ProductImage } from './ProductImage'
import { Stars } from './Stars'

export function ProductCard({ product }: { product: ProductListItem }) {
  const colors = product.colors.map(capitalize).join(', ')
  const off = discountPercent(product.priceCents, product.compareAtCents)
  // El corazón va FUERA del <Link>: un botón dentro de un enlace es HTML inválido
  // y al darle clic también te llevaría a la ficha.
  return (
    <div className="group relative">
    <Link to={`/producto/${product.slug}`} className="flex flex-col gap-3.5 no-underline">
      <div className="relative overflow-hidden">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          seed={product.slug}
          className="transition-transform duration-500 group-hover:scale-[1.02]"
        />

        {/* Hover: la segunda foto (la espalda) aparece encima con un fundido */}
        {product.hoverImageUrl && (
          <img
            src={product.hoverImageUrl}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full bg-white object-contain opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
          />
        )}

        <div className="absolute top-4 left-4 flex flex-col items-start gap-1.5">
          {off > 0 && <span className="bg-danger px-2.5 py-1 text-[11px] font-semibold tracking-widest text-bone uppercase">Oferta −{off}%</span>}
          {product.isNew && <span className="bg-bone px-2.5 py-1 text-[11px] font-semibold tracking-widest uppercase">Nuevo</span>}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between gap-3 text-[15px]">
          <span className="font-semibold group-hover:underline">{product.name}</span>
          <span className="shrink-0 text-right"><Price priceCents={product.priceCents} compareAtCents={product.compareAtCents} showBadge={false} /></span>
        </div>
        <span className="text-[13px] text-muted">{colors}</span>
        {product.reviewCount > 0 && product.ratingAverage !== null && (
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Stars value={product.ratingAverage} size={13} /> {product.ratingAverage.toFixed(1)} ({product.reviewCount})
          </span>
        )}
      </div>
    </Link>
    <div className="absolute top-3 right-3">
      <FavoriteButton product={product} name={product.name} />
    </div>
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-3.5" aria-hidden="true">
      <div className="aspect-[3/4] w-full bg-sand" />
      <div className="h-4 w-3/4 bg-sand" />
      <div className="h-3 w-1/2 bg-sand" />
    </div>
  )
}
