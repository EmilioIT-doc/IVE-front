import { Link, NavLink } from 'react-router'
import { useAuth } from '../../features/auth/useAuth'
import { useCart } from '../../features/cart/useCart'
import { formatMoney } from '../../lib/format'
import { GENDERS, shopPath } from '../../lib/gender'
import { FREE_SHIPPING_FROM_CENTS } from '../../lib/shipping'
import { BagIcon, SearchIcon, UserIcon } from '../ui/icons'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium tracking-wide no-underline hover:text-olive ${isActive ? 'underline underline-offset-8' : ''}`

export function Header() {
  const cart = useCart()
  const { user } = useAuth()

  return (
    <>
      <div className="flex h-9 items-center justify-center bg-ink px-4 text-center text-xs font-medium tracking-[0.12em] text-bone uppercase">
        Envío gratis en compras mayores a {formatMoney(FREE_SHIPPING_FROM_CENTS)}
      </div>
      <header className="sticky top-0 z-30 border-b border-line bg-bone/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center px-4 md:px-16">
          <nav aria-label="Principal" className="hidden flex-1 gap-9 md:flex">
            <NavLinks />
          </nav>

          <Link
            to="/"
            aria-label="IVE, inicio"
            className="font-display text-4xl leading-none tracking-[0.3em] no-underline md:pl-[0.3em]"
          >
            IVE
          </Link>

          <div className="flex flex-1 items-center justify-end gap-1">
            {user?.role === 'admin' && (
              <Link to="/admin" className="hidden h-11 items-center px-2.5 text-[13px] font-semibold tracking-wide no-underline hover:text-olive sm:flex">
                Panel admin
              </Link>
            )}
            <Link to="/tienda" aria-label="Buscar en la tienda" className="flex size-11 items-center justify-center">
              <SearchIcon />
            </Link>
            <Link
              to={user ? '/cuenta' : '/login'}
              aria-label={user ? `Mi cuenta (${user.firstName})` : 'Iniciar sesión'}
              className="flex h-11 items-center gap-2 px-2.5 text-[13px] font-semibold no-underline"
            >
              <UserIcon />
              {user && <span className="hidden lg:inline">{user.firstName}</span>}
            </Link>
            <button
              type="button"
              onClick={cart.open}
              aria-label={`Bolsa, ${cart.count} ${cart.count === 1 ? 'artículo' : 'artículos'}`}
              className="flex h-11 items-center gap-1.5 px-1.5"
            >
              <BagIcon />
              <span className="text-[13px] font-semibold">{cart.count}</span>
            </button>
          </div>
        </div>
        {/* En celular, la navegación baja a una segunda fila */}
        <nav aria-label="Principal (móvil)" className="flex gap-6 overflow-x-auto border-t border-line px-4 py-3 md:hidden">
          <NavLinks />
        </nav>
      </header>
    </>
  )
}

/** Mujer · Hombre · Unisex · Novedades (las categorías se eligen dentro de la tienda y en el home) */
function NavLinks() {
  return (
    <>
      {GENDERS.map((g) => (
        <NavLink key={g.slug} to={shopPath(g.slug)} className={navLinkClass}>
          {g.label}
        </NavLink>
      ))}
      <NavLink to="/tienda" end className={navLinkClass}>
        Novedades
      </NavLink>
    </>
  )
}
