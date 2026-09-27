import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowRightIcon, LockIcon, ReturnIcon, TruckIcon } from '../components/ui/icons'
import { CategoryTile } from '../components/ui/CategoryTile'
import { PageLoader } from '../components/ui/PageLoader'
import { SiteImageBlock } from '../components/ui/SiteImageBlock'
import { ErrorState } from '../components/ui/ErrorState'
import { ProductCard, ProductCardSkeleton } from '../components/ui/ProductCard'
import { useGetCategoriesQuery, useGetProductsQuery } from '../features/catalog/catalogApi'
import { useGetSiteImagesQuery } from '../features/site/siteApi'
import { SLOT_INFO } from '../features/site/slots'
import { getErrorMessage } from '../services/api'

/** Cuántas prendas nuevas se muestran en el home (2 filas de 4). */
const NEW_ARRIVALS = 8

export function HomePage() {
  // Lo más nuevo primero: el orden es la fecha en que se dio de alta cada prenda
  const { data, isLoading, error, refetch } = useGetProductsQuery({ sort: 'newest', limit: NEW_ARRIVALS })
  const categories = useGetCategoriesQuery()
  // Portada y foto editorial: se cambian desde el panel (Admin → Fotos del inicio)
  const site = useGetSiteImagesQuery()
  // Si falla algo también quitamos el loader: el error se muestra en su sección
  const ready = !isLoading && !categories.isLoading && !site.isLoading

  return (
    <>
      {/* Pantalla de carga con frase; aparece cada vez que entras al home */}
      <PageLoader ready={ready} />
      {/* Hero */}
      <section className="grid min-h-[640px] grid-cols-1 md:h-[760px] md:grid-cols-2">
        <div className="flex flex-col justify-end gap-7 px-4 py-16 md:px-16 md:pb-24">
          <span className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">by valco</span>
          <h1 className="font-display text-6xl leading-[0.95] tracking-tight md:text-[104px]">
            Lo esencial,
            <br />
            <em>bien hecho.</em>
          </h1>
          <p className="max-w-[440px] text-[17px] leading-relaxed text-muted">
            T-shirts, crop tops, ropa para entrenar y sudaderas. Diseños para ella, para él y para todos.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/tienda/mujer" className="flex h-[52px] items-center bg-ink px-8 text-sm font-semibold tracking-wide text-bone no-underline">
              Comprar mujer
            </Link>
            <Link to="/tienda/hombre" className="flex h-[52px] items-center border border-ink px-8 text-sm font-semibold tracking-wide no-underline">
              Comprar hombre
            </Link>
            <Link to="/tienda/unisex" className="flex h-[52px] items-center px-4 text-sm font-semibold tracking-wide">
              Unisex
            </Link>
          </div>
        </div>
        <SiteImageBlock
          url={site.data?.home_hero.url}
          alt={site.data?.home_hero.altText}
          framing={site.data?.home_hero.framing}
          fallbackLabel={SLOT_INFO.home_hero.fallbackLabel}
          fallbackColor={SLOT_INFO.home_hero.fallbackColor}
          className="min-h-[420px]"
        />
      </section>

      {/* Categorías: salen de la base (nombre, orden y portada se editan en el panel) */}
      {categories.data && categories.data.length > 0 && (
        <section className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 pt-30 md:px-16">
          <h2 className="font-display text-5xl leading-none md:text-[52px]">Compra por categoría</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {categories.data.map((c) => (
              <Link key={c.id} to={`/tienda/${c.slug}`} className="group no-underline">
                <CategoryTile
                  name={c.name}
                  slug={c.slug}
                  coverUrl={c.coverUrl}
                  framing={c.coverFraming}
                  caption={`${c.productCount} ${c.productCount === 1 ? 'diseño' : 'diseños'}`}
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Novedades */}
      <section className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 pt-30 md:px-16">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-5xl leading-none md:text-[52px]">Novedades</h2>
            <p className="text-sm text-muted">Lo último que lanzamos, de lo más nuevo a lo anterior.</p>
          </div>
          <Link to="/tienda" className="flex items-center gap-2 py-3 text-sm font-semibold tracking-wide no-underline">
            Ver todo <ArrowRightIcon size={18} />
          </Link>
        </div>
        {error ? (
          <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {isLoading
              ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
              : data?.items.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Editorial */}
      <section className="mx-auto mt-30 grid max-w-[1312px] grid-cols-1 bg-linen md:h-[560px] md:grid-cols-2">
        <SiteImageBlock
          url={site.data?.home_editorial.url}
          alt={site.data?.home_editorial.altText}
          framing={site.data?.home_editorial.framing}
          fallbackLabel={SLOT_INFO.home_editorial.fallbackLabel}
          fallbackColor={SLOT_INFO.home_editorial.fallbackColor}
          className="min-h-[320px]"
        />
        <div className="flex flex-col justify-center gap-6 p-8 md:p-[72px]">
          <span className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">Del día a día al gym</span>
          <h2 className="font-display text-5xl leading-none md:text-[60px]">
            Algodón que aguanta. <em>Cortes que se notan.</em>
          </h2>
          <p className="max-w-[420px] leading-relaxed text-muted">
            T-shirts de corte normal y crop, ropa para entrenar y sudaderas. Menos piezas, mejor hechas.
          </p>
          <Link to="/tienda" className="flex h-[52px] items-center self-start bg-ink px-8 text-sm font-semibold tracking-wide text-bone no-underline">
            Ver la colección
          </Link>
        </div>
      </section>

      {/* Beneficios */}
      <section className="mx-auto mt-30 grid max-w-[1312px] grid-cols-1 gap-8 border-y border-line px-4 py-12 md:grid-cols-3 md:px-0">
        <Benefit icon={<TruckIcon size={26} />} title="Envío gratis desde $999" text="Entrega de 3 a 5 días hábiles." />
        <Benefit icon={<ReturnIcon size={26} />} title="Cambios en 30 días" text="Si no te queda, lo cambiamos." />
        <Benefit icon={<LockIcon size={26} />} title="Pago seguro" text="Tus datos viajan cifrados." />
      </section>
    </>
  )
}

function Benefit({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-4">
      {icon}
      <div className="flex flex-col gap-1">
        <span className="text-[15px] font-semibold">{title}</span>
        <span className="text-sm text-muted">{text}</span>
      </div>
    </div>
  )
}
