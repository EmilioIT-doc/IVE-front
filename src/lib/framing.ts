import type { CSSProperties } from 'react'

/**
 * Encuadre de una portada (lo guarda el back): zoom 1–3 y punto de enfoque x/y en % (50/50 = centro).
 * El archivo nunca se recorta: se aplica con CSS, así el mismo encuadre sirve en cualquier tamaño.
 */
export type Framing = { zoom: number; x: number; y: number }

export const DEFAULT_FRAMING: Framing = { zoom: 1, x: 50, y: 50 }
export const MIN_ZOOM = 1
export const MAX_ZOOM = 3

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const isDefaultFraming = (f: Framing) => f.zoom === 1 && f.x === 50 && f.y === 50

/**
 * Estilos para un <img> que llena su caja:
 *  - object-fit: cover       → la foto cubre todo el cuadro
 *  - object-position: x% y%  → qué parte queda a la vista cuando sobra foto
 *  - scale + transform-origin en el MISMO punto → el zoom "se acerca" a ese punto
 *    y como el zoom es ≥ 1, nunca aparecen huecos en las orillas.
 */
export function framingStyle(f: Framing | null | undefined): CSSProperties {
  const { zoom, x, y } = f ?? DEFAULT_FRAMING
  return {
    objectFit: 'cover',
    objectPosition: `${x}% ${y}%`,
    transformOrigin: `${x}% ${y}%`,
    transform: zoom === 1 ? undefined : `scale(${zoom})`,
  }
}
