import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import type { Gender } from '../../features/catalog/types'
import { recommendSize, type Body, type Fit, type SizeResult } from '../../lib/sizeCalculator'
import { CloseIcon } from './icons'

type Props = { sizes: string[]; gender: Gender; onPick: (size: string) => void; onClose: () => void }

const MEMORY_KEY = 'ive:medidas' // recordamos tus medidas en ESTE navegador (no se mandan a ningún lado)

function loadMemory(): { body?: Body; height?: string; weight?: string; fit?: Fit } {
  try {
    return JSON.parse(localStorage.getItem(MEMORY_KEY) ?? '{}')
  } catch {
    return {}
  }
}

/** Modal "Calcular mi talla": cuerpo, estatura, peso y ajuste → talla sugerida. */
export function SizeCalculator({ sizes, gender, onPick, onClose }: Props) {
  const [memory] = useState(loadMemory)
  const [body, setBody] = useState<Body>(memory.body ?? (gender === 'mujer' ? 'mujer' : 'hombre'))
  const [height, setHeight] = useState(memory.height ?? '')
  const [weight, setWeight] = useState(memory.weight ?? '')
  const [fit, setFit] = useState<Fit>(memory.fit ?? 'regular')
  const [result, setResult] = useState<SizeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const firstRef = useRef<HTMLInputElement>(null)
  const ids = { h: useId(), w: useId() }
  // onClose cambia en cada render del padre: lo guardamos en un ref para no re-suscribir (ni robar el foco)
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const calculate = (e: FormEvent) => {
    e.preventDefault()
    const h = Number(height)
    const w = Number(weight)
    // Regex para solo números enteros; y rangos razonables
    if (!/^\d{2,3}$/.test(height) || h < 130 || h > 220) return setError('Escribe tu estatura en centímetros (ej. 172)')
    if (!/^\d{2,3}$/.test(weight) || w < 30 || w > 200) return setError('Escribe tu peso en kilos (ej. 70)')
    setError(null)
    setResult(recommendSize({ body, heightCm: h, weightKg: w, fit }, sizes))
    try {
      localStorage.setItem(MEMORY_KEY, JSON.stringify({ body, height, weight, fit }))
    } catch {
      // modo incógnito o almacenamiento bloqueado: no pasa nada
    }
  }

  const choice = (active: boolean) => `h-11 flex-1 border text-sm ${active ? 'border-ink bg-ink font-semibold text-bone' : 'border-field hover:border-ink'}`

  return createPortal(
    <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-ink/60 p-4 backdrop-blur-[3px]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="talla-titulo" className="flex max-h-[94vh] w-full max-w-[460px] flex-col gap-6 overflow-y-auto bg-bone p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="talla-titulo" className="font-display text-4xl leading-none">Calcula tu talla</h2>
            <p className="text-sm text-muted">Tarda 10 segundos. Es una recomendación aproximada.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="flex size-11 shrink-0 items-center justify-center hover:bg-sand"><CloseIcon /></button>
        </div>

        <form onSubmit={calculate} noValidate className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[13px] font-semibold">Corte de tu cuerpo</legend>
            <div className="flex gap-2">
              <button type="button" aria-pressed={body === 'hombre'} onClick={() => setBody('hombre')} className={choice(body === 'hombre')}>Hombre</button>
              <button type="button" aria-pressed={body === 'mujer'} onClick={() => setBody('mujer')} className={choice(body === 'mujer')}>Mujer</button>
            </div>
            {gender === 'unisex' && <span className="text-xs text-subtle">Este diseño es unisex (corte recto); si sueles usar ropa de mujer, quizá prefieras una talla menos.</span>}
          </fieldset>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={ids.h} className="text-[13px] font-semibold">Estatura</label>
              <div className="flex h-12 items-center border border-field bg-white pr-3">
                <input ref={firstRef} id={ids.h} inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="172" className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] focus:outline-none" />
                <span className="text-sm text-muted">cm</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={ids.w} className="text-[13px] font-semibold">Peso</label>
              <div className="flex h-12 items-center border border-field bg-white pr-3">
                <input id={ids.w} inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="70" className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] focus:outline-none" />
                <span className="text-sm text-muted">kg</span>
              </div>
            </div>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[13px] font-semibold">¿Cómo te gusta que te quede?</legend>
            <div className="flex gap-2">
              {(['ajustado', 'regular', 'holgado'] as const).map((f) => (
                <button key={f} type="button" aria-pressed={fit === f} onClick={() => setFit(f)} className={choice(fit === f)}>
                  {f === 'ajustado' ? 'Ajustada' : f === 'regular' ? 'Normal' : 'Holgada'}
                </button>
              ))}
            </div>
          </fieldset>

          {error && <p role="alert" className="animate-fade-in text-sm font-medium text-danger">{error}</p>}
          <button type="submit" className="h-12 bg-ink text-sm font-semibold tracking-[0.08em] text-bone uppercase hover:bg-olive">Calcular</button>
        </form>

        {result && (
          <div aria-live="polite" className="flex animate-fade-in flex-col gap-3 bg-white p-5 ring-1 ring-line">
            <span className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">Tu talla sugerida</span>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-6xl leading-none">{result.pick ?? result.recommended}</span>
              {result.between && <span className="text-sm text-muted">o {result.between} si la prefieres {sizes.indexOf(result.between) > sizes.indexOf(result.pick ?? '') ? 'más suelta' : 'más pegada'}</span>}
            </div>
            {!result.exact && result.pick && (
              <p className="text-xs text-muted">Tu talla ideal sería {result.recommended}, pero este diseño no la tiene; {result.pick} es la más cercana.</p>
            )}
            {!result.pick && <p className="text-xs text-muted">Este producto usa otra escala de tallas; revisa la guía de tallas.</p>}
            {result.pick && (
              <button
                type="button"
                onClick={() => {
                  onPick(result.pick!)
                  onClose()
                }}
                className="h-11 border border-ink text-sm font-semibold hover:bg-ink hover:text-bone"
              >
                Elegir talla {result.pick}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
