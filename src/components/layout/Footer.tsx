import type { ReactNode } from 'react'
import { Link } from 'react-router'

export function Footer() {
  return (
    <footer className="mt-30 bg-ink px-4 pt-20 pb-10 text-bone md:px-16">
      <div className="mx-auto flex max-w-[1312px] flex-col gap-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-6">
          <div className="flex flex-col gap-5 md:col-span-5">
            <p className="font-display text-4xl leading-tight md:text-[40px]">
              Recibe las novedades
              <br />
              antes que nadie.
            </p>
            <form className="flex max-w-[420px] flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="news-email" className="text-[13px] text-[#bdb7ac]">
                Correo electrónico
              </label>
              <div className="flex border-b border-[#6e6961]">
                <input
                  id="news-email"
                  type="email"
                  placeholder="tu@correo.com"
                  className="h-12 flex-1 bg-transparent text-[15px] text-bone placeholder:text-[#8f897f] focus:outline-none"
                />
                <button type="submit" className="h-12 pl-4 text-sm font-semibold tracking-wide">
                  Suscribirme
                </button>
              </div>
            </form>
          </div>
          <FooterNav title="Tienda" className="md:col-span-2 md:col-start-7">
            <Link to="/tienda/mujer">Mujer</Link>
            <Link to="/tienda/hombre">Hombre</Link>
            <Link to="/tienda/unisex">Unisex</Link>
            <Link to="/tienda">Novedades</Link>
          </FooterNav>
          <FooterNav title="Ayuda" className="md:col-span-2">
            <Link to="/ayuda/envios">Envíos</Link>
            <Link to="/ayuda/cambios">Cambios y devoluciones</Link>
            <Link to="/ayuda/tallas">Guía de tallas</Link>
          </FooterNav>
          <FooterNav title="Cuenta" className="md:col-span-2">
            <Link to="/login">Iniciar sesión</Link>
            <Link to="/registro">Crear cuenta</Link>
            <Link to="/cuenta">Mis pedidos</Link>
          </FooterNav>
        </div>
        <div className="flex items-end justify-between border-t border-[#3a3833] pt-8">
          <span className="font-display text-7xl leading-[0.8] tracking-[0.3em] md:text-[120px]">IVE</span>
          <span className="text-[13px] text-[#bdb7ac]">© 2026 IVE · Proyecto de práctica</span>
        </div>
      </div>
    </footer>
  )
}

function FooterNav({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <nav aria-label={title} className={`flex flex-col gap-3.5 text-sm [&_a]:text-bone [&_a]:no-underline [&_a:hover]:underline ${className ?? ''}`}>
      <span className="text-xs font-semibold tracking-[0.14em] text-[#bdb7ac] uppercase">{title}</span>
      {children}
    </nav>
  )
}
