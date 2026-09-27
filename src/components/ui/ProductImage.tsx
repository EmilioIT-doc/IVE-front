import { toneFor } from '../../lib/colors'

type Props = {
  src: string | null
  alt: string
  seed: string // para elegir un tono estable cuando no hay foto
  label?: string // '' = sin etiqueta
  className?: string
}

/**
 * Foto del producto, o un bloque de color con etiqueta mientras no haya imágenes.
 * Las fotos se muestran COMPLETAS (object-contain) sobre blanco, sin recortar la prenda.
 */
export function ProductImage({ src, alt, seed, label, className = '' }: Props) {
  if (src) {
    return (
      <div className={`flex aspect-[3/4] w-full items-center justify-center bg-white ${className}`}>
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-contain" />
      </div>
    )
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={`flex aspect-[3/4] w-full items-end p-4 ${className}`}
      style={{ backgroundColor: toneFor(seed) }}
    >
      {label !== '' && (
        <span className="text-[11px] font-semibold tracking-[0.14em] text-[#4a463f] uppercase">
          [Foto · {label ?? alt}]
        </span>
      )}
    </div>
  )
}
