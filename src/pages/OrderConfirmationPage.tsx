import { Link, useParams } from 'react-router'
import { ErrorState } from '../components/ui/ErrorState'
import { OrderDetail } from '../components/orders/OrderDetail'
import { useAuth } from '../features/auth/useAuth'
import { useGetOrderQuery } from '../features/orders/ordersApi'
import { getErrorMessage } from '../services/api'

export function OrderConfirmationPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const { data: order, isLoading, error } = useGetOrderQuery(id)

  if (isLoading) return <p className="px-4 py-24 text-center text-sm text-muted">Cargando tu pedido…</p>
  if (error || !order) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-16 md:px-16">
        <ErrorState message={getErrorMessage(error, 'No encontramos este pedido')} />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-12 px-4 py-16 md:px-16">
      <div className="flex flex-col items-start gap-6">
        <span className="flex size-16 items-center justify-center rounded-full bg-ink text-bone">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
        </span>
        <h1 className="font-display text-5xl leading-none md:text-[64px]">
          Gracias, tu pedido
          <br />
          <em>está confirmado.</em>
        </h1>
        <div className="flex flex-col gap-1.5 text-[15px] text-muted">
          <span>Pedido <strong className="font-semibold text-ink">#{order.id}</strong></span>
          {user && <span>Te enviamos la confirmación a {user.email}.</span>}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/cuenta" className="flex h-[52px] items-center bg-ink px-8 text-sm font-semibold tracking-wide text-bone no-underline">Ver mis pedidos</Link>
          <Link to="/tienda" className="flex h-[52px] items-center border border-ink px-8 text-sm font-semibold tracking-wide no-underline">Seguir comprando</Link>
        </div>
      </div>
      <OrderDetail order={order} />
    </div>
  )
}
