import { Link } from 'react-router'

/** Temporal: las pantallas de cuenta y checkout llegan en el siguiente paso. */
export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="mx-auto flex max-w-[1440px] flex-col items-start gap-6 px-4 py-30 md:px-16">
      <span className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">En construcción</span>
      <h1 className="font-display text-6xl leading-none md:text-[80px]">{title}</h1>
      <p className="max-w-md text-muted">Esta pantalla ya está diseñada y la conectamos en el siguiente paso.</p>
      <Link to="/tienda" className="text-sm font-semibold">Volver a la tienda</Link>
    </div>
  )
}
