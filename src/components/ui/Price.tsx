import { formatMoney } from '../../lib/format'
import { discountPercent } from '../../lib/pricing'

type Props = { priceCents: number; compareAtCents?: number | null; size?: 'sm' | 'lg'; showBadge?: boolean }

/** Precio con oferta: "$449  $̶5̶9̶9̶  −25%". Sin oferta, solo el precio. */
export function Price({ priceCents, compareAtCents, size = 'sm', showBadge = true }: Props) {
  const off = discountPercent(priceCents, compareAtCents)
  const big = size === 'lg'
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={`${big ? 'text-[22px] font-semibold' : 'font-medium'} ${off ? 'text-danger' : ''}`}>{formatMoney(priceCents)}</span>
      {off > 0 && (
        <>
          <s className={`${big ? 'text-base' : 'text-[13px]'} text-subtle`} aria-label={`Antes ${formatMoney(compareAtCents!)}`}>
            {formatMoney(compareAtCents!)}
          </s>
          {showBadge && <span className={`bg-danger px-1.5 py-0.5 font-semibold text-bone ${big ? 'text-xs' : 'text-[10px]'}`}>−{off}%</span>}
        </>
      )}
    </span>
  )
}
