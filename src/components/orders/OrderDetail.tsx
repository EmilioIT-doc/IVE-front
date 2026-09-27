import { formatAddress } from '../../features/addresses/types'
import { STATUS_LABEL, type Order } from '../../features/orders/types'
import { capitalize, formatMoney } from '../../lib/format'

/** Artículos, dirección y totales de un pedido (confirmación y Mi cuenta). */
export function OrderDetail({ order }: { order: Order }) {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-6">
      <section aria-labelledby="articulos" className="flex flex-col gap-5 lg:col-span-7">
        <h2 id="articulos" className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Artículos</h2>
        <ul className="flex flex-col">
          {order.items.map((item) => (
            <li key={item.variantId} className="flex justify-between gap-4 border-b border-line py-4">
              <div className="flex flex-col gap-1">
                <span className="text-[15px] font-semibold">{item.productName}</span>
                <span className="text-[13px] text-muted">
                  {capitalize(item.color)} · Talla {item.size} · {item.quantity} × {formatMoney(item.unitPriceCents)}
                </span>
                <span className="text-xs text-subtle">SKU {item.sku}</span>
              </div>
              <span className="text-[15px] font-semibold">{formatMoney(item.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
      </section>

      <aside className="flex flex-col gap-6 bg-sand p-8 lg:col-span-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Envío {order.shippingMethod === 'express' ? 'express' : 'estándar'}</span>
          <span className="text-[15px] font-semibold">{order.shippingAddress.recipientName}</span>
          <span className="text-sm text-muted">{formatAddress(order.shippingAddress)}</span>
          <span className="text-sm text-muted">Tel. {order.shippingAddress.phone}</span>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#d6d0c5] pt-5 text-sm text-muted">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(order.subtotalCents)}</span></div>
          {order.discountCents > 0 && (
            <div className="flex justify-between font-semibold text-olive">
              <span>Descuento{order.couponCode ? ` (${order.couponCode})` : ''}</span>
              <span>−{formatMoney(order.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between"><span>Envío</span><span>{order.shippingCents === 0 ? 'Gratis' : formatMoney(order.shippingCents)}</span></div>
        </div>
        <div className="flex items-baseline justify-between border-t border-[#d6d0c5] pt-5">
          <span className="text-[17px] font-bold">Total</span>
          <span className="text-2xl font-bold">{formatMoney(order.totalCents)}</span>
        </div>
      </aside>
    </div>
  )
}

export function StatusBadge({ status }: { status: Order['status'] }) {
  const tone = status === 'cancelled' ? 'bg-[#f4e4de] text-[#7a2615]' : status === 'pending' ? 'bg-linen' : 'bg-[#dfe3d8] text-olive'
  return <span className={`px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${tone}`}>{STATUS_LABEL[status]}</span>
}
