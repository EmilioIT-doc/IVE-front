import { Link, useParams } from 'react-router'
import { OrderDetail, StatusBadge } from '../components/orders/OrderDetail'
import { ErrorState } from '../components/ui/ErrorState'
import { ArrowLeftIcon } from '../components/ui/icons'
import { useGetOrderQuery } from '../features/orders/ordersApi'
import { formatDate } from '../lib/format'
import { getErrorMessage } from '../services/api'

export function OrderDetailPage() {
  const { id = '' } = useParams()
  const { data: order, isLoading, error } = useGetOrderQuery(id)

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 py-14 md:px-16">
      <Link to="/cuenta" className="flex min-h-11 items-center gap-2 self-start text-sm font-medium no-underline">
        <ArrowLeftIcon size={18} /> Mis pedidos
      </Link>
      {isLoading ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : error || !order ? (
        <ErrorState message={getErrorMessage(error, 'No encontramos este pedido')} />
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="font-display text-5xl leading-none md:text-6xl">Pedido #{order.id}</h1>
              <span className="text-sm text-muted">{formatDate(order.createdAt)}</span>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <OrderDetail order={order} />
        </>
      )}
    </div>
  )
}
