type Props = {
  value: number
  min?: number
  max: number
  onChange: (value: number) => void
  label: string
  size?: 'sm' | 'md'
}

export function QuantityStepper({ value, min = 1, max, onChange, label, size = 'md' }: Props) {
  const h = size === 'sm' ? 'h-10' : 'h-14'
  return (
    <div role="group" aria-label={label} className={`flex ${h} items-center border border-field`}>
      <button
        type="button"
        aria-label="Quitar uno"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="h-full w-11 text-lg disabled:text-field"
      >
        −
      </button>
      <span aria-live="polite" className="w-8 text-center text-[15px] font-semibold">
        {value}
      </span>
      <button
        type="button"
        aria-label="Agregar uno"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="h-full w-11 text-lg disabled:text-field"
      >
        +
      </button>
    </div>
  )
}
