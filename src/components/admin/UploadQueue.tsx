import { formatBytes, formatSeconds } from '../../features/admin/uploads/fileTypes'
import { removeUpload, retryUpload, targetKey, type UploadItem, type UploadTarget } from '../../features/admin/uploads/uploadManager'
import { useUploads } from '../../features/admin/uploads/useUploads'
import { FileThumb } from './FileThumb'

/** Lista de subidas de un producto (o de una portada) con su progreso en vivo. */
export function UploadQueue({ target }: { target: UploadTarget }) {
  const uploads = useUploads(targetKey(target))
  if (uploads.length === 0) return null

  const transferring = uploads.filter((u) => u.status === 'pending' || u.status === 'uploading')
  const processing = uploads.filter((u) => u.status === 'processing').length
  const total = transferring.reduce((sum, u) => sum + u.size, 0)
  const sent = transferring.reduce((sum, u) => sum + u.sent, 0)

  return (
    <section aria-label="Subidas en curso" className="flex animate-fade-in flex-col gap-3 border border-line bg-white p-4">
      <p className="text-sm font-semibold" aria-live="polite">
        {transferring.length > 0
          ? `Subiendo ${transferring.length} ${transferring.length === 1 ? 'imagen' : 'imágenes'} · ${formatBytes(sent)} de ${formatBytes(total)}`
          : processing > 0
            ? `Optimizando ${processing} ${processing === 1 ? 'imagen' : 'imágenes'}…`
            : 'Subidas'}
      </p>
      <ul className="flex flex-col divide-y divide-line">
        {uploads.map((u) => (
          <UploadRow key={u.key} upload={u} />
        ))}
      </ul>
    </section>
  )
}

function UploadRow({ upload: u }: { upload: UploadItem }) {
  const percent = u.size > 0 ? Math.round((u.sent / u.size) * 100) : 0
  const label = `${u.name}: ${statusText(u)}`

  return (
    <li className={`flex animate-fade-in items-center gap-4 py-3 transition-opacity duration-500 ${u.status === 'done' ? 'opacity-70' : ''}`}>
      <div className="h-[72px] w-14 shrink-0 overflow-hidden bg-white ring-1 ring-line">
        <FileThumb file={u.file} url={u.imageUrl} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate text-sm font-medium" title={u.name}>{u.name}</span>
          <span className="shrink-0 text-xs text-subtle">{formatBytes(u.size)}</span>
        </div>

        {/* Barra de progreso: con % mientras sube; "trabajando" mientras el back la optimiza */}
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={u.status === 'processing' ? undefined : percent}
          className="relative h-1.5 overflow-hidden bg-sand"
        >
          {u.status === 'processing' ? (
            <span className="absolute inset-y-0 left-0 w-2/5 animate-indeterminate bg-olive" />
          ) : (
            <span
              className={`absolute inset-y-0 left-0 transition-[width] duration-300 ease-out ${u.status === 'error' ? 'bg-danger' : u.status === 'done' ? 'bg-olive' : 'bg-ink'}`}
              style={{ width: `${u.status === 'done' ? 100 : percent}%` }}
            />
          )}
        </div>

        <p className={`text-xs ${u.status === 'error' || u.error ? 'text-danger' : u.status === 'done' ? 'font-semibold text-olive' : 'text-muted'}`}>
          {statusText(u)}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {u.status === 'error' && u.retryable && (
          <button type="button" onClick={() => void retryUpload(u.key)} className="h-8 text-xs font-semibold underline">
            Reintentar
          </button>
        )}
        {(u.status === 'pending' || u.status === 'uploading' || u.status === 'error') && (
          <button type="button" onClick={() => removeUpload(u.key)} className="h-8 text-xs text-danger underline">
            {u.status === 'error' ? 'Quitar' : 'Cancelar'}
          </button>
        )}
      </div>
    </li>
  )
}

function statusText(u: UploadItem) {
  switch (u.status) {
    case 'pending':
      return u.sent > 0 ? `En cola · ${formatBytes(u.sent)} ya subidos` : 'En cola'
    case 'uploading': {
      if (u.error) return u.error // "reintentando…"
      const parts = [`${formatBytes(u.sent)} de ${formatBytes(u.size)}`]
      if (u.speed > 0) parts.push(`${formatBytes(u.speed)}/s`)
      if (u.eta !== null && u.eta > 0) parts.push(`quedan ${formatSeconds(u.eta)}`)
      return parts.join(' · ')
    }
    case 'processing':
      return 'Optimizando imagen…'
    case 'done':
      return 'Lista ✓'
    case 'error':
      return u.error ?? 'Error'
  }
}
