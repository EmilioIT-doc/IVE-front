import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-[1440px] flex-col items-start gap-6 px-4 py-30 md:px-16">
      <span className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">Error 404</span>
      <h1 className="font-display text-6xl leading-none md:text-[88px]">
        Esta página <em>no existe.</em>
      </h1>
      <p className="max-w-md text-muted">Puede que el enlace esté mal escrito o que el producto ya no esté disponible.</p>
      <Link to="/tienda" className="flex h-[52px] items-center bg-ink px-8 text-sm font-semibold tracking-wide text-bone no-underline">
        Ir a la tienda
      </Link>
    </div>
  )
}
