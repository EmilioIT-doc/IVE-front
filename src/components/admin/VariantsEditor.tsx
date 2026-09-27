import { useState } from 'react'
import { newRowKey, PRICE_RE, STOCK_RE, type VariantRow } from '../../features/admin/variantRows'
import { KNOWN_COLORS, swatchFor } from '../../lib/colors'
import { capitalize } from '../../lib/format'

const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

/** Tabla de variantes + generador de combinaciones talla × color. */
export function VariantsEditor({ rows, onChange }: { rows: VariantRow[]; onChange: (rows: VariantRow[]) => void }) {
  const [sizes, setSizes] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [customSize, setCustomSize] = useState('')
  const [customColor, setCustomColor] = useState('')
  const [initialStock, setInitialStock] = useState('10')

  const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  const allColors = [...new Set([...KNOWN_COLORS, ...rows.map((r) => r.color), ...colors])]

  const addSize = () => {
    const s = customSize.trim().toUpperCase()
    if (/^[A-Z0-9]{1,10}$/.test(s)) setSizes((prev) => [...new Set([...prev, s])]) // regex: letras/números, sin espacios
    setCustomSize('')
  }

  const addColor = () => {
    const c = customColor.trim().toLowerCase()
    if (/^[a-záéíóúüñ ]{2,30}$/.test(c)) setColors((prev) => [...new Set([...prev, c])]) // regex: solo letras y espacios
    setCustomColor('')
  }

  const generate = () => {
    const existing = new Set(rows.map((r) => `${r.size}|${r.color}`))
    const added: VariantRow[] = []
    for (const color of colors) {
      for (const size of sizes) {
        if (existing.has(`${size}|${color}`)) continue
        added.push({ key: newRowKey(), size, color, stock: STOCK_RE.test(initialStock) ? initialStock : '0', price: '', isActive: true })
      }
    }
    onChange([...rows, ...added])
    setSizes([])
    setColors([])
  }

  const update = (key: string, patch: Partial<VariantRow>) => onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  return (
    <div className="flex flex-col gap-6">
      {/* Generador */}
      <div className="flex flex-col gap-5 bg-sand p-5">
        <p className="text-sm font-semibold">Agregar combinaciones</p>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Tallas</legend>
          <div className="flex flex-wrap gap-2">
            {[...new Set([...LETTER_SIZES, ...sizes])].map((s) => (
              <button key={s} type="button" aria-pressed={sizes.includes(s)} onClick={() => setSizes(toggle(sizes, s))} className={`h-10 min-w-12 border px-3 text-sm ${sizes.includes(s) ? 'border-ink bg-ink text-bone' : 'border-field bg-white hover:border-ink'}`}>
                {s}
              </button>
            ))}
            {/* Sin <form>: este editor vive dentro del formulario del producto (no se pueden anidar forms) */}
            <div className="flex gap-1">
              <label htmlFor="talla-extra" className="sr-only">Otra talla</label>
              <input
                id="talla-extra"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSize()
                  }
                }}
                placeholder="Otra (ej. 32)"
                className="h-10 w-28 border border-field bg-white px-3 text-sm"
              />
              <button type="button" onClick={addSize} aria-label="Agregar talla" className="h-10 border border-ink px-3 text-sm font-semibold">+</button>
            </div>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Colores</legend>
          <div className="flex flex-wrap gap-2">
            {allColors.map((c) => (
              <button key={c} type="button" aria-pressed={colors.includes(c)} onClick={() => setColors(toggle(colors, c))} className={`flex h-10 items-center gap-2 border px-3 text-sm ${colors.includes(c) ? 'border-ink bg-ink text-bone' : 'border-field bg-white hover:border-ink'}`}>
                <span className="size-4 rounded-full ring-1 ring-ink/20" style={{ backgroundColor: swatchFor(c) }} />
                {capitalize(c)}
              </button>
            ))}
            <div className="flex gap-1">
              <label htmlFor="color-extra" className="sr-only">Otro color</label>
              <input
                id="color-extra"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addColor()
                  }
                }}
                placeholder="Otro color"
                className="h-10 w-32 border border-field bg-white px-3 text-sm"
              />
              <button type="button" onClick={addColor} aria-label="Agregar color" className="h-10 border border-ink px-3 text-sm font-semibold">+</button>
            </div>
          </div>
        </fieldset>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="stock-inicial" className="text-xs font-semibold tracking-wide text-muted uppercase">Stock inicial</label>
            <input id="stock-inicial" inputMode="numeric" value={initialStock} onChange={(e) => setInitialStock(e.target.value.replace(/\D/g, ''))} className="h-10 w-24 border border-field bg-white px-3 text-sm" />
          </div>
          <button type="button" onClick={generate} disabled={sizes.length === 0 || colors.length === 0} className="h-10 bg-ink px-5 text-sm font-semibold text-bone disabled:opacity-40">
            Agregar {sizes.length * colors.length > 0 ? `${sizes.length * colors.length} combinaciones` : 'combinaciones'}
          </button>
        </div>
      </div>

      {/* Tabla */}
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Aún no hay variantes. Elige tallas y colores arriba.</p>
      ) : (
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-line bg-sand text-xs tracking-wide text-muted uppercase">
              <tr>
                <th scope="col" className="px-3 py-3 font-semibold">Color</th>
                <th scope="col" className="px-3 py-3 font-semibold">Talla</th>
                <th scope="col" className="px-3 py-3 font-semibold">SKU</th>
                <th scope="col" className="px-3 py-3 font-semibold">Stock</th>
                <th scope="col" className="px-3 py-3 font-semibold">Precio especial ($)</th>
                <th scope="col" className="px-3 py-3 font-semibold">Activa</th>
                <th scope="col" className="px-3 py-3"><span className="sr-only">Quitar</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className={`animate-fade-in border-b border-line last:border-0 ${r.isActive ? '' : 'opacity-50'}`}>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span className="size-4 rounded-full ring-1 ring-ink/20" style={{ backgroundColor: swatchFor(r.color) }} />
                      {capitalize(r.color)}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-semibold">{r.size}</td>
                  <td className="px-3 py-2 text-xs text-subtle">{r.sku ?? 'Se genera al guardar'}</td>
                  <td className="px-3 py-2">
                    <label className="sr-only" htmlFor={`stock-${r.key}`}>Stock de {r.color} {r.size}</label>
                    <input id={`stock-${r.key}`} inputMode="numeric" value={r.stock} onChange={(e) => update(r.key, { stock: e.target.value.replace(/\D/g, '') })} className={`h-9 w-20 border bg-white px-2 ${STOCK_RE.test(r.stock) ? 'border-field' : 'border-danger'}`} />
                  </td>
                  <td className="px-3 py-2">
                    <label className="sr-only" htmlFor={`precio-${r.key}`}>Precio especial de {r.color} {r.size}</label>
                    <input id={`precio-${r.key}`} inputMode="decimal" value={r.price} placeholder="—" onChange={(e) => update(r.key, { price: e.target.value.replace(/[^\d.]/g, '') })} className={`h-9 w-24 border bg-white px-2 ${!r.price || PRICE_RE.test(r.price) ? 'border-field' : 'border-danger'}`} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="checkbox" aria-label={`Activa: ${r.color} ${r.size}`} checked={r.isActive} onChange={(e) => update(r.key, { isActive: e.target.checked })} className="size-[18px]" />
                  </td>
                  <td className="px-3 py-2 text-right">
                    {/* Las que ya existen no se borran (puede haber pedidos): se desactivan */}
                    {!r.id && (
                      <button type="button" className="text-xs text-danger underline" onClick={() => onChange(rows.filter((x) => x.key !== r.key))}>
                        Quitar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
