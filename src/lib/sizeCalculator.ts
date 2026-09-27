/**
 * Calculadora de talla para playeras (aproximada).
 * Combina peso (65%) y estatura (35%) contra tablas típicas de México,
 * luego ajusta por cómo le gusta que le quede y elige la talla más cercana
 * ENTRE LAS QUE TIENE EL PRODUCTO.
 */
export type Body = 'hombre' | 'mujer'
export type Fit = 'ajustado' | 'regular' | 'holgado'

const SCALE = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const

// Límites superiores de cada talla: [XS, S, M, L, XL] (arriba del último = XXL)
const TABLES: Record<Body, { weight: number[]; height: number[] }> = {
  hombre: { weight: [55, 65, 75, 85, 97], height: [160, 170, 178, 185, 192] },
  mujer: { weight: [48, 56, 64, 73, 83], height: [152, 160, 167, 173, 180] },
}

/** Índice continuo (0 = XS … 5 = XXL) interpolando dentro de cada rango. */
function continuousIndex(value: number, limits: number[]) {
  const lows = [limits[0]! - (limits[1]! - limits[0]!), ...limits] // límite inferior aproximado de XS
  for (let i = 0; i < limits.length; i++) {
    if (value <= limits[i]!) {
      const from = lows[i]!
      const to = limits[i]!
      return i + Math.max(0, Math.min(1, (value - from) / (to - from))) - 0.5
    }
  }
  return limits.length + 0.3 // XXL
}

export type SizeResult = {
  recommended: string // la ideal según las tablas
  pick: string | null // la más cercana que SÍ tiene el producto
  exact: boolean // ¿la ideal existe en el producto?
  between: string | null // si quedó justo entre dos tallas, la otra opción
}

export function recommendSize(input: { body: Body; heightCm: number; weightKg: number; fit: Fit }, available: string[]): SizeResult {
  const t = TABLES[input.body]
  const score =
    0.65 * continuousIndex(input.weightKg, t.weight) +
    0.35 * continuousIndex(input.heightCm, t.height) +
    (input.fit === 'ajustado' ? -0.4 : input.fit === 'holgado' ? 0.9 : 0)
  const idx = Math.max(0, Math.min(SCALE.length - 1, Math.round(score)))
  const recommended = SCALE[idx]!
  const frac = score - Math.floor(score)
  const alt = frac > 0.35 && frac < 0.65 ? SCALE[Math.max(0, Math.min(SCALE.length - 1, score > idx ? idx + 1 : idx - 1))]! : null

  // Solo tallas de letra de la escala; si el producto usa otras (28, 30…), no adivinamos
  const inScale = available.filter((s) => (SCALE as readonly string[]).includes(s))
  let pick: string | null = null
  if (inScale.length) {
    pick = inScale.reduce((best, s) =>
      Math.abs(SCALE.indexOf(s as never) - idx) < Math.abs(SCALE.indexOf(best as never) - idx) ? s : best,
    )
  }
  return { recommended, pick, exact: pick === recommended, between: alt && alt !== recommended && available.includes(alt) ? alt : null }
}
