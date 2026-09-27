import { useState } from 'react'
import { canPreview, extensionOf } from '../../features/admin/uploads/fileTypes'

/**
 * Miniatura de un archivo local. TIFF, HEIC o fotos enormes no se pueden (o no conviene)
 * dibujar en el navegador: para esas mostramos una etiqueta con el formato.
 */
export function FileThumb({ file, url, className = '' }: { file: File; url?: string | null; className?: string }) {
  if (url) return <img src={url} alt="" className={`h-full w-full object-contain ${className}`} />
  if (canPreview(file)) return <LocalPreview file={file} className={className} />
  return <Badge file={file} className={className} />
}

function Badge({ file, className }: { file: File; className: string }) {
  return (
    <span className={`flex h-full w-full items-center justify-center bg-sand text-[11px] font-semibold tracking-wide text-muted ${className}`}>
      {extensionOf(file.name)}
    </span>
  )
}

function LocalPreview({ file, className }: { file: File; className: string }) {
  // URL temporal del archivo local; se libera en cuanto la imagen se dibujó (o falló)
  const [url] = useState(() => URL.createObjectURL(file))
  const [broken, setBroken] = useState(false)
  // Dice .jpg pero el navegador no la pudo leer: mostramos la etiqueta en vez del ícono roto
  if (broken) return <Badge file={file} className={className} />
  return (
    <img
      src={url}
      alt=""
      className={`h-full w-full object-contain ${className}`}
      onLoad={() => URL.revokeObjectURL(url)}
      onError={() => {
        URL.revokeObjectURL(url)
        setBroken(true)
      }}
    />
  )
}
