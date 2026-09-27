import type { CSSProperties } from 'react'
import { framingStyle, type Framing } from '../../lib/framing'

type Props = {
  url: string | null | undefined
  alt: string | null | undefined
  framing?: Framing
  fallbackLabel: string
  fallbackColor: string
  className?: string
  style?: CSSProperties
}

/**
 * Foto editable del sitio (portada del inicio, editorial…). Llena su caja y se recorta al centro.
 * Sin foto, muestra el bloque de color del diseño. El panel la usa igual para la vista previa.
 */
export function SiteImageBlock({ url, alt, framing, fallbackLabel, fallbackColor, className = '', style }: Props) {
  if (url) {
    return (
      <div className={`relative overflow-hidden bg-sand ${className}`} style={style}>
        <img src={url} alt={alt ?? ''} className="absolute inset-0 h-full w-full animate-appear" style={framingStyle(framing)} />
      </div>
    )
  }
  return (
    <div role="img" aria-label={fallbackLabel} className={`flex items-end p-7 ${className}`} style={{ backgroundColor: fallbackColor, ...style }}>
      <span className="text-[11px] font-semibold tracking-[0.14em] text-[#4a463f] uppercase">{fallbackLabel}</span>
    </div>
  )
}
