import { useMemo, useSyncExternalStore } from 'react'
import { uploadStore } from './uploadManager'

/** Subidas en curso (todas, o solo las de un destino: "product:12", "category:3"). Se re-renderiza con cada avance. */
export function useUploads(key?: string) {
  const all = useSyncExternalStore(uploadStore.subscribe, uploadStore.getSnapshot)
  return useMemo(() => (key ? all.filter((i) => i.targetKey === key) : all), [all, key])
}

/** Cuántas imágenes siguen en camino (para el aviso del menú del panel). */
export function useActiveUploadCount() {
  const all = useSyncExternalStore(uploadStore.subscribe, uploadStore.getSnapshot)
  return useMemo(() => all.filter((i) => i.status !== 'done' && i.status !== 'error').length, [all])
}
