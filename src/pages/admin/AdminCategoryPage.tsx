import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { BackLink, Notice, Section } from '../../components/admin/AdminBits'
import { ImageDropzone } from '../../components/admin/ImageDropzone'
import { ImageFramingEditor } from '../../components/admin/ImageFramingEditor'
import { UploadQueue } from '../../components/admin/UploadQueue'
import { Field } from '../../components/forms/Field'
import { CategoryTile } from '../../components/ui/CategoryTile'
import { ErrorState } from '../../components/ui/ErrorState'
import {
  useDeleteCategoryMutation,
  useGetAdminCategoryQuery,
  useRemoveCategoryCoverMutation,
  useUpdateCategoryCoverFramingMutation,
  useUpdateCategoryMutation,
} from '../../features/admin/adminApi'
import { categoryFormSchema, type CategoryFormValues } from '../../features/admin/categoryForm'
import type { AdminCategory } from '../../features/admin/types'
import { enqueueUploads } from '../../features/admin/uploads/uploadManager'
import { getErrorMessage } from '../../services/api'

/** /admin/categorias/:id */
export function AdminCategoryPage() {
  const { id } = useParams()
  const { data: category, isLoading, error, refetch } = useGetAdminCategoryQuery(id!)
  if (isLoading) return <p className="text-sm text-muted">Cargando…</p>
  if (error || !category) return <ErrorState message={getErrorMessage(error, 'No encontramos la categoría')} onRetry={refetch} />
  return <CategoryEditor key={category.id} category={category} />
}

