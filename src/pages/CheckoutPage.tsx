import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { AddressForm } from '../components/forms/AddressForm'
import { Field } from '../components/forms/Field'
import { ArrowLeftIcon, LockIcon } from '../components/ui/icons'
import { ProductImage } from '../components/ui/ProductImage'
import { useGetAddressesQuery } from '../features/addresses/addressesApi'
import type { AddressFormValues } from '../features/addresses/schemas'
import { formatAddress, type Address } from '../features/addresses/types'
import { useCart } from '../features/cart/useCart'
import {
  formatCardNumber,
  formatExpiry,
  paymentSchema,
  TEST_CARDS,
  tokenizeCard,
  type PaymentValues,
} from '../features/checkout/payment'
import { useCreateOrderMutation } from '../features/orders/ordersApi'
import type { ShippingMethod } from '../features/orders/types'
import { capitalize, formatMoney } from '../lib/format'
import { EXPRESS_SHIPPING_CENTS, FREE_SHIPPING_FROM_CENTS, STANDARD_SHIPPING_CENTS } from '../lib/shipping'
import { CouponBox } from '../components/checkout/CouponBox'
import { usePreviewCouponMutation, type AppliedCoupon } from '../features/coupons/couponsApi'
import { getErrorMessage, type ApiErrorBody } from '../services/api'

type AddressChoice =
  | { kind: 'saved'; address: Address }
  | { kind: 'new'; values: AddressFormValues; save: boolean }

const STEPS = ['Dirección', 'Envío', 'Pago'] as const

