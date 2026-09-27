import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AddressForm } from '../components/forms/AddressForm'
import { StatusBadge } from '../components/orders/OrderDetail'
import { ErrorState } from '../components/ui/ErrorState'
import {
  useCreateAddressMutation,
  useDeleteAddressMutation,
  useGetAddressesQuery,
  useMakeDefaultAddressMutation,
} from '../features/addresses/addressesApi'
import { formatAddress } from '../features/addresses/types'
import { useAuth } from '../features/auth/useAuth'
import { useSession } from '../features/auth/useSession'
import { useGetFavoritesQuery } from '../features/favorites/favoritesApi'
import { useGetOrdersQuery } from '../features/orders/ordersApi'
import { ProductCard, ProductCardSkeleton } from '../components/ui/ProductCard'
import { formatDate, formatMoney } from '../lib/format'
import { getErrorMessage } from '../services/api'

type Tab = 'pedidos' | 'favoritos' | 'direcciones'

const TAB_LABEL: Record<Tab, string> = { pedidos: 'Mis pedidos', favoritos: 'Favoritos', direcciones: 'Direcciones' }

export function AccountPage() {
  const { user } = useAuth()
  const session = useSession()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('pedidos')

  const logout = async () => {
    await session.logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 py-14 md:px-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">Mi cuenta</span>
          <h1 className="font-display text-6xl leading-none md:text-[72px]">Hola, {user?.firstName}</h1>
          <span className="text-sm text-muted">
            {user?.email}
            {user?.phone && ` · Cel. ${user.phone.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3')}`}
            {user?.birthDate && ` · Cumpleaños ${formatBirthday(user.birthDate)}`}
          </span>
        </div>
        <div className="flex gap-3">
          {user?.role === 'admin' && (
            <Link to="/admin" className="flex h-11 items-center bg-ink px-6 text-sm font-semibold text-bone no-underline hover:bg-olive">Panel de administración</Link>
          )}
          <button type="button" onClick={logout} className="h-11 border border-ink px-6 text-sm font-semibold">Cerrar sesión</button>
        </div>
      </div>

      <div role="tablist" aria-label="Secciones de mi cuenta" className="flex gap-8 border-b border-line">
        {(['pedidos', 'favoritos', 'direcciones'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`-mb-px h-12 border-b-2 text-sm font-semibold ${tab === t ? 'border-ink' : 'border-transparent text-muted'}`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      <div role="tabpanel" key={tab} className="animate-fade-in">
        {tab === 'pedidos' ? <Orders /> : tab === 'favoritos' ? <Favorites /> : <Addresses />}
      </div>
    </div>
  )
}

function Orders() {
  const { data: orders, isLoading, error, refetch } = useGetOrdersQuery()
  if (isLoading) return <p className="text-sm text-muted">Cargando…</p>
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
  if (!orders?.length) {
    return (
      <div className="flex flex-col items-start gap-4 bg-sand p-10">
        <p className="font-display text-3xl">Aún no tienes pedidos</p>
        <Link to="/tienda" className="text-sm font-semibold">Ir a la tienda</Link>
      </div>
    )
  }
  return (
    <ul className="flex flex-col">
      {orders.map((o) => (
        <li key={o.id}>
          <Link to={`/cuenta/pedidos/${o.id}`} className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-5 no-underline hover:bg-sand/60">
            <div className="flex flex-col gap-1">
              <span className="text-[15px] font-semibold">Pedido #{o.id}</span>
              <span className="text-[13px] text-muted">
                {formatDate(o.createdAt)} · {o.itemCount} {o.itemCount === 1 ? 'artículo' : 'artículos'}
              </span>
            </div>
            <div className="flex items-center gap-5">
              <StatusBadge status={o.status} />
              <span className="text-[15px] font-semibold">{formatMoney(o.totalCents)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Addresses() {
  const { data: addresses, isLoading } = useGetAddressesQuery()
  const [createAddress] = useCreateAddressMutation()
  const [makeDefault] = useMakeDefaultAddressMutation()
  const [deleteAddress] = useDeleteAddressMutation()
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isLoading) return <p className="text-sm text-muted">Cargando…</p>

  return (
    <div className="flex flex-col gap-8">
      {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
      {addresses && addresses.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className={`flex flex-col gap-3 p-6 ${a.isDefault ? 'border-[1.5px] border-ink' : 'border border-field'}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-semibold">{a.recipientName}</span>
                {a.isDefault && <span className="bg-linen px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase">Predeterminada</span>}
              </div>
              <span className="text-sm text-muted">{formatAddress(a)}</span>
              <span className="text-sm text-muted">Tel. {a.phone}</span>
              <div className="flex gap-5 pt-1 text-sm">
                {!a.isDefault && (
                  <button type="button" className="h-11 underline" onClick={() => makeDefault(a.id)}>Hacer predeterminada</button>
                )}
                <button type="button" className="h-11 text-danger underline" onClick={() => deleteAddress(a.id)}>Eliminar</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="max-w-[640px]">
          <AddressForm
            submitLabel="Guardar dirección"
            onSubmit={async (values) => {
              setError(null)
              try {
                await createAddress({ ...values, intNumber: values.intNumber || null }).unwrap()
                setAdding(false)
              } catch (err) {
                setError(getErrorMessage(err))
              }
            }}
            secondaryAction={<button type="button" className="h-11 text-sm underline" onClick={() => setAdding(false)}>Cancelar</button>}
          />
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="h-12 self-start border border-ink px-6 text-sm font-semibold">
          + Agregar dirección
        </button>
      )}
    </div>
  )
}

/** "1999-04-20" → "20 de abril" (sin año: no hace falta mostrar la edad) */
function formatBirthday(iso: string) {
  const [, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(Date.UTC(2000, m! - 1, d))
}

function Favorites() {
  const { data, isLoading, error, refetch } = useGetFavoritesQuery()
  if (error) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
  if (isLoading) {
    return <div className="grid grid-cols-2 gap-6 md:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}</div>
  }
  if (!data?.length) {
    return (
      <div className="flex flex-col items-start gap-4 bg-sand p-10">
        <p className="font-display text-3xl">Aún no guardas favoritos</p>
        <p className="text-sm text-muted">Toca el corazón de cualquier prenda para tenerla a la mano.</p>
        <Link to="/tienda" className="text-sm font-semibold">Ir a la tienda</Link>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
      {data.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}
