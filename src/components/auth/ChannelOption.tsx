/** Opción grande de radio: "Por correo" / "Por SMS". */
export function ChannelOption({ checked, onChange, title, text }: { checked: boolean; onChange: () => void; title: string; text: string }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 border p-4 transition-colors ${checked ? 'border-ink bg-white' : 'border-field hover:border-ink'}`}>
      <input type="radio" checked={checked} onChange={onChange} className="size-5" />
      <span className="flex flex-col">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted">{text}</span>
      </span>
    </label>
  )
}
