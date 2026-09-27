import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import { useCart } from '../../features/cart/useCart'
import { capitalize, formatMoney } from '../../lib/format'
import { BagIcon, CloseIcon } from '../ui/icons'
import { ProductImage } from '../ui/ProductImage'
import { QuantityStepper } from '../ui/QuantityStepper'

export function CartDrawer() {
  const cart = useCart()
  const navigate = useNavigate()
  const closeRef = useRef<HTMLButtonElement>(null)
  const { isOpen, close } = cart

  // Accesibilidad: foco al abrir, cerrar con Escape y bloquear el scroll del fondo
  useEffect(() => {
    if (!isOpen) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, close])

  const goTo = (path: string) => {
    close()
    navigate(path)
  }

  return (
    // Siempre está montado; al abrir/cerrar solo cambian opacidad y posición,
    // así la bolsa entra y sale deslizándose en lugar de aparecer de golpe.
    // inert: cerrada, nadie puede enfocarla ni hacerle clic (ni el teclado ni lectores de pantalla).
    <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`} inert={!isOpen}>
      {/* Fondo: oscurece y desenfoca la tienda con un fundido más largo y notorio */}
      <div
        className={`absolute inset-0 bg-ink/60 backdrop-blur-[3px] transition-[opacity,backdrop-filter] duration-500 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="bolsa-titulo"
        className={`absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col bg-bone shadow-[-24px_0_48px_rgba(26,26,24,0.12)] transition-[transform,visibility] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? 'visible translate-x-0' : 'invisible translate-x-full'
        }`}
      >
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-line pr-5 pl-8">
          <h2 id="bolsa-titulo" className="font-display text-[32px]">
            Tu bolsa <span className="font-sans text-[15px] font-medium text-muted">({cart.count})</span>
          </h2>
          <button ref={closeRef} type="button" onClick={close} aria-label="Cerrar" className="flex size-11 items-center justify-center">
            <CloseIcon />
          </button>
        </div>

        <div className={`flex min-h-0 flex-1 flex-col transition-opacity duration-500 ${isOpen ? 'opacity-100 delay-150' : 'opacity-0'}`}>
        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <BagIcon size={40} className="text-muted" strokeWidth={1.2} />
            <p className="font-display text-[32px]">Tu bolsa está vacía</p>
            <p className="text-sm text-muted">Agrega algo que te guste y aparecerá aquí.</p>
            <button type="button" onClick={() => goTo('/tienda')} className="mt-2 h-[52px] bg-ink px-8 text-sm font-semibold tracking-wide text-bone">
              Ver la tienda
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2.5 bg-sand px-8 py-5">
              <p className="text-[13px] font-medium">
                {cart.remainingForFreeCents === 0
                  ? 'Tu envío es gratis.'
                  : `Te faltan ${formatMoney(cart.remainingForFreeCents)} para el envío gratis.`}
              </p>
              <div
                role="progressbar"
                aria-label="Avance para envío gratis"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(cart.freeShippingProgress * 100)}
                className="h-1 bg-[#d6d0c5]"
              >
                <div className="h-1 bg-ink transition-[width]" style={{ width: `${cart.freeShippingProgress * 100}%` }} />
              </div>
            </div>

            <ul className="flex-1 overflow-y-auto px-8 py-2">
              {cart.items.map((item) => (
                <li key={item.variantId} className="flex animate-fade-in gap-5 border-b border-line py-6">
                  <div className="w-24 shrink-0">
                    <ProductImage src={item.product.imageUrl ?? null} alt={item.product.name} seed={`${item.product.slug}-${item.color}`} label="" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex justify-between gap-3 text-[15px] font-semibold">
                      <Link to={`/producto/${item.product.slug}`} onClick={close} className="no-underline hover:underline">
                        {item.product.name}
                      </Link>
                      <span>{formatMoney(item.unitPriceCents * item.quantity)}</span>
                    </div>
                    <span className="text-[13px] text-muted">
                      {capitalize(item.color)} · Talla {item.size}
                    </span>
                    <span className="text-xs text-subtle">SKU {item.sku}</span>
                    <div className="mt-auto flex items-center justify-between">
                      <QuantityStepper
                        size="sm"
                        label={`Cantidad de ${item.product.name}`}
                        value={item.quantity}
                        max={Math.min(item.stock, 20)}
                        onChange={(q) => cart.setQuantity(item.variantId, q)}
                      />
                      <button type="button" onClick={() => cart.remove(item.variantId)} className="h-11 text-[13px] text-muted underline">
                        Eliminar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex shrink-0 flex-col gap-3 border-t border-line px-8 pt-6 pb-8">
              <Row label="Subtotal" value={formatMoney(cart.subtotalCents)} />
              <Row label="Envío" value={cart.shippingCents === 0 ? 'Gratis' : formatMoney(cart.shippingCents)} />
              <div className="flex justify-between pt-1 text-[17px] font-bold">
                <span>Total</span>
                <span>{formatMoney(cart.totalCents)}</span>
              </div>
              <button
                type="button"
                onClick={() => goTo('/checkout')}
                className="mt-2 h-14 bg-ink text-sm font-semibold tracking-[0.08em] text-bone uppercase"
              >
                Ir a pagar
              </button>
              <button type="button" onClick={close} className="h-11 text-sm font-medium underline">
                Seguir comprando
              </button>
            </div>
          </>
        )}
        </div>
      </aside>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm text-muted">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
