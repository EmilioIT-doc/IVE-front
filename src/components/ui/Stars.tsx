import { useId, useState } from 'react'

const PATH = 'M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z'

/** Estrellas de solo lectura; soporta medias (4.5). */
export function Stars({ value, size = 16, label }: { value: number; size?: number; label?: string }) {
  const id = useId()
  return (
    <span role="img" aria-label={label ?? `${value.toFixed(1)} de 5 estrellas`} className="inline-flex gap-0.5 text-ink">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1))) // 0 … 1 de esta estrella
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <linearGradient id={`${id}-${i}`}>
                <stop offset={`${fill * 100}%`} stopColor="currentColor" />
                <stop offset={`${fill * 100}%`} stopColor="currentColor" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            <path d={PATH} fill={`url(#${id}-${i})`} />
          </svg>
        )
      })}
    </span>
  )
}

/** Para calificar: 5 botones (con teclado también: son radios). */
export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  const name = useId()
  const shown = hover || value
  const labels = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente']
  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-label="Calificación" className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <label key={i} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(i)}>
            <input type="radio" name={name} value={i} checked={value === i} onChange={() => onChange(i)} className="sr-only" aria-label={`${i} ${i === 1 ? 'estrella' : 'estrellas'}`} />
            <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true" className={`transition-transform duration-150 ${i <= shown ? 'scale-105 text-ink' : 'text-field'}`}>
              <path d={PATH} fill="currentColor" />
            </svg>
          </label>
        ))}
      </div>
      <span className="text-sm text-muted" aria-live="polite">{labels[shown]}</span>
    </div>
  )
}
