// Evita mandar la misma vista dos veces seguidas: en desarrollo StrictMode monta los efectos
// dos veces, y la primera visita aún no tiene la cookie del visitante (el back contaría 2).
const sent = new Map<string, number>()
const WINDOW_MS = 30 * 60 * 1000

export function shouldSendView(slug: string, now = Date.now()) {
  const last = sent.get(slug)
  if (last !== undefined && now - last < WINDOW_MS) return false
  sent.set(slug, now)
  return true
}
