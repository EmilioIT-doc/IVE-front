import { store } from '../../../app/store'
import { refreshSession, type ApiErrorBody } from '../../../services/api'
import { adminApi } from '../adminApi'

/**
 * Gestor de subidas pesadas (fuera de React y de Redux).
 *
 * ¿Por qué no en Redux? Un File no es serializable y el progreso cambia decenas de
 * veces por segundo. Aquí vive el estado y los componentes se suscriben con
 * useSyncExternalStore (ver useUploads.ts). Como es un módulo, las subidas siguen
 * aunque navegues a otra pantalla del panel.
 *
 * Flujo por archivo:
 *   pending → uploading (pedazos de 8 MB, reintentos) → processing (el back la optimiza) → done
 *                                  ↘ error (con "Reintentar": continúa desde el último pedazo)
 */

export type UploadStatus = 'pending' | 'uploading' | 'processing' | 'done' | 'error'

/** A dónde va la foto: la galería de un producto o la portada de una categoría. */
export type UploadTarget = { kind: 'product' | 'category' | 'site'; id: string }

/** "product:12" / "category:3": para filtrar las subidas de una pantalla. */
export const targetKey = (t: UploadTarget) => `${t.kind}:${t.id}`

export type UploadItem = {
  key: string
  target: UploadTarget
  targetKey: string
  file: File
  name: string
  size: number
  sent: number
  status: UploadStatus
  error: string | null
  retryable: boolean
  uploadId: string | null
  imageUrl: string | null
  speed: number // bytes por segundo
  eta: number | null // segundos restantes
}

type ServerUpload = {
  id: string
  status: 'uploading' | 'queued' | 'processing' | 'ready' | 'failed' | 'canceled'
  receivedBytes: number
  error: { code: string; message: string } | null
  image: { id: string; url: string } | null
}

/** Archivos subiéndose al mismo tiempo. Más no acelera: el ancho de banda es el mismo. */
const MAX_PARALLEL = 3
/** Reintentos seguidos de un mismo pedazo antes de rendirse. */
const MAX_RETRIES = 5
const POLL_MS = 1500
const DONE_VISIBLE_MS = 4000

let items: UploadItem[] = []
let chunkSize = 8 * 1024 * 1024 // el back nos dice el real al abrir el lote
const listeners = new Set<() => void>()
const controllers = new Map<string, AbortController>()
const timing = new Map<string, { at: number; from: number }>()

// ------------------------------------------------------------------ store

function emit() {
  for (const listener of listeners) listener()
}

const get = (key: string) => items.find((i) => i.key === key)

function patch(key: string, changes: Partial<UploadItem>) {
  if (!get(key)) return
  items = items.map((i) => (i.key === key ? { ...i, ...changes } : i))
  emit()
}

function drop(key: string) {
  items = items.filter((i) => i.key !== key)
  controllers.delete(key)
  timing.delete(key)
  emit()
}

export const uploadStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  getSnapshot: () => items,
}

// ------------------------------------------------------------------ HTTP

class HttpError extends Error {
  status: number
  code: string
  details: unknown
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

type RequestOptions = { json?: unknown; blob?: Blob; signal?: AbortSignal; onProgress?: (loaded: number) => void }

const abortError = () => new DOMException('Cancelado', 'AbortError')
const isAbort = (err: unknown) => err instanceof DOMException && err.name === 'AbortError'

/**
 * Usamos XMLHttpRequest y no fetch porque fetch todavía no reporta el progreso
 * de SUBIDA; XHR sí (xhr.upload.onprogress) y así la barra avanza suave.
 */
function send<T>(method: string, url: string, opts: RequestOptions): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (opts.signal?.aborted) return reject(abortError())
    const xhr = new XMLHttpRequest()
    xhr.open(method, `/api${url}`)
    xhr.withCredentials = true
    xhr.responseType = 'json'
    if (opts.json !== undefined) xhr.setRequestHeader('Content-Type', 'application/json')
    if (opts.blob) xhr.setRequestHeader('Content-Type', 'application/octet-stream')
    const onProgress = opts.onProgress
    if (onProgress) xhr.upload.onprogress = (e) => onProgress(e.loaded)

    const onAbort = () => xhr.abort()
    opts.signal?.addEventListener('abort', onAbort, { once: true })
    const cleanup = () => opts.signal?.removeEventListener('abort', onAbort)

    xhr.onload = () => {
      cleanup()
      if (xhr.status >= 200 && xhr.status < 300) return resolve(xhr.response as T)
      const body = xhr.response as ApiErrorBody | null
      reject(new HttpError(xhr.status, body?.error?.code ?? `HTTP_${xhr.status}`, body?.error?.message ?? 'El servidor respondió con un error', body?.error?.details))
    }
    xhr.onerror = () => {
      cleanup()
      reject(new HttpError(0, 'NETWORK', 'Se perdió la conexión con el servidor'))
    }
    xhr.onabort = () => {
      cleanup()
      reject(abortError())
    }
    xhr.send(opts.blob ?? (opts.json !== undefined ? JSON.stringify(opts.json) : null))
  })
}

