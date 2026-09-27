import type { ProductListItem } from '../../features/catalog/types'
import { useFavorites } from '../../features/favorites/useFavorites'

type Props = { product: ProductListItem | { id: string }; name: string; variant?: 'card' | 'page' }

/** Corazón de favoritos. En la tarjeta flota sobre la foto; en la ficha es un botón cuadrado. */
export function FavoriteButton({ product, name, variant = 'card' }: Props) {
  const { isFavorite, toggle } = useFavorites()
  const on = isFavorite(product.id)
  return (
    <button
      type="button"
      onClick={() => toggle(product)}
      aria-pressed={on}
      aria-label={on ? `Quitar ${name} de favoritos` : `Guardar ${name} en favoritos`}
      title={on ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={
        variant === 'card'
          ? 'flex size-10 items-center justify-center rounded-full bg-bone/90 shadow-sm backdrop-blur transition-transform duration-200 hover:scale-110'
          : `flex size-14 shrink-0 items-center justify-center border ${on ? 'border-ink' : 'border-field hover:border-ink'}`
      }
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className={`transition-all duration-300 ${on ? 'scale-110 text-danger' : 'text-ink'}`}>
        <path
          d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"
          fill={on ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