export function CheckoutPage() {
  const cart = useCart()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [choice, setChoice] = useState<AddressChoice | null>(null)
  const [method, setMethod] = useState<ShippingMethod>('standard')
  const [createOrder] = useCreateOrderMutation()
  const [payError, setPayError] = useState<{ message: string; stock: boolean } | null>(null)
  // Una llave por intento de compra: se conserva aunque el usuario reintente
  const idempotencyKey = useRef(crypto.randomUUID())

  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)
  const [previewCoupon] = usePreviewCouponMutation()

  // Si la bolsa cambia, el descuento se recalcula en el back (o el cupón deja de aplicar)
  const couponCode = coupon?.code
  useEffect(() => {
    if (!couponCode) return
    previewCoupon(couponCode)
      .unwrap()
      .then(setCoupon)
      .catch(() => setCoupon(null))
  }, [cart.subtotalCents, couponCode, previewCoupon])

  // Mismas reglas que el back: el envío gratis cuenta lo que pagas YA con descuento
  const discountCents = coupon?.discountCents ?? 0
  const payableCents = cart.subtotalCents - discountCents
  const standardCents = payableCents >= FREE_SHIPPING_FROM_CENTS ? 0 : STANDARD_SHIPPING_CENTS
  const shippingCents = method === 'express' ? EXPRESS_SHIPPING_CENTS : standardCents
  const totalCents = payableCents + shippingCents

  const pay = async (payment: PaymentValues) => {
    if (!choice) return
    setPayError(null)
    const base = {
      idempotencyKey: idempotencyKey.current,
      shippingMethod: method,
      paymentToken: tokenizeCard(payment.cardNumber),
      ...(coupon ? { couponCode: coupon.code } : {}),
    }
    try {
      const order = await createOrder(
        choice.kind === 'saved'
          ? { ...base, addressId: choice.address.id }
          : { ...base, address: { ...choice.values, intNumber: choice.values.intNumber || null }, saveAddress: choice.save },
      ).unwrap()
      navigate(`/pedido/${order.id}`, { replace: true })
    } catch (err) {
      const code = (err as { data?: ApiErrorBody }).data?.error?.code
      setPayError({ message: getErrorMessage(err), stock: code === 'INSUFFICIENT_STOCK' })
      if (code?.startsWith('COUPON_')) setCoupon(null) // el cupón ya no aplica: se quita
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-4 md:px-16">
          <button type="button" onClick={() => { navigate('/tienda'); cart.open() }} className="flex min-h-11 items-center gap-2 text-sm font-medium">
            <ArrowLeftIcon size={18} /> <span className="hidden sm:inline">Regresar a la bolsa</span>
          </button>
          <Link to="/" aria-label="IVE, inicio" className="font-display text-4xl leading-none tracking-[0.3em] no-underline md:pl-[0.3em]">
            IVE
          </Link>
          <span className="flex items-center gap-2 text-[13px] font-medium text-muted">
            <LockIcon size={18} /> <span className="hidden sm:inline">Pago seguro</span>
          </span>
        </div>
      </header>

      {!cart.isLoading && cart.items.length === 0 ? (
        <main className="mx-auto flex w-full max-w-[1440px] flex-col items-start gap-5 px-4 py-24 md:px-16">
          <h1 className="font-display text-6xl leading-none">Tu bolsa está vacía</h1>
          <p className="text-muted">Agrega algo que te guste para continuar con la compra.</p>
          <Link to="/tienda" className="flex h-[52px] items-center bg-ink px-8 text-sm font-semibold text-bone no-underline">Ver la tienda</Link>
        </main>
      ) : (
        <div className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 items-start gap-10 px-4 py-10 md:px-16 md:py-14 lg:grid-cols-12 lg:gap-6">
          <main className="flex flex-col gap-12 lg:col-span-7 lg:pr-12">
            <Stepper current={step} />

            {step === 0 && (
              <AddressStep
                selected={choice}
                onContinue={(c) => {
                  setChoice(c)
                  setStep(1)
                }}
              />
            )}

            {step === 1 && choice && (
              <section className="flex animate-fade-in flex-col gap-8">
                <h1 className="font-display text-5xl leading-none">Método de envío</h1>
                <div className="flex items-start justify-between gap-6 border border-line px-6 py-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">Enviar a</span>
                    <span className="text-[15px]">
                      {(choice.kind === 'saved' ? choice.address : choice.values).recipientName} ·{' '}
                      {formatAddress(choice.kind === 'saved' ? choice.address : { ...choice.values, intNumber: choice.values.intNumber || null })}
                    </span>
                  </div>
                  <button type="button" onClick={() => setStep(0)} className="h-11 shrink-0 text-sm underline">Editar</button>
                </div>
                <fieldset className="flex flex-col gap-3">
                  <legend className="sr-only">Elige un método de envío</legend>
                  <ShippingOption checked={method === 'standard'} onSelect={() => setMethod('standard')} title="Estándar" subtitle="3 a 5 días hábiles" price={standardCents === 0 ? 'Gratis' : formatMoney(standardCents)} />
                  <ShippingOption checked={method === 'express'} onSelect={() => setMethod('express')} title="Express" subtitle="1 a 2 días hábiles" price={formatMoney(EXPRESS_SHIPPING_CENTS)} />
                </fieldset>
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setStep(0)} className="h-14 px-2 text-sm font-semibold">Regresar</button>
                  <button type="button" onClick={() => setStep(2)} className="h-14 bg-ink px-10 text-sm font-semibold tracking-[0.08em] text-bone uppercase">Continuar a pago</button>
                </div>
              </section>
            )}

            {step === 2 && (
              <PaymentStep
                totalCents={totalCents}
                error={payError}
                onOpenCart={cart.open}
                onBack={() => setStep(1)}
                onPay={pay}
              />
            )}
          </main>

          {/* Resumen */}
          <aside aria-label="Resumen del pedido" className="flex flex-col gap-6 bg-sand p-8 md:p-10 lg:sticky lg:top-8 lg:col-span-5">
            <h2 className="font-display text-[32px]">Tu pedido</h2>
            <ul className="flex flex-col gap-5">
              {cart.items.map((item) => (
                <li key={item.variantId} className="flex items-center gap-4">
                  <div className="relative w-16 shrink-0">
                    <ProductImage src={item.product.imageUrl ?? null} alt={item.product.name} seed={`${item.product.slug}-${item.color}`} label="" />
                    <span className="absolute -top-2 -right-2 flex size-[22px] items-center justify-center rounded-full bg-ink text-[11px] font-bold text-bone">{item.quantity}</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-sm font-semibold">{item.product.name}</span>
                    <span className="text-[13px] text-muted">{capitalize(item.color)} · Talla {item.size}</span>
                  </div>
                  <span className="text-sm font-semibold">{formatMoney(item.unitPriceCents * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <CouponBox applied={coupon} onChange={setCoupon} />
            <div className="flex flex-col gap-3 border-t border-[#d6d0c5] pt-5 text-sm text-muted">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(cart.subtotalCents)}</span></div>
              {coupon && (
                <div className="flex animate-fade-in justify-between font-semibold text-olive">
                  <span>Descuento ({coupon.code})</span>
                  <span>−{formatMoney(discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Envío ({method === 'express' ? 'Express' : 'Estándar'})</span>
                <span>{shippingCents === 0 ? 'Gratis' : formatMoney(shippingCents)}</span>
              </div>
            </div>
            <div className="flex items-baseline justify-between border-t border-[#d6d0c5] pt-5">
              <span className="text-[17px] font-bold">Total</span>
              <span className="flex items-baseline gap-2">
                <span className="text-[13px] text-muted">MXN</span>
                <span className="text-[26px] font-bold">{formatMoney(totalCents)}</span>
              </span>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

function Stepper({ current }: { current: number }) {
  return (
    <ol aria-label="Pasos de la compra" className="flex items-center">
      {STEPS.map((label, i) => (
        <li key={label} aria-current={i === current ? 'step' : undefined} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
          <div className="flex items-center gap-2.5">
            <span
              className={`flex size-[30px] items-center justify-center rounded-full text-[13px] ${
                i < current ? 'bg-ink text-bone' : i === current ? 'border-[1.5px] border-ink font-bold' : 'border border-field text-subtle'
              }`}
            >
              {i < current ? '✓' : i + 1}
            </span>
            <span className={`text-sm whitespace-nowrap ${i === current ? 'font-bold' : i > current ? 'text-subtle' : 'font-medium'}`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && <span aria-hidden="true" className={`mx-4 h-px flex-1 ${i < current ? 'bg-ink' : 'bg-field'}`} />}
        </li>
      ))}
    </ol>
  )
}

function AddressStep({ selected, onContinue }: { selected: AddressChoice | null; onContinue: (c: AddressChoice) => void }) {
  const { data: addresses, isLoading } = useGetAddressesQuery()
  const [showForm, setShowForm] = useState(selected?.kind === 'new')
  const [pickedId, setPickedId] = useState<string | null>(selected?.kind === 'saved' ? selected.address.id : null)

  if (isLoading) return <p className="text-sm text-muted">Cargando tus direcciones…</p>

  const saved = addresses ?? []
  const current = saved.find((a) => a.id === pickedId) ?? saved.find((a) => a.isDefault) ?? saved[0]
  const showAddressForm = showForm || saved.length === 0

  return (
    <section className="flex animate-fade-in flex-col gap-8">
      <h1 className="font-display text-5xl leading-none">Dirección de envío</h1>

      {!showAddressForm && current && (
        <>
          <fieldset className="flex flex-col gap-3">
            <legend className="sr-only">Elige una dirección guardada</legend>
            {saved.map((a) => (
              <label key={a.id} className={`flex cursor-pointer items-start gap-4 px-6 py-5 ${a.id === current.id ? 'border-[1.5px] border-ink' : 'border border-field'}`}>
                <input type="radio" name="address" className="mt-1 size-5" checked={a.id === current.id} onChange={() => setPickedId(a.id)} />
                <span className="flex flex-col gap-1">
                  <span className="text-[15px] font-semibold">
                    {a.recipientName} {a.isDefault && <span className="ml-2 bg-linen px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase">Predeterminada</span>}
                  </span>
                  <span className="text-sm text-muted">{formatAddress(a)}</span>
                  <span className="text-sm text-muted">Tel. {a.phone}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => setShowForm(true)} className="h-11 text-sm font-semibold underline">+ Usar otra dirección</button>
            <button type="button" onClick={() => onContinue({ kind: 'saved', address: current })} className="h-14 bg-ink px-10 text-sm font-semibold tracking-[0.08em] text-bone uppercase">
              Continuar a envío
            </button>
          </div>
        </>
      )}

      {showAddressForm && (
        <AddressForm
          showSaveOption
          submitLabel="Continuar a envío"
          defaultValues={selected?.kind === 'new' ? selected.values : undefined}
          onSubmit={(values, { save }) => onContinue({ kind: 'new', values, save })}
          secondaryAction={
            saved.length > 0 ? (
              <button type="button" onClick={() => setShowForm(false)} className="h-11 text-sm font-semibold underline">Usar una dirección guardada</button>
            ) : undefined
          }
        />
      )}
    </section>
  )
}

function ShippingOption(props: { checked: boolean; onSelect: () => void; title: string; subtitle: string; price: string }) {
  return (
    <label className={`flex cursor-pointer items-center gap-4 px-6 py-5 ${props.checked ? 'border-[1.5px] border-ink' : 'border border-field'}`}>
      <input type="radio" name="shipping" className="size-5" checked={props.checked} onChange={props.onSelect} />
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-semibold">{props.title}</span>
        <span className="text-[13px] text-muted">{props.subtitle}</span>
      </span>
      <span className="text-[15px] font-semibold">{props.price}</span>
    </label>
  )
}

function PaymentStep(props: {
  totalCents: number
  error: { message: string; stock: boolean } | null
  onOpenCart: () => void
  onBack: () => void
  onPay: (values: PaymentValues) => Promise<void>
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { cardNumber: '', cardName: '', expiry: '', cvv: '' },
  })

  const cardNumber = register('cardNumber')
  const expiry = register('expiry')

  return (
    <form onSubmit={handleSubmit(props.onPay)} noValidate className="flex animate-fade-in flex-col gap-8">
      <h1 className="font-display text-5xl leading-none">Pago</h1>

      <div className="flex flex-col gap-2 bg-sand px-5 py-4 text-sm">
        <p><strong className="font-semibold">Modo de prueba.</strong> No se realiza ningún cargo real. Usa una de estas tarjetas:</p>
        <ul className="flex flex-col gap-1">
          {TEST_CARDS.map((c) => (
            <li key={c.number}>
              <button type="button" className="font-mono text-[13px] underline" onClick={() => setValue('cardNumber', c.number, { shouldValidate: true })}>
                {c.number}
              </button>{' '}
              <span className="text-muted">→ {c.result}</span>
            </li>
          ))}
        </ul>
      </div>

      {props.error && (
        <div role="alert" className="flex animate-fade-in flex-col items-start gap-2 bg-[#f4e4de] px-4 py-3.5 text-sm text-[#7a2615]">
          <span>{props.error.message}</span>
          {props.error.stock && (
            <button type="button" onClick={props.onOpenCart} className="font-semibold underline">Revisar mi bolsa</button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        <Field
          className="col-span-2"
          inputSize="md"
          label="Número de tarjeta"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="1234 5678 9012 3456"
          error={errors.cardNumber?.message}
          {...cardNumber}
          onChange={(e) => {
            e.target.value = formatCardNumber(e.target.value)
            void cardNumber.onChange(e)
          }}
        />
        <Field className="col-span-2" inputSize="md" label="Nombre en la tarjeta" autoComplete="cc-name" placeholder="Como aparece en la tarjeta" error={errors.cardName?.message} {...register('cardName')} />
        <Field
          inputSize="md"
          label="Vencimiento"
          inputMode="numeric"
          autoComplete="cc-exp"
          placeholder="MM/AA"
          error={errors.expiry?.message}
          {...expiry}
          onChange={(e) => {
            e.target.value = formatExpiry(e.target.value)
            void expiry.onChange(e)
          }}
        />
        <Field inputSize="md" label="CVV" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4} error={errors.cvv?.message} {...register('cvv')} />
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={props.onBack} className="h-14 px-2 text-sm font-semibold">Regresar</button>
        <button type="submit" disabled={isSubmitting} className="h-14 bg-ink px-10 text-sm font-semibold tracking-[0.08em] text-bone uppercase disabled:opacity-60">
          {isSubmitting ? 'Procesando…' : `Pagar ${formatMoney(props.totalCents)}`}
        </button>
      </div>
    </form>
  )
}
