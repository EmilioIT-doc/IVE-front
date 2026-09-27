import { useState, type MouseEvent } from 'react'
import { ArrowLeftIcon, ArrowRightIcon } from './icons'

type Image = { url: string; altText: string | null }

const ZOOM = 2.5 // cuántas veces se amplía en el panel de la derecha
const GAP = 24 // separación entre la foto y el panel de zoom

type ZoomState = {
  lens: { x: number; y: number; w: number; h: number } // recuadro sobre la foto (px)
  pane: { w: number; h: number } // tamaño del panel de zoom (px)
  box: { w: number; h: number } // tamaño de la foto grande (px)
}

/**
 * Galería estilo Amazon:
 * - miniaturas a un lado: al pasar el mouse (o con teclado) cambia la foto grande
 * - al pasar el mouse sobre la foto grande aparece un recuadro, y a la DERECHA
 *   un panel con esa zona ampliada (solo en pantallas grandes con mouse)
 */
export function ProductGallery({ images, productName }: { images: Image[]; productName: string }) {
  const [active, setActive] = useState(0)
  const [zoom, setZoom] = useState<ZoomState | null>(null)
  const current = images[active] ?? images[0]!
  const altOf = (img: Image, i: number) => img.altText ?? `${productName}, foto ${i + 1}`

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    // Solo con mouse y en pantallas anchas, donde hay espacio a la derecha
    if (!window.matchMedia('(hover: hover) and (min-width: 1024px)').matches) return
    const rect = e.currentTarget.getBoundingClientRect()

    // El panel ocupa el espacio a la derecha de la foto, sin salirse de la ventana
    const paneW = Math.min(rect.width, window.innerWidth - rect.right - GAP * 2)
    const paneH = rect.height
    if (paneW < 200) return

    // El recuadro representa lo que cabe en el panel, reducido ZOOM veces
    const w = paneW / ZOOM
    const h = paneH / ZOOM
    // Centrado en el cursor, pero sin salirse de la foto
    const x = Math.max(0, Math.min(e.clientX - rect.left - w / 2, rect.width - w))
    const y = Math.max(0, Math.min(e.clientY - rect.top - h / 2, rect.height - h))

    setZoom({ lens: { x, y, w, h }, pane: { w: paneW, h: paneH }, box: { w: rect.width, h: rect.height } })
  }

  const go = (delta: number) => setActive((i) => (i + delta + images.length) % images.length)

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {images.length > 1 && (
        <ul aria-label="Fotos del producto" className="flex gap-3 overflow-x-auto md:w-[76px] md:shrink-0 md:flex-col md:overflow-visible">
          {images.map((img, i) => (
            <li key={img.url} className="shrink-0">
              <button
                type="button"
                aria-label={`Ver foto ${i + 1} de ${images.length}`}
                aria-current={i === active}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className={`block size-[76px] overflow-hidden bg-white p-1 ${i === active ? 'ring-2 ring-ink' : 'ring-1 ring-line hover:ring-subtle'}`}
              >
                <img src={img.url} alt="" className="h-full w-full object-contain" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-1 flex-col gap-2">
        <div className="relative aspect-[4/5] bg-white lg:cursor-crosshair" onMouseMove={onMove} onMouseLeave={() => setZoom(null)}>
          <img key={current.url} src={current.url} alt={altOf(current, active)} className="h-full w-full animate-fade-in object-contain" />

          {/* Recuadro que marca la zona que se está ampliando */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute border border-ink/40 bg-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.8)] transition-opacity duration-200 ${zoom ? 'opacity-100' : 'opacity-0'}`}
            style={zoom ? { left: zoom.lens.x, top: zoom.lens.y, width: zoom.lens.w, height: zoom.lens.h } : undefined}
          />

          {/* Panel de zoom a la derecha, encima de la info del producto */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute top-0 z-20 hidden overflow-hidden border border-line bg-white shadow-xl transition-opacity duration-200 lg:block ${zoom ? 'opacity-100' : 'opacity-0'}`}
            style={{ left: `calc(100% + ${GAP}px)`, width: zoom?.pane.w ?? 0, height: zoom?.pane.h ?? 0 }}
          >
            {zoom && (
              // La misma foto, ZOOM veces más grande y recorrida según el recuadro
              <img
                src={current.url}
                alt=""
                className="absolute max-w-none object-contain"
                style={{
                  width: zoom.box.w * ZOOM,
                  height: zoom.box.h * ZOOM,
                  left: -zoom.lens.x * ZOOM,
                  top: -zoom.lens.y * ZOOM,
                }}
              />
            )}
          </div>

          {images.length > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} aria-label="Foto anterior" className="absolute top-1/2 left-3 flex size-11 -translate-y-1/2 items-center justify-center bg-bone/90 md:hidden">
                <ArrowLeftIcon size={18} />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Foto siguiente" className="absolute top-1/2 right-3 flex size-11 -translate-y-1/2 items-center justify-center bg-bone/90 md:hidden">
                <ArrowRightIcon size={18} />
              </button>
              <span className="absolute right-3 bottom-3 bg-bone/90 px-2 py-1 text-xs font-semibold" aria-hidden="true">
                {active + 1} / {images.length}
              </span>
            </>
          )}
        </div>
        <p className="hidden text-center text-xs text-subtle lg:block">Pasa el mouse sobre la imagen para verla de cerca</p>
      </div>
    </div>
  )
}