function CategoryEditor({ category }: { category: AdminCategory }) {
  const navigate = useNavigate()
  const location = useLocation()
  const justCreated = (location.state as { created?: boolean } | null)?.created
  const [updateCategory] = useUpdateCategoryMutation()
  const [removeCover, removeCoverState] = useRemoveCategoryCoverMutation()
  const [deleteCategory, deleteState] = useDeleteCategoryMutation()
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(
    justCreated ? { tone: 'ok', text: 'Categoría creada. Súbele una foto de portada.' } : null,
  )
  const [coverError, setCoverError] = useState<string | null>(null)
  const [editingFrame, setEditingFrame] = useState(false)
  const [saveFraming] = useUpdateCategoryCoverFramingMutation()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const target = { kind: 'category', id: category.id } as const

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting, isDirty } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: category.name, slug: category.slug, isActive: category.isActive },
  })
  // useWatch (no watch): así la vista previa se actualiza mientras escribes sin romper el React Compiler
  const name = useWatch({ control, name: 'name' })
  const slug = useWatch({ control, name: 'slug' })

  const save = handleSubmit(async (values) => {
    setMsg(null)
    try {
      await updateCategory({ id: category.id, ...values }).unwrap()
      reset(values)
      setMsg({ tone: 'ok', text: 'Cambios guardados.' })
    } catch (err) {
      setMsg({ tone: 'error', text: getErrorMessage(err) })
    }
  })

  const onRemoveCover = async () => {
    setCoverError(null)
    try {
      await removeCover(category.id).unwrap()
    } catch (err) {
      setCoverError(getErrorMessage(err))
    }
  }

  const onDelete = async () => {
    try {
      await deleteCategory(category.id).unwrap()
      navigate('/admin/categorias', { replace: true })
    } catch (err) {
      setConfirmDelete(false)
      setMsg({ tone: 'error', text: getErrorMessage(err) })
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <BackLink to="/admin/categorias">Categorías</BackLink>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-5xl leading-none">{category.name}</h1>
          <span className="text-sm text-muted">
            /tienda/{category.slug} · {category.isActive ? 'Visible en la tienda' : 'Oculta'} · {category.productCount}{' '}
            {category.productCount === 1 ? 'producto' : 'productos'}
          </span>
        </div>
        {category.isActive && (
          <Link to={`/tienda/${category.slug}`} className="text-sm font-semibold">Ver en la tienda →</Link>
        )}
      </div>

      <Section title="Información">
        <form onSubmit={save} noValidate className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-4">
            <Field inputSize="md" label="Nombre" error={errors.name?.message} {...register('name')} />
            <Field inputSize="md" label="Slug (dirección)" hint={`/tienda/${slug || '…'}`} error={errors.slug?.message} {...register('slug')} />
            <label className="flex cursor-pointer items-center gap-2.5 text-sm sm:col-span-2">
              <input type="checkbox" className="size-[18px]" {...register('isActive')} />
              Visible en la tienda (menú de filtros y home)
            </label>
          </div>
          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting || !isDirty} className="h-12 bg-ink px-8 text-sm font-semibold text-bone hover:bg-olive disabled:opacity-40">
              {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Section>

      <Section title="Portada" description="Es la foto que representa a la categoría en el home. Ideal: vertical 4:5 (ej. 1600 × 2000 px); se recorta al centro para llenar el cuadro.">
        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[300px_minmax(0,1fr)]">
          {/* Vista previa con el MISMO componente y ancho que el home */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">Así se ve en el home</span>
            <div className="group w-full max-w-[300px]">
              <CategoryTile
                name={name || category.name}
                slug={category.slug}
                coverUrl={category.coverUrl}
                framing={category.coverFraming}
                caption={`${category.activeProductCount} ${category.activeProductCount === 1 ? 'diseño' : 'diseños'}`}
              />
            </div>
            {category.coverUrl && (
              <button type="button" onClick={() => setEditingFrame(true)} className="h-11 max-w-[300px] border border-ink text-sm font-semibold hover:bg-ink hover:text-bone">
                Editar encuadre (zoom y posición)
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <UploadQueue target={target} />
            <ImageDropzone
              multiple={false}
              label={category.coverUrl ? 'Arrastra otra foto para reemplazar la portada' : 'Arrastra la foto de portada o da clic para elegirla'}
              onFiles={(files) => void enqueueUploads(target, files)}
            />
            {category.coverUrl && (
              <button type="button" onClick={() => void onRemoveCover()} disabled={removeCoverState.isLoading} className="h-9 self-start text-xs text-danger underline disabled:opacity-50">
                Quitar portada
              </button>
            )}
            {coverError && <p role="alert" className="animate-fade-in text-sm font-medium text-danger">{coverError}</p>}
          </div>
        </div>
      </Section>

      {editingFrame && category.coverUrl && (
        <ImageFramingEditor
          title={`Portada de ${category.name}`}
          url={category.coverUrl}
          initial={category.coverFraming}
          frames={[{ label: 'Mosaico del home', aspect: 4 / 5 }]}
          onClose={() => setEditingFrame(false)}
          onSave={async (framing) => {
            try {
              await saveFraming({ id: category.id, framing }).unwrap()
            } catch (err) {
              throw new Error(getErrorMessage(err))
            }
          }}
        />
      )}

      <Section title="Eliminar categoría">
        {category.productCount > 0 ? (
          <p className="text-sm text-muted">
            Tiene {category.productCount} {category.productCount === 1 ? 'producto' : 'productos'}. Para borrarla, primero cámbialos de categoría;
            o simplemente desmarca <strong className="text-ink">Visible en la tienda</strong> para esconderla.
          </p>
        ) : confirmDelete ? (
          <div className="flex animate-fade-in flex-wrap items-center gap-4 text-sm">
            <span>¿Seguro? Esto no se puede deshacer.</span>
            <button type="button" onClick={() => void onDelete()} disabled={deleteState.isLoading} className="h-11 bg-danger px-5 font-semibold text-bone disabled:opacity-60">
              Sí, eliminar
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="h-11 underline">Cancelar</button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} className="h-11 self-start border border-danger px-5 text-sm font-semibold text-danger">
            Eliminar categoría
          </button>
        )}
      </Section>
    </div>
  )
}