/** Igual que send, pero si el access token caducó a media subida, lo renueva y reintenta. */
async function request<T>(method: string, url: string, opts: RequestOptions = {}): Promise<T> {
  try {
    return await send<T>(method, url, opts)
  } catch (err) {
    if (err instanceof HttpError && err.status === 401 && err.code === 'TOKEN_EXPIRED' && (await refreshSession())) {
      return send<T>(method, url, opts)
    }
    throw err
  }
}

/** Fallas que vale la pena reintentar solas: red caída, back reiniciándose, saturación. */
const isTransient = (err: unknown) =>
  err instanceof HttpError && (err.status === 0 || err.status >= 500 || err.status === 408 || err.status === 429)

/** ¿Tiene sentido mostrar "Reintentar"? No, si el archivo en sí es inválido. */
const canRetry = (err: unknown) => !(err instanceof HttpError && [400, 403, 404, 413, 415].includes(err.status))

function messageOf(err: unknown) {
  if (err instanceof HttpError) {
    if (err.status === 401) return 'Tu sesión expiró. Inicia sesión de nuevo y dale Reintentar.'
    return err.message
  }
  return 'Algo salió mal con esta imagen'
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(abortError())
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => (clearTimeout(timer), reject(abortError())), { once: true })
  })
}

/** Espera exponencial con un poco de azar: 1 s, 2 s, 4 s… (máx. 15 s) */
const backoff = (attempt: number) => Math.min(1000 * 2 ** (attempt - 1), 15_000) + Math.random() * 300

const fetchStatus = (uploadId: string) =>
  request<{ upload: ServerUpload }>('GET', `/admin/uploads/${uploadId}`).then((r) => r.upload)

// ------------------------------------------------------------------ flujo

function progress(key: string, sent: number) {
  const item = get(key)
  if (!item) return
  const t = timing.get(key)
  let { speed, eta } = item
  if (t) {
    const secs = (performance.now() - t.at) / 1000
    if (secs > 0.5) {
      speed = (sent - t.from) / secs
      eta = speed > 0 ? (item.size - sent) / speed : null
    }
  }
  patch(key, { sent, speed, eta })
}

/** Arranca subidas hasta llenar los MAX_PARALLEL lugares; el resto espera "En cola". */
function pump() {
  const active = items.filter((i) => i.status === 'uploading').length
  const next = items.filter((i) => i.status === 'pending' && i.uploadId).slice(0, Math.max(0, MAX_PARALLEL - active))
  for (const item of next) void uploadItem(item.key)
}

const SESSIONS_BASE: Record<UploadTarget['kind'], string> = {
  product: '/admin/products',
  category: '/admin/categories',
  site: '/admin/site-images', // id = lugar del sitio (home_hero, home_editorial)
}
const sessionsUrl = (t: UploadTarget) => `${SESSIONS_BASE[t.kind]}/${t.id}/uploads`

/** Pide al back una sesión por archivo (un solo request para todo el lote). */
async function openSessions(target: UploadTarget, batch: UploadItem[]) {
  try {
    const res = await request<{ chunkSize: number; uploads: ServerUpload[] }>('POST', sessionsUrl(target), {
      json: { files: batch.map((i) => ({ fileName: i.name, size: i.size, mimeType: i.file.type || null })) },
    })
    chunkSize = res.chunkSize
    res.uploads.forEach((u, idx) => {
      const item = batch[idx]!
      if (get(item.key)) patch(item.key, { uploadId: u.id })
      else void request('DELETE', `/admin/uploads/${u.id}`).catch(() => undefined) // lo quitaron mientras se abría
    })
  } catch (err) {
    for (const item of batch) patch(item.key, { status: 'error', error: messageOf(err), retryable: canRetry(err) })
  }
  pump()
}

async function uploadItem(key: string) {
  const start = get(key)
  if (!start?.uploadId) return
  const { uploadId, file, size } = start
  const ctrl = new AbortController()
  controllers.set(key, ctrl)
  timing.set(key, { at: performance.now(), from: start.sent })
  patch(key, { status: 'uploading', error: null, speed: 0, eta: null })

  let offset = start.sent
  let failures = 0
  try {
    while (offset < size) {
      const from = offset
      try {
        const res = await request<{ receivedBytes: number }>('PUT', `/admin/uploads/${uploadId}?offset=${from}`, {
          blob: file.slice(from, Math.min(from + chunkSize, size)), // un pedazo, sin leer todo el archivo a memoria
          signal: ctrl.signal,
          onProgress: (loaded) => progress(key, from + loaded),
        })
        offset = res.receivedBytes
        failures = 0
        progress(key, offset)
      } catch (err) {
        if (isAbort(err)) throw err
        // El back ya tenía otra cantidad (p. ej. el pedazo sí llegó pero se perdió la respuesta)
        if (err instanceof HttpError && err.code === 'OFFSET_MISMATCH') {
          const details = err.details as { receivedBytes?: number } | undefined
          offset = details?.receivedBytes ?? (await fetchStatus(uploadId)).receivedBytes
          progress(key, offset)
          continue
        }
        if (isTransient(err) && ++failures <= MAX_RETRIES) {
          patch(key, { error: `Conexión inestable, reintentando (${failures}/${MAX_RETRIES})…` })
          await sleep(backoff(failures), ctrl.signal)
          patch(key, { error: null })
          continue
        }
        throw err
      }
    }
    await request('POST', `/admin/uploads/${uploadId}/complete`, { signal: ctrl.signal })
    patch(key, { status: 'processing', sent: size, eta: null })
  } catch (err) {
    if (!isAbort(err)) patch(key, { status: 'error', error: messageOf(err), retryable: canRetry(err) })
    return
  } finally {
    controllers.delete(key)
    timing.delete(key)
    pump() // se liberó un lugar: que entre el siguiente
  }
  void watchProcessing(key, uploadId)
}

