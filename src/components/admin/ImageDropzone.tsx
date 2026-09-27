import { useId, useRef, useState, type DragEvent } from 'react'
import { ACCEPT_ATTR, ACCEPT_LABEL, MAX_FILES_PER_BATCH, rejectReason } from '../../features/admin/uploads/fileTypes'

type Props = {
  onFiles: (files: File[]) => void
  disabled?: boolean
  multiple?: boolean // false = una sola foto (portada de categoría)
  label?: string
}

/** Zona para arrastrar y soltar fotos (o dar clic para elegirlas). */
export function ImageDropzone({ onFiles, disabled, multiple = true, label = 'Arrastra tus fotos aquí o da clic para elegirlas' }: Props) {
  const max = multiple ? MAX_FILES_PER_BATCH : 1
  const inputRef = useRef<HTMLInputElement>(null)
  const hintId = useId()
  const [dragging, setDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // Validamos en el front para avisar rápido; el back vuelve a validar (tamaño y los bytes reales)
  const accept = (list: FileList | null) => {
    const all = Array.from(list ?? [])
    const problems = all.map(rejectReason).filter((r): r is string => r !== null)
    const good = all.filter((f) => rejectReason(f) === null)
    if (good.length > max) problems.push(max === 1 ? 'Solo se usa una foto: tomamos la primera' : `Solo se toman las primeras ${max} imágenes de cada tanda`)
    setErrors(problems)
    if (good.length > 0) onFiles(good.slice(0, max))
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (!disabled) accept(e.dataTransfer.files)
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        aria-describedby={hintId}
        className={`flex min-h-36 w-full flex-col items-center justify-center gap-2 border-2 border-dashed px-6 py-8 text-center transition-colors duration-200 ${
          dragging ? 'border-ink bg-sand' : 'border-field bg-white hover:border-ink'
        } disabled:opacity-60`}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 16V4" />
          <path d="M7 9l5-5 5 5" />
          <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
        </svg>
        <span className="text-sm font-semibold">{label}</span>
        <span id={hintId} className="text-xs text-subtle">
          {ACCEPT_LABEL} · hasta 100 MB{multiple ? ` cada una · hasta ${MAX_FILES_PER_BATCH} a la vez` : ''}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple={multiple}
        hidden
        onChange={(e) => {
          accept(e.target.files)
          e.target.value = '' // permite volver a elegir el mismo archivo
        }}
      />
      {errors.length > 0 && (
        <ul role="alert" className="flex animate-fade-in flex-col gap-1 text-sm font-medium text-danger">
          {errors.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
