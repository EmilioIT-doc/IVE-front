// La base guarda el nombre del color; aquí vive su muestra visual.
const SWATCHES: Record<string, string> = {
  negro: '#1f1e1c',
  blanco: '#f2f0eb',
  gris: '#9a968f',
  beige: '#d8c8ae',
  'verde olivo': '#5b5e3f',
  'azul marino': '#26324a',
  azul: '#4f6d8f',
}

/** Colores con muestra conocida (para elegir rápido en el panel de admin) */
export const KNOWN_COLORS = Object.keys(SWATCHES)

export function swatchFor(color: string): string {
  return SWATCHES[color] ?? '#c9c3b8'
}

// Tonos para los "placeholders" de foto mientras no hay imágenes reales.
const TONES = ['#dcd5c9', '#e6e0d5', '#d2cabc', '#c9c1b2', '#d6cfc2', '#cbd0d3', '#c8c2b1']

export function toneFor(seed: string): string {
  let hash = 0
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return TONES[hash % TONES.length]!
}
