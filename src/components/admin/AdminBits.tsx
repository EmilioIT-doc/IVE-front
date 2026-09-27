import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeftIcon } from '../ui/icons'

/** Bloque con título del panel (Información, Fotos, Variantes…). */
export function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 border-t border-line pt-8">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-3xl">{title}</h2>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  )
}

/** Aviso verde (ok) o rojo (error) que aparece con fade. */
export function Notice({ tone, children }: { tone: 'ok' | 'error'; children: ReactNode }) {
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={`animate-fade-in px-4 py-3 text-sm ${tone === 'ok' ? 'bg-[#dfe3d8] text-olive' : 'bg-[#f4e4de] text-[#7a2615]'}`}>
      {children}
    </p>
  )
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="flex min-h-11 items-center gap-2 self-start text-sm font-medium no-underline">
      <ArrowLeftIcon size={18} /> {children}
    </Link>
  )
}
