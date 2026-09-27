import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeftIcon } from '../ui/icons'

/** Pantalla dividida del diseño de Login/Registro: panel de imagen + formulario. */
export function AuthLayout({ aside, tone, children }: { aside: ReactNode; tone: string; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      <div className="hidden flex-col justify-between p-12 lg:flex" style={{ backgroundColor: tone }}>
        <Link to="/" aria-label="IVE, inicio" className="font-display text-4xl leading-none tracking-[0.3em] no-underline">
          IVE
        </Link>
        {aside}
      </div>
      <div className="flex flex-col px-4 py-8 md:px-12 md:py-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Link to="/" aria-label="IVE, inicio" className="font-display text-3xl tracking-[0.3em] no-underline lg:hidden">
            IVE
          </Link>
          <Link to="/" className="flex min-h-11 items-center gap-2 text-sm font-medium no-underline">
            <ArrowLeftIcon size={18} /> Volver a la tienda
          </Link>
        </div>
        <main className="my-auto w-full max-w-[460px] self-center py-10">{children}</main>
      </div>
    </div>
  )
}