/** El back optimiza la imagen en su cola; preguntamos cada 1.5 s cómo va. */
async function watchProcessing(key: string, uploadId: string) {
  let failures = 0
  while (get(key)?.status === 'processing') {
    await sleep(POLL_MS)
    try {
      const upload = await fetchStatus(uploadId)
      failures = 0
      if (upload.status === 'ready') return finish(key, upload)
      if (upload.status === 'failed' || upload.status === 'canceled') {
        return patch(key, { status: 'error', error: upload.error?.message ?? 'No se pudo procesar la imagen', retryable: false })
      }
    } catch (err) {
      if (!isTransient(err) || ++failures > 20) return patch(key, { status: 'error', error: messageOf(err), retryable: true })
    }
  }
}

// Si terminan 5 fotos casi juntas, refrescamos el producto (o la categoría) una sola vez
const refreshTimers = new Map<string, ReturnType<typeof setTimeout>>()
function refreshTarget(target: UploadTarget) {
  const key = targetKey(target)
  clearTimeout(refreshTimers.get(key))
  refreshTimers.set(
    key,
    setTimeout(() => {
      refreshTimers.delete(key)
      const tags =
        target.kind === 'product'
          ? ([{ type: 'AdminProducts', id: target.id }, { type: 'AdminProducts', id: 'LIST' }] as const)
          : target.kind === 'category'
            ? ([{ type: 'AdminCategories', id: target.id }, { type: 'AdminCategories', id: 'LIST' }, 'Categories'] as const)
            : (['Site'] as const)
      store.dispatch(adminApi.util.invalidateTags([...tags]))
    }, 300),
  )
}

function finish(key: string, upload: ServerUpload) {
  const item = get(key)
  if (!item) return
  patch(key, { status: 'done', error: null, imageUrl: upload.image?.url ?? null })
  refreshTarget(item.target)
  setTimeout(() => drop(key), DONE_VISIBLE_MS)
}

// ------------------------------------------------------------------ API pública

/** Agrega archivos a la cola de un producto (o la portada de una categoría). Se suben MAX_PARALLEL a la vez. */
export async function enqueueUploads(target: UploadTarget, files: File[]) {
  if (files.length === 0) return
  const batch: UploadItem[] = files.map((file) => ({
    key: crypto.randomUUID(),
    target,
    targetKey: targetKey(target),
    file,
    name: file.name,
    size: file.size,
    sent: 0,
    status: 'pending',
    error: null,
    retryable: false,
    uploadId: null,
    imageUrl: null,
    speed: 0,
    eta: null,
  }))
  items = [...items, ...batch]
  emit()
  await openSessions(target, batch)
}

/** Reintenta desde donde se quedó (si el back todavía tiene la subida) o desde cero. */
export async function retryUpload(key: string) {
  const item = get(key)
  if (!item || item.status !== 'error') return
  patch(key, { status: 'pending', error: null })
  if (item.uploadId) {
    try {
      const upload = await fetchStatus(item.uploadId)
      if (upload.status === 'uploading') {
        patch(key, { sent: upload.receivedBytes })
        return pump()
      }
      if (upload.status === 'queued' || upload.status === 'processing') {
        patch(key, { status: 'processing', sent: item.size })
        return void watchProcessing(key, item.uploadId)
      }
      if (upload.status === 'ready') return finish(key, upload)
    } catch {
      // la sesión ya no sirve: abrimos otra abajo
    }
  }
  patch(key, { uploadId: null, sent: 0 })
  await openSessions(item.target, [get(key)!])
}

/** Cancela (si está en cola o subiendo) o quita de la lista (si falló o terminó). */
export function removeUpload(key: string) {
  const item = get(key)
  if (!item) return
  controllers.get(key)?.abort()
  drop(key)
  if (item.uploadId && item.status !== 'done' && item.status !== 'processing') {
    void request('DELETE', `/admin/uploads/${item.uploadId}`).catch(() => undefined)
  }
  pump()
}

/** ¿Hay algo que se perdería si cierras la pestaña? (lo que ya está "processing" sigue en el back) */
export const hasPendingTransfers = () => items.some((i) => i.status === 'pending' || i.status === 'uploading')

// Aviso del navegador si intentas cerrar la pestaña a media subida
window.addEventListener('beforeunload', (e) => {
  if (hasPendingTransfers()) e.preventDefault()
})
