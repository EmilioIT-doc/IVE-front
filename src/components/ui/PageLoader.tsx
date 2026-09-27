import { useEffect, useRef, useState } from 'react'

/** Frases de la casa: sale una al azar cada vez que carga el home. */
const PHRASES = [
  'Vístete como si ya te hubieran dicho que sí.',
  'Menos “no tengo qué ponerme”, más IVE.',
  'Tu playera favorita todavía no la conoces.',
  'Algodón, actitud y cero pendientes.',
  'Del gym a la calle sin cambiarte.',
  'Buen fit, buen día.',
  'El estilo no se explica: se usa.',
  'Si no es cómodo, no es IVE.',
  'Hoy no se repite outfit.',
  'La ropa no habla, pero sí dice mucho.',
  'Crop top mental: enseña lo que eres.',
  'Suda la gota gorda, pero con estilo.',
]

type Phase = 'visible' | 'leaving' | 'gone'

type Props = {
  /** true cuando ya llegaron los datos de la página */
  ready: boolean
  /** Tiempo mínimo en pantalla para que se alcance a leer la frase (ms) */
  minMs?: number
}

const FADE_MS = 500

/**
 * Pantalla de carga a pantalla completa: una playera que se dibuja sola + una frase.
 * Se queda al menos `minMs` (aunque los datos ya estén en caché) y luego se desvanece.
 */
export function PageLoader({ ready, minMs = 1400 }: Props) {
  const [phrase] = useState(() => PHRASES[Math.floor(Math.random() * PHRASES.length)]!)
  const [phase, setPhase] = useState<Phase>('visible')
  const startedAt = useRef(0)

  // Guardamos cuándo apareció (en un efecto: leer la hora durante el render no es "puro")
  useEffect(() => {
    startedAt.current = performance.now()
  }, [])

  // Cuando hay datos y ya pasó el mínimo: fade de salida y luego desaparece del DOM
  useEffect(() => {
    if (!ready) return
    const wait = Math.max(0, minMs - (performance.now() - startedAt.current))
    const leave = setTimeout(() => setPhase('leaving'), wait)
    const gone = setTimeout(() => setPhase('gone'), wait + FADE_MS)
    return () => {
      clearTimeout(leave)
      clearTimeout(gone)
    }
  }, [ready, minMs])

  // Sin scroll detrás del loader
  useEffect(() => {
    if (phase === 'gone') return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [phase])

  if (phase === 'gone') return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-bone px-6 text-center transition-opacity duration-500 ${
        phase === 'leaving' ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <svg width="96" height="96" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-ink">
        {/* Silueta tenue de fondo + el trazo que se va dibujando encima */}
        <path d={TSHIRT} stroke="currentColor" strokeOpacity="0.12" strokeWidth="0.6" strokeLinejoin="round" />
        <path
          d={TSHIRT}
          pathLength={1}
          stroke="currentColor"
          strokeWidth="0.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="1"
          className="animate-draw"
        />
      </svg>

      <div className="flex max-w-xl animate-fade-in flex-col items-center gap-4">
        <span className="font-display text-2xl tracking-[0.3em]">IVE</span>
        <p className="font-display text-3xl leading-tight italic md:text-[40px]">{phrase}</p>
      </div>

      <div className="relative h-px w-40 overflow-hidden bg-line" aria-hidden="true">
        <span className="absolute inset-y-0 left-0 w-2/5 animate-indeterminate bg-ink" />
      </div>
      <span className="sr-only">Cargando la tienda…</span>
    </div>
  )
}

// Playera vista de frente (cuello redondo y mangas cortas), en una caja de 24×24
const TSHIRT =
  'M8.5 3.5 L4.5 5.5 L2.5 9.5 L5.5 11 L6.5 9.5 V20.5 H17.5 V9.5 L18.5 11 L21.5 9.5 L19.5 5.5 L15.5 3.5 C15 5 13.7 6 12 6 C10.3 6 9 5 8.5 3.5 Z'
