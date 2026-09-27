/** Mismos límites que el back (lib/uploads.ts). */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024
export const MAX_FILES_PER_BATCH = 20

// En Windows las HEIC suelen llegar con type "" → validamos también por extensión
const EXTENSIONS = /\.(jpe?g|jfif|png|webp|avif|tiff?|gif|heic|heif)$/i
const MIME = /^image\/(jpeg|png|webp|avif|tiff|gif|heic|heif)$/

/** Para el <input type="file">: cualquier imagen + las extensiones que algunos sistemas no marcan como imagen. */
export const ACCEPT_ATTR = 'image/*,.heic,.heif,.tif,.tiff'
export const ACCEPT_LABEL = 'JPG, PNG, WEBP, AVIF, TIFF, GIF o HEIC'

/** Mensaje de por qué no se acepta el archivo, o null si está bien. */
export function rejectReason(file: File): string | null {
  if (!MIME.test(file.type) && !EXTENSIONS.test(file.name)) return `"${file.name}" no es una imagen compatible`
  if (file.size > MAX_UPLOAD_BYTES) return `"${file.name}" pesa ${formatBytes(file.size)} (máximo 100 MB)`
  if (file.size < 100) return `"${file.name}" está vacío`
  return null
}

/** Solo estas se pueden mostrar en el navegador antes de subirlas (TIFF y HEIC no). */
export function canPreview(file: File) {
  return /^image\/(jpeg|png|webp|avif|gif)$/.test(file.type) && file.size <= 15 * 1024 * 1024
}

/** "JPG", "HEIC"… para la etiqueta cuando no hay vista previa. */
export function extensionOf(name: string) {
  return (name.split('.').pop() ?? '').toUpperCase().slice(0, 5)
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function formatSeconds(s: number) {
  if (!Number.isFinite(s) || s < 0) return ''
  if (s < 60) return `${Math.ceil(s)} s`
  return `${Math.floor(s / 60)} min ${Math.ceil(s % 60)} s`
}
