import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Notice, Section } from '../../components/admin/AdminBits'
import { ImageDropzone } from '../../components/admin/ImageDropzone'
import { ImageFramingEditor } from '../../components/admin/ImageFramingEditor'
import { UploadQueue } from '../../components/admin/UploadQueue'
import { ErrorState } from '../../components/ui/ErrorState'
import { SiteImageBlock } from '../../components/ui/SiteImageBlock'
import { enqueueUploads } from '../../features/admin/uploads/uploadManager'
import {
  useGetSiteImagesQuery,
  useRemoveSiteImageMutation,
  useUpdateSiteImageAltMutation,
  useUpdateSiteImageFramingMutation,
  type SiteImage,
  type SiteSlot,
} from '../../features/site/siteApi'
import { SLOT_INFO } from '../../features/site/slots'
import { getErrorMessage } from '../../services/api'

/** /admin/inicio: la portada del home y la foto editorial de arriba del footer. */
export function AdminSitePage() {
  const { data, isLoading, error, refetch } = useGetSiteImagesQuery()

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-5xl leading-none">Fotos del inicio</h1>
          <p className="text-sm text-muted">Se optimizan solas (WebP), así que puedes subir el original pesado, hasta 100 MB.</p>
        </div>
        <Link to="/" className="text-sm font-semibold">Ver el inicio →</Link>
      </div>

      {error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : isLoading || !data ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : (
        (Object.keys(SLOT_INFO) as SiteSlot[]).map((slot) => <SlotEditor key={slot} slot={slot} image={data[slot]} />)
      )}
    </div>
  )
}

function SlotEditor({ slot, image }: { slot: SiteSlot; image: SiteImage }) {
  const info = SLOT_INFO[slot]
  const target = { kind: 'site', id: slot } as const
  const [removeImage, removeState] = useRemoveSiteImageMutation()
  const [error, setError] = useState<string | null>(null)
  const [editingFrame, setEditingFrame] = useState(false)
  const [saveFraming] = useUpdateSiteImageFramingMutation()

  const onRemove = async () => {
    setError(null)
    try {
      await removeImage(slot).unwrap()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const preview = (aspect: number, width: string) => (
    <SiteImageBlock
      url={image.url}
      alt={image.altText}
      framing={image.framing}
      fallbackLabel={info.fallbackLabel}
      fallbackColor={info.fallbackColor}
      className="ring-1 ring-line"
      style={{ aspectRatio: aspect, width }}
    />
  )

  return (
    <Section title={info.title} description={info.where}>
      <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Vista previa: las mismas proporciones que tiene en el home en cada tamaño de pantalla */}
        <div className="flex flex-wrap items-end gap-6">
          {info.frames.map((frame) => (
            <figure key={frame.label} className="flex flex-col gap-2">
              <figcaption className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">{frame.label}</figcaption>
              {preview(frame.aspect, `${frame.previewWidth}px`)}
            </figure>
          ))}
          {image.url && (
            <button type="button" onClick={() => setEditingFrame(true)} className="h-11 w-full border border-ink text-sm font-semibold hover:bg-ink hover:text-bone sm:w-auto sm:px-5">
              Editar encuadre (zoom y posición)
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {/* Recomendación de tamaño */}
          <div className="flex flex-col gap-1 border-l-2 border-olive bg-[#dfe3d8]/60 px-4 py-3 text-sm">
            <span>
              <strong>Tamaño recomendado:</strong> {info.recommended}
            </span>
            <span className="text-muted">{info.minimum}</span>
            <span className="text-muted">{info.tip}</span>
          </div>

          <UploadQueue target={target} />
          <ImageDropzone
            multiple={false}
            label={image.url ? 'Arrastra otra foto para reemplazarla' : 'Arrastra la foto aquí o da clic para elegirla'}
            onFiles={(files) => void enqueueUploads(target, files)}
          />
          {image.url && (
            <button type="button" onClick={() => void onRemove()} disabled={removeState.isLoading} className="h-9 self-start text-xs text-danger underline disabled:opacity-50">
              Quitar foto (vuelve el bloque de color)
            </button>
          )}
          {error && <p role="alert" className="animate-fade-in text-sm font-medium text-danger">{error}</p>}

          {/* key: si cambia el texto guardado, el campo arranca con el valor nuevo */}
          <AltForm key={image.altText ?? ''} slot={slot} initial={image.altText ?? ''} />
        </div>
      </div>

      {editingFrame && image.url && (
        <ImageFramingEditor
          title={info.title}
          url={image.url}
          initial={image.framing}
          frames={info.frames}
          onClose={() => setEditingFrame(false)}
          onSave={async (framing) => {
            try {
              await saveFraming({ slot, framing }).unwrap()
            } catch (err) {
              throw new Error(getErrorMessage(err))
            }
          }}
        />
      )}
    </Section>
  )
}

/** Descripción de la foto: la leen los lectores de pantalla (y ayuda al SEO). */
function AltForm({ slot, initial }: { slot: SiteSlot; initial: string }) {
  const [value, setValue] = useState(initial)
  const [save, saveState] = useUpdateSiteImageAltMutation()
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const id = `alt-${slot}`

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMsg(null)
    try {
      await save({ slot, altText: value.trim() || null }).unwrap()
      setMsg({ tone: 'ok', text: 'Descripción guardada.' })
    } catch (err) {
      setMsg({ tone: 'error', text: getErrorMessage(err) })
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 pt-2">
      <label htmlFor={id} className="text-[13px] font-semibold">Descripción de la foto</label>
      <div className="flex flex-wrap gap-3">
        <input
          id={id}
          value={value}
          maxLength={200}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ej. Modelo con T-shirt blanca de IVE en la calle"
          className="h-12 min-w-0 flex-1 border border-field bg-white px-4 text-[15px]"
        />
        <button type="submit" disabled={saveState.isLoading || value === initial} className="h-12 bg-ink px-6 text-sm font-semibold text-bone hover:bg-olive disabled:opacity-40">
          Guardar
        </button>
      </div>
      <span className="text-xs text-subtle">La leen los lectores de pantalla para personas ciegas. No se ve en la página.</span>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
    </form>
  )
}
