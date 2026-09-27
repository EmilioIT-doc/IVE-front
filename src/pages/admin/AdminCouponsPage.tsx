import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Notice, Section } from '../../components/admin/AdminBits'
import { Field } from '../../components/forms/Field'
import { ErrorState } from '../../components/ui/ErrorState'
import { couponFormSchema, couponFromForm, emptyCouponForm, type CouponFormValues } from '../../features/admin/couponForm'
import {
  useCreateCouponMutation,
  useDeleteCouponMutation,
  useGetCouponsQuery,
  useSetCouponActiveMutation,
  type Coupon,
} from '../../features/coupons/couponsApi'
import { formatDate, formatMoney } from '../../lib/format'
import { getErrorMessage } from '../../services/api'

export function AdminCouponsPage() {
  const { data: coupons, isLoading, error, refetch } = useGetCouponsQuery()

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-5xl leading-none">Cupones</h1>
        <p className="text-sm text-muted">Códigos de descuento que se aplican en el checkout sobre el subtotal de la bolsa.</p>
      </div>

      <Section title="Nuevo cupón">
        <CouponForm />
      </Section>

      <Section title="Tus cupones">
        {error ? (
          <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
        ) : isLoading ? (
          <p className="text-sm text-muted">Cargando…</p>
        ) : !coupons?.length ? (
          <p className="text-sm text-muted">Todavía no hay cupones.</p>
        ) : (
          <div className="overflow-x-auto border border-line bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line bg-sand text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Código</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Descuento</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Condiciones</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Usos</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => <CouponRow key={c.id} coupon={c} />)}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  )
}

function statusOf(c: Coupon): { label: string; ok: boolean } {
  const now = Date.now()
  if (!c.isActive) return { label: 'Pausado', ok: false }
  if (c.endsAt && new Date(c.endsAt).getTime() <= now) return { label: 'Vencido', ok: false }
  if (c.maxUses != null && c.usesCount >= c.maxUses) return { label: 'Agotado', ok: false }
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return { label: 'Programado', ok: false }
  return { label: 'Activo', ok: true }
}

function CouponRow({ coupon: c }: { coupon: Coupon }) {
  const [setActive, activeState] = useSetCouponActiveMutation()
  const [remove, removeState] = useDeleteCouponMutation()
  const [error, setError] = useState<string | null>(null)
  const status = statusOf(c)

  const conditions = [
    c.minSubtotalCents > 0 ? `Compra mínima ${formatMoney(c.minSubtotalCents)}` : null,
    c.perUserLimit != null ? `${c.perUserLimit} por persona` : null,
    c.startsAt ? `Desde ${formatDate(c.startsAt)}` : null,
    c.endsAt ? `Hasta ${formatDate(c.endsAt)}` : null,
  ].filter(Boolean)

  const run = async (action: () => Promise<unknown>) => {
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <tr className="border-b border-line align-top last:border-0">
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="font-mono font-semibold tracking-wide">{c.code}</span>
          {c.description && <span className="text-xs text-subtle">{c.description}</span>}
        </div>
      </td>
      <td className="px-4 py-3 font-semibold">{c.discountType === 'percent' ? `${c.discountValue}%` : formatMoney(c.discountValue)}</td>
      <td className="px-4 py-3 text-xs text-muted">{conditions.length ? conditions.join(' · ') : 'Sin condiciones'}</td>
      <td className="px-4 py-3 tabular-nums">{c.usesCount}{c.maxUses != null ? ` / ${c.maxUses}` : ''}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 text-[11px] font-semibold tracking-wide whitespace-nowrap uppercase ${status.ok ? 'bg-[#dfe3d8] text-olive' : 'bg-linen text-muted'}`}>{status.label}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex gap-4 whitespace-nowrap">
            <button type="button" disabled={activeState.isLoading} onClick={() => run(() => setActive({ id: c.id, isActive: !c.isActive }).unwrap())} className="font-semibold underline disabled:opacity-50">
              {c.isActive ? 'Pausar' : 'Activar'}
            </button>
            {/* Uno ya usado no se borra (los pedidos lo referencian): se pausa */}
            {c.usesCount === 0 && (
              <button type="button" disabled={removeState.isLoading} onClick={() => run(() => remove(c.id).unwrap())} className="text-danger underline disabled:opacity-50">
                Borrar
              </button>
            )}
          </div>
          {error && <span role="alert" className="text-xs text-danger">{error}</span>}
        </div>
      </td>
    </tr>
  )
}

function CouponForm() {
  const [createCoupon] = useCreateCouponMutation()
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: emptyCouponForm,
  })
  const discountType = useWatch({ control, name: 'discountType' })

  const onSubmit = handleSubmit(async (values) => {
    setMsg(null)
    try {
      const created = await createCoupon(couponFromForm(values)).unwrap()
      reset(emptyCouponForm)
      setMsg({ tone: 'ok', text: `Cupón ${created.code} creado.` })
    } catch (err) {
      setMsg({ tone: 'error', text: getErrorMessage(err) })
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-4">
        <Field inputSize="md" label="Código" placeholder="VERANO25" hint="Se guarda en mayúsculas" autoCapitalize="characters" error={errors.code?.message} {...register('code')} />
        <Field inputSize="md" label={<>Descripción <span className="font-normal text-subtle">(opcional)</span></>} placeholder="25% en toda la tienda" error={errors.description?.message} {...register('description')} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tipo-descuento" className="text-[13px] font-semibold">Tipo de descuento</label>
          <select id="tipo-descuento" className="h-12 border border-field bg-white px-3 text-[15px]" {...register('discountType')}>
            <option value="percent">Porcentaje (%)</option>
            <option value="fixed">Cantidad fija ($)</option>
          </select>
        </div>
        <Field
          inputSize="md"
          label={discountType === 'percent' ? 'Porcentaje' : 'Pesos a descontar'}
          inputMode="decimal"
          placeholder={discountType === 'percent' ? '25' : '100'}
          error={errors.discountValue?.message}
          {...register('discountValue')}
        />

        <Field inputSize="md" label={<>Compra mínima <span className="font-normal text-subtle">(opcional)</span></>} inputMode="decimal" placeholder="Ej. 800" hint="En pesos, sobre el subtotal" error={errors.minSubtotal?.message} {...register('minSubtotal')} />
        <div className="grid grid-cols-2 gap-4">
          <Field inputSize="md" label="Usos totales" inputMode="numeric" placeholder="Sin límite" error={errors.maxUses?.message} {...register('maxUses')} />
          <Field inputSize="md" label="Por persona" inputMode="numeric" placeholder="Sin límite" error={errors.perUserLimit?.message} {...register('perUserLimit')} />
        </div>

        <Field inputSize="md" type="datetime-local" label={<>Empieza <span className="font-normal text-subtle">(opcional)</span></>} hint="Vacío = desde ya" error={errors.startsAt?.message} {...register('startsAt')} />
        <Field inputSize="md" type="datetime-local" label={<>Termina <span className="font-normal text-subtle">(opcional)</span></>} hint="Vacío = no vence" error={errors.endsAt?.message} {...register('endsAt')} />
      </div>

      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <div className="flex justify-end">
        <button type="submit" disabled={isSubmitting} className="h-12 bg-ink px-8 text-sm font-semibold tracking-[0.08em] text-bone uppercase hover:bg-olive disabled:opacity-60">
          {isSubmitting ? 'Creando…' : 'Crear cupón'}
        </button>
      </div>
    </form>
  )
}
