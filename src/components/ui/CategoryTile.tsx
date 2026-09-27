import { toneFor } from '../../lib/colors'
import { framingStyle, type Framing } from '../../lib/framing'

type Props = { name: string; slug: string; coverUrl: string | null; framing?: Framing; caption?: string }

/**
 * Mosaico de una categoría (home). Lo usa también el panel de admin como vista previa,
 * así lo que ves al subir la portada es EXACTAMENTE lo que sale en la tienda.
 * La foto llena el cuadro y respeta el encuadre (zoom/posición) que se eligió en el panel.
 */
export function CategoryTile({ name, slug, coverUrl, framing, caption }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {coverUrl ? (
        <div className="relative aspect-[4/5] overflow-hidden bg-white">
          {/* El zoom del hover va en un contenedor aparte para no pisar el zoom del encuadre */}
          <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
            <img src={coverUrl} alt="" loading="lazy" className="h-full w-full" style={framingStyle(framing)} />
          </div>
        </div>
      ) : (
        <div className="flex aspect-[4/5] items-end p-[18px]" style={{ backgroundColor: toneFor(slug) }}>
          <span className="text-[11px] font-semibold tracking-[0.14em] text-[#4a463f] uppercase">[Foto · {name}]</span>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[17px] font-semibold group-hover:underline">{name}</span>
        {caption && <span className="shrink-0 text-[13px] text-muted">{caption}</span>}
      </div>
    </div>
  )
}
