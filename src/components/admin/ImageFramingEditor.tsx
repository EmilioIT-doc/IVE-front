import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { clamp, DEFAULT_FRAMING, framingStyle, MAX_ZOOM, MIN_ZOOM, type Framing } from '../../lib/framing'
import { CloseIcon } from '../ui/icons'

export type EditorFrame = { label: string; aspect: number } // aspect = ancho / alto

type Props = {
  title: string
  url: string
  initial: Framing
  /** El 1º es el cuadro grande donde se edita; todos salen como vista previa */
  frames: EditorFrame[]
  onSave: (framing: Framing) => Promise<void>
  onClose: () => void
}

const STEP = 2 // % que se mueve con cada flecha (Shift = x5)
const round = (n: number) => Math.round(n * 100) / 100

/**
 * Editor de encuadre tipo foto de perfil de LinkedIn:
 * arrastras la foto, haces zoom con la barra o la rueda del mouse, y ves en vivo cómo queda
 * en cada tamaño. No se recorta el archivo: solo se guarda zoom + punto de enfoque.
 */
export function ImageFramingEditor({ title, url, initial, frames, onSave, onClose }: Props) {
  const [framing, setFraming] = useState<Framing>(initial)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ px: number; py: number; x: number; y: number; w: number; h: number } | null>(null)
  const main = frames[0]!
  // onClose puede cambiar en cada render del padre: lo guardamos en un ref para no re-suscribir
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  // Sin scroll detrás del modal, Esc para cerrar y el foco en la foto
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    frameRef.current?.focus()
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const setZoom = (zoom: number) => setFraming((f) => ({ ...f, zoom: round(clamp(zoom, MIN_ZOOM, MAX_ZOOM)) }))

  /** Mover la foto: dir +1 = hacia la derecha / abajo. Mover la foto a la derecha deja ver más de su lado izquierdo. */
  const nudge = (dx: number, dy: number, big: boolean) => {
    const step = STEP * (big ? 5 : 1)
    setFraming((f) => ({ ...f, x: round(clamp(f.x - dx * step, 0, 100)), y: round(clamp(f.y - dy * step, 0, 100)) }))
  }

  // ---- arrastrar
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault() // sin esto, arrastrar selecciona texto del modal
    frameRef.current!.focus()
    const rect = frameRef.current!.getBoundingClientRect()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { px: e.clientX, py: e.clientY, x: framing.x, y: framing.y, w: rect.width, h: rect.height }
    setDragging(true)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || !natural) return
    // La foto cubre el cuadro (cover) y luego se escala por el zoom.
    // Con object-position = x% y scale desde ese mismo punto, la posición en pantalla de
    // cualquier punto de la foto cambia (W − zoom·anchoCubierto)/100 px por cada 1% de x.
    // Despejamos: cuántos % mover para que la foto siga al puntero exactamente.
    const cover = Math.max(d.w / natural.w, d.h / natural.h)
    const spanX = d.w - framing.zoom * natural.w * cover
    const spanY = d.h - framing.zoom * natural.h * cover
    const x = Math.abs(spanX) < 0.5 ? d.x : clamp(d.x + ((e.clientX - d.px) * 100) / spanX, 0, 100)
    const y = Math.abs(spanY) < 0.5 ? d.y : clamp(d.y + ((e.clientY - d.py) * 100) / spanY, 0, 100)
    setFraming((f) => ({ ...f, x: round(x), y: round(y) }))
  }

  const endDrag = () => {
    drag.current = null
    setDragging(false)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    const move = moves[e.key]
    if (move) {
      e.preventDefault()
      nudge(move[0], move[1], e.shiftKey)
    } else if (e.key === '+' || e.key === '=') setZoom(framing.zoom + 0.1)
    else if (e.key === '-') setZoom(framing.zoom - 0.1)
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave(framing)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el encuadre')
      setSaving(false)
    }
  }

  // Solo cerramos al hacer clic en el fondo si el clic EMPEZÓ en el fondo
  // (si arrastras la foto y sueltas afuera del modal, no debe cerrarse)
  const pressedBackdrop = useRef(false)

  // Portal: el modal se pinta directo en <body>. Si se quedara dentro del panel, un ancestro
  // con animación (transform) lo "encierra" y el position: fixed deja de cubrir toda la pantalla.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-ink/60 p-4 backdrop-blur-[3px]"
      onPointerDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (pressedBackdrop.current && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="encuadre-titulo"
        className="flex max-h-[94vh] w-full max-w-[920px] flex-col gap-6 overflow-y-auto bg-bone p-5 shadow-2xl md:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="encuadre-titulo" className="font-display text-4xl leading-none">Editar encuadre</h2>
            <p className="text-sm text-muted">{title} · la foto original no se modifica.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="flex size-11 shrink-0 items-center justify-center hover:bg-sand">
            <CloseIcon />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_220px]">
          {/* Cuadro principal: aquí se arrastra */}
          <div className="flex flex-col gap-4">
            <div
              ref={frameRef}
              tabIndex={0}
              role="application"
              aria-label="Foto. Arrástrala o usa las flechas para moverla; + y − para el zoom."
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onWheel={(e) => setZoom(framing.zoom - e.deltaY * 0.0015)}
              onKeyDown={onKeyDown}
              className={`relative mx-auto w-full max-w-[520px] touch-none overflow-hidden bg-sand select-none ring-1 ring-line ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{ aspectRatio: main.aspect }}
            >
              <img
                src={url}
                alt=""
                draggable={false}
                onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                className="pointer-events-none absolute inset-0 h-full w-full"
                style={framingStyle(framing)}
              />
              {/* Cuadrícula de tercios mientras arrastras (ayuda a acomodar) */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${dragging ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.7) 1px, transparent 1px)',
                  backgroundSize: '33.333% 33.333%',
                  backgroundPosition: '-1px -1px',
                }}
              />
              <span className="pointer-events-none absolute top-3 left-3 bg-ink/80 px-2 py-1 text-[10px] font-semibold tracking-wide text-bone uppercase">{main.label}</span>
            </div>
            <p className="text-center text-xs text-subtle">Arrastra la foto para acomodarla · rueda del mouse para el zoom · flechas del teclado para moverla</p>

            {/* Zoom */}
            <div className="flex items-center gap-3">
              <button type="button" aria-label="Alejar" onClick={() => setZoom(framing.zoom - 0.1)} className="flex size-10 shrink-0 items-center justify-center border border-field text-lg hover:border-ink">−</button>
              <input
                type="range"
                aria-label="Zoom"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                value={framing.zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="h-10 flex-1 accent-ink"
              />
              <button type="button" aria-label="Acercar" onClick={() => setZoom(framing.zoom + 0.1)} className="flex size-10 shrink-0 items-center justify-center border border-field text-lg hover:border-ink">+</button>
              <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums">{Math.round(framing.zoom * 100)}%</span>
            </div>

            {/* Mover con botones */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {(
                [
                  ['←', 'Mover a la izquierda', -1, 0],
                  ['↑', 'Mover hacia arriba', 0, -1],
                  ['↓', 'Mover hacia abajo', 0, 1],
                  ['→', 'Mover a la derecha', 1, 0],
                ] as const
              ).map(([icon, label, dx, dy]) => (
                <button key={label} type="button" aria-label={label} title={label} onClick={() => nudge(dx, dy, false)} className="flex size-10 items-center justify-center border border-field hover:border-ink">
                  {icon}
                </button>
              ))}
              <button type="button" onClick={() => setFraming((f) => ({ ...f, x: 50, y: 50 }))} className="h-10 border border-field px-3 text-xs font-semibold hover:border-ink">
                Centrar
              </button>
            </div>
          </div>

          {/* Vistas previas en vivo */}
          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">Así se verá</span>
            {frames.map((frame) => (
              <figure key={frame.label} className="flex flex-col gap-1.5">
                <div className="relative overflow-hidden bg-sand ring-1 ring-line" style={{ aspectRatio: frame.aspect, width: frame.aspect >= 1 ? '100%' : `${Math.round(frame.aspect * 100)}%` }}>
                  <img src={url} alt="" className="absolute inset-0 h-full w-full" style={framingStyle(framing)} />
                </div>
                <figcaption className="text-xs text-subtle">{frame.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        {error && <p role="alert" className="animate-fade-in text-sm font-medium text-danger">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <button type="button" onClick={() => setFraming(DEFAULT_FRAMING)} className="h-11 text-sm font-semibold underline">
            Restablecer
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="h-12 border border-ink px-6 text-sm font-semibold">Cancelar</button>
            <button type="button" onClick={() => void save()} disabled={saving} className="h-12 bg-ink px-6 text-sm font-semibold text-bone hover:bg-olive disabled:opacity-60">
              {saving ? 'Guardando…' : 'Guardar encuadre'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
