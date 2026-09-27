import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode
  error?: string
  hint?: ReactNode
  trailing?: ReactNode // p. ej. el botón de mostrar contraseña
  inputSize?: 'md' | 'lg'
}

/** Input con label, ayuda y error conectados para lectores de pantalla. */
export function Field({ label, error, hint, trailing, inputSize = 'lg', className = '', ...input }: Props) {
  const autoId = useId()
  const id = input.id ?? autoId
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[13px] font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`w-full bg-white px-4 text-[15px] placeholder:text-[#9a948a] ${inputSize === 'lg' ? 'h-[52px]' : 'h-12'} ${trailing ? 'pr-14' : ''} ${
            error ? 'border-[1.5px] border-danger' : 'border border-field'
          }`}
          {...input}
        />
        {trailing && <div className="absolute top-1 right-1">{trailing}</div>}
      </div>
      {hint && !error && (
        <span id={`${id}-hint`} className="text-xs text-subtle">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="animate-fade-in text-xs font-medium text-danger">
          {error}
        </span>
      )}
    </div>
  )
}
