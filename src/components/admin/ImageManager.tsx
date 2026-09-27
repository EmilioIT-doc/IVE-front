import { useState } from 'react'
import { useDeleteImageMutation, useReorderImagesMutation } from '../../features/admin/adminApi'
import type { AdminImage } from '../../features/admin/types'
import { enqueueUploads } from '../../features/admin/uploads/uploadManager'
import { getErrorMessage } from '../../services/api'
import { ArrowLeftIcon, ArrowRightIcon } from '../ui/icons'
import { FileThumb } from './FileThumb'
import { ImageDropzone } from './ImageDropzone'
import { UploadQueue } from './UploadQueue'

const ROLE = ['Portada', 'Hover (espalda)']

/** Fotos de un producto YA creado: subir, reordenar y borrar (cada acción va directo a la API). */
export function ImageManager({ productId, images }: { productId: string; images: AdminImage[] }) {
  const [reorder, reorderState] = useReorderImagesMutation()
  const [remove] = useDeleteImageMutation()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async (action: Promise<unknown>) => {
    setError(null)
    try {
      await action
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const move = (index: number, delta: number) => {
    const ids = images.map((i) => i.id)
    const target = index + delta
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target]!, ids[index]!]
    void run(reorder({ id: productId, ids }).unwrap())
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted">
        La <strong className="text-ink">primera</strong> foto es la portada del producto y la <strong className="text-ink">segunda</strong> aparece al pasar el mouse en el catálogo.
        Las fotos se optimizan solas (WebP, máx. 2400 px), así que puedes subir los originales pesados.
      </p>

      {images.length > 0 && (
        <ul className={`grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 ${reorderState.isLoading ? 'opacity-60' : ''}`}>
          {images.map((img, i) => (
            <li key={img.id} className="flex animate-fade-in flex-col gap-2">
              <div className="relative aspect-[3/4] overflow-hidden bg-white ring-1 ring-line">
                <img src={img.url} alt={img.altText ?? ''} className="h-full w-full object-contain" />
                {ROLE[i] && (
                  <span className="absolute top-2 left-2 bg-ink px-2 py-1 text-[10px] font-semibold tracking-wide text-bone uppercase">{ROLE[i]}</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex gap-1">
                  <button type="button" aria-label="Mover a la izquierda" disabled={i === 0} onClick={() => move(i, -1)} className="flex size-9 items-center justify-center border border-field hover:border-ink disabled:opacity-30">
                    <ArrowLeftIcon size={16} />
                  </button>
                  <button type="button" aria-label="Mover a la derecha" disabled={i === images.length - 1} onClick={() => move(i, 1)} className="flex size-9 items-center justify-center border border-field hover:border-ink disabled:opacity-30">
                    <ArrowRightIcon size={16} />
                  </button>
                </div>
                {confirmId === img.id ? (
                  <span className="flex animate-fade-in items-center gap-2 text-xs">
                    <button type="button" className="h-9 font-semibold text-danger underline" onClick={() => { setConfirmId(null); void run(remove({ id: productId, imageId: img.id }).unwrap()) }}>
                      Sí, borrar
                    </button>
                    <button type="button" className="h-9 underline" onClick={() => setConfirmId(null)}>No</button>
                  </span>
                ) : (
                  <button type="button" className="h-9 text-xs text-danger underline" onClick={() => setConfirmId(img.id)}>
                    Eliminar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p role="alert" className="animate-fade-in text-sm font-medium text-danger">{error}</p>}

      <UploadQueue target={{ kind: 'product', id: productId }} />
      <ImageDropzone onFiles={(files) => void enqueueUploads({ kind: 'product', id: productId }, files)} />
    </div>
  )
}

/** Fotos elegidas ANTES de crear el producto: se muestran y se suben al guardar. */
export function PendingImages({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted">
        La <strong className="text-ink">primera</strong> foto será la portada y la <strong className="text-ink">segunda</strong> el hover del catálogo.
        Se suben al crear el producto y verás el avance de cada una.
      </p>
      {files.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {files.map((file, i) => (
            <li key={`${file.name}-${file.size}-${file.lastModified}`} className="flex animate-fade-in flex-col gap-2">
              <div className="relative aspect-[3/4] overflow-hidden bg-white ring-1 ring-line">
                <FileThumb file={file} />
                {ROLE[i] && <span className="absolute top-2 left-2 bg-ink px-2 py-1 text-[10px] font-semibold tracking-wide text-bone uppercase">{ROLE[i]}</span>}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-subtle" title={file.name}>{file.name}</span>
                <button type="button" className="h-9 shrink-0 text-xs text-danger underline" onClick={() => onChange(files.filter((_, j) => j !== i))}>
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ImageDropzone onFiles={(more) => onChange([...files, ...more].slice(0, 20))} />
    </div>
  )
}
