const whole = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
const exact = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })

/** El dinero viaja en centavos: 34900 → "$349" · 34950 → "$349.50" */
export function formatMoney(cents: number): string {
  return cents % 100 === 0 ? whole.format(cents / 100) : exact.format(cents / 100)
}

/** "azul marino" → "Azul marino" */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const dateFormat = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

/** "2026-09-25T01:13:30Z" → "24 de septiembre de 2026" (en tu zona horaria) */
export const formatDate = (iso: string) => dateFormat.format(new Date(iso))
