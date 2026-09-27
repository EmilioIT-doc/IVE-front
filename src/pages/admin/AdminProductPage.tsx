import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { BackLink, Notice, Section } from '../../components/admin/AdminBits'
import { ImageManager, PendingImages } from '../../components/admin/ImageManager'
import { ProductInfoFields } from '../../components/admin/ProductInfoFields'
import { VariantsEditor } from '../../components/admin/VariantsEditor'
import { ErrorState } from '../../components/ui/ErrorState'
import {
  useCreateProductMutation,
  useGetAdminProductQuery,
  useSyncVariantsMutation,
  useUpdateProductMutation,
} from '../../features/admin/adminApi'
import { centsToInput, productInfoSchema, toCents, toCentsOrNull, type ProductInfoValues } from '../../features/admin/productInfo'
import type { AdminProduct } from '../../features/admin/types'
import { enqueueUploads } from '../../features/admin/uploads/uploadManager'
import { rowsFromVariants, rowsToVariants, type VariantRow } from '../../features/admin/variantRows'
import { getErrorMessage } from '../../services/api'

/** /admin/productos/nuevo y /admin/productos/:id */
export function AdminProductPage() {
  const { id } = useParams()
  return id ? <EditProduct id={id} /> : <NewProduct />
}

// ---------------------------------------------------------------- Nuevo

function NewProduct() {
  const navigate = useNavigate()
  const [createProduct] = useCreateProductMutation()
  const [rows, setRows] = useState<VariantRow[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProductInfoValues>({
    resolver: zodResolver(productInfoSchema),
    defaultValues: { name: '', categoryId: '', gender: 'unisex', price: '', compareAt: '', description: '', isActive: true },
  })

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    const parsed = rowsToVariants(rows)
    if ('error' in parsed) return setError(parsed.error)
    try {
      // 1) crea el producto con sus variantes  2) manda las fotos a la cola  3) abre la edición,
      //    donde se ve el avance (las subidas siguen aunque cambies de pantalla)
      const product = await createProduct({
        name: values.name,
        categoryId: values.categoryId,
        gender: values.gender,
        priceCents: toCents(values.price),
        compareAtCents: toCentsOrNull(values.compareAt),
        description: values.description || null,
        isActive: values.isActive,
        variants: parsed.variants,
      }).unwrap()
      void enqueueUploads({ kind: 'product', id: product.id }, files)
      navigate(`/admin/productos/${product.id}`, { replace: true, state: { created: true } })
    } catch (err) {
      setError(getErrorMessage(err))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-10">
      <BackLink to="/admin">Productos</BackLink>
      <h1 className="font-display text-5xl leading-none">Nuevo producto</h1>

      <Section title="Información">
        <ProductInfoFields register={register} errors={errors} />
      </Section>

      <Section title="Fotos">
        <PendingImages files={files} onChange={setFiles} />
      </Section>

      <Section title="Variantes" description="Cada combinación de talla y color tiene su propio stock y SKU.">
        <VariantsEditor rows={rows} onChange={setRows} />
      </Section>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex justify-end border-t border-line pt-8">
        <button type="submit" disabled={isSubmitting} className="h-14 bg-ink px-10 text-sm font-semibold tracking-[0.08em] text-bone uppercase hover:bg-olive disabled:opacity-60">
          {isSubmitting ? 'Creando…' : 'Crear producto'}
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------- Editar

function EditProduct({ id }: { id: string }) {
  const { data: product, isLoading, error, refetch } = useGetAdminProductQuery(id)
  if (isLoading) return <p className="text-sm text-muted">Cargando…</p>
  if (error || !product) return <ErrorState message={getErrorMessage(error, 'No encontramos el producto')} onRetry={refetch} />
  return <EditForm key={product.id} product={product} />
}

function EditForm({ product }: { product: AdminProduct }) {
  const location = useLocation()
  const justCreated = (location.state as { created?: boolean } | null)?.created
  const [updateProduct] = useUpdateProductMutation()
  const [syncVariants, syncState] = useSyncVariantsMutation()
  const [infoMsg, setInfoMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(justCreated ? { tone: 'ok', text: 'Producto creado. Tus fotos se están subiendo en la sección Fotos.' } : null)
  const [variantsMsg, setVariantsMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [rows, setRows] = useState<VariantRow[]>(() => rowsFromVariants(product.variants))

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty }, reset } = useForm<ProductInfoValues>({
    resolver: zodResolver(productInfoSchema),
    defaultValues: {
      name: product.name,
      categoryId: product.categoryId,
      gender: product.gender,
      price: centsToInput(product.priceCents),
      compareAt: centsToInput(product.compareAtCents),
      description: product.description ?? '',
      isActive: product.isActive,
    },
  })

  const saveInfo = handleSubmit(async (values) => {
    setInfoMsg(null)
    try {
      await updateProduct({
        id: product.id,
        name: values.name,
        categoryId: values.categoryId,
        gender: values.gender,
        priceCents: toCents(values.price),
        compareAtCents: toCentsOrNull(values.compareAt),
        description: values.description || null,
        isActive: values.isActive,
      }).unwrap()
      reset(values) // lo guardado pasa a ser el nuevo "sin cambios"
      setInfoMsg({ tone: 'ok', text: 'Cambios guardados.' })
    } catch (err) {
      setInfoMsg({ tone: 'error', text: getErrorMessage(err) })
    }
  })

  const saveVariants = async () => {
    setVariantsMsg(null)
    const parsed = rowsToVariants(rows)
    if ('error' in parsed) return setVariantsMsg({ tone: 'error', text: parsed.error })
    try {
      const updated = await syncVariants({ id: product.id, variants: parsed.variants }).unwrap()
      setRows(rowsFromVariants(updated.variants)) // ya con ids y SKUs reales
      setVariantsMsg({ tone: 'ok', text: 'Variantes guardadas.' })
    } catch (err) {
      setVariantsMsg({ tone: 'error', text: getErrorMessage(err) })
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <BackLink to="/admin">Productos</BackLink>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-5xl leading-none">{product.name}</h1>
          <span className="text-sm text-muted">/{product.slug} · {product.isActive ? 'Visible en la tienda' : 'Oculto'}</span>
        </div>
        {product.isActive && (
          <Link to={`/producto/${product.slug}`} className="text-sm font-semibold">Ver en la tienda →</Link>
        )}
      </div>

      <Section title="Información">
        <form onSubmit={saveInfo} noValidate className="flex flex-col gap-6">
          <ProductInfoFields register={register} errors={errors} />
          {infoMsg && <Notice tone={infoMsg.tone}>{infoMsg.text}</Notice>}
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting || !isDirty} className="h-12 bg-ink px-8 text-sm font-semibold text-bone hover:bg-olive disabled:opacity-40">
              {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Section>

      <Section title="Fotos">
        <ImageManager productId={product.id} images={product.images} />
      </Section>

      <Section title="Variantes" description="Las variantes que ya existen no se borran (puede haber pedidos con ellas): desmárcalas para ocultarlas.">
        <VariantsEditor rows={rows} onChange={setRows} />
        {variantsMsg && <Notice tone={variantsMsg.tone}>{variantsMsg.text}</Notice>}
        <div className="flex justify-end">
          <button type="button" onClick={saveVariants} disabled={syncState.isLoading} className="h-12 bg-ink px-8 text-sm font-semibold text-bone hover:bg-olive disabled:opacity-40">
            {syncState.isLoading ? 'Guardando…' : 'Guardar variantes'}
          </button>
        </div>
      </Section>
    </div>
  )
}
