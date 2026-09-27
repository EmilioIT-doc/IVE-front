import { useState, type FormEvent } from 'react'
import { usePreviewCouponMutation, type AppliedCoupon } from '../../features/coupons/couponsApi'
import { formatMoney } from '../../lib/format'
import { getErrorMessage } from '../../services/api'

type Props = { applied: AppliedCoupon | null; onChange: (coupon: AppliedCoupon | null) => void }

/** "¿Tienes un cupón?" en el resumen del checkout. */
export function CouponBox({ applied, onChange }: Props) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [preview, { isLoading }] = usePreviewCouponMutation()

  const apply = async (e: FormEvent) => {
    e.preventDefault()
    // Regex: solo letras/números/guiones, sin espacios (igual que el back)
    const clean = code.trim().toUpperCase()
    if (!/^[A-Z0-9_-]{3,30}$/.test(clean)) return setError('Escribe un código válido (sin espacios)')
    setError(null)
    try {
      onChange(await preview(clean).unwrap())
      setCode('')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (applied) {
    return (
      <div className="flex animate-fade-in items-center justify-between gap-3 bg-white px-4 py-3 ring-1 ring-line">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Cupón {applied.code}</span>
          <span className="text-xs text-muted">{applied.description} · −{formatMoney(applied.discountCents)}</span>
        </div>
        <button type="button" onClick={() => onChange(null)} className="text-xs text-danger underline">Quitar</button>
      </div>
    )
  }

  return (
    <form onSubmit={apply} noValidate className="flex flex-col gap-2">
      <label htmlFor="cupon" className="text-[13px] font-semibold">¿Tienes un cupón?</label>
      <div className="flex gap-2">
        <input
          id="cupon"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="VERANO25"
          autoComplete="off"
          className="h-11 min-w-0 flex-1 border border-field bg-white px-3 text-sm tracking-wide uppercase"
        />
        <button type="submit" disabled={isLoading || !code.trim()} className="h-11 border border-ink px-4 text-sm font-semibold disabled:opacity-50">
          {isLoading ? '…' : 'Aplicar'}
        </button>
      </div>
      {error && <p role="alert" className="animate-fade-in text-xs font-medium text-danger">{error}</p>}
    </form>
  )
}
