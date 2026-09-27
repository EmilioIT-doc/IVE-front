import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { Link } from 'react-router'
import { useGetAdminCategoriesQuery } from '../../features/admin/adminApi'
import { GENDERS } from '../../lib/gender'
import type { ProductInfoValues } from '../../features/admin/productInfo'
import { Field } from '../forms/Field'

/** Campos básicos del producto (se usan al crear y al editar). */
export function ProductInfoFields({ register, errors }: { register: UseFormRegister<ProductInfoValues>; errors: FieldErrors<ProductInfoValues> }) {
  // Las del admin: incluye las ocultas (puedes preparar productos antes de mostrar la categoría)
  const { data: categories } = useGetAdminCategoriesQuery()

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-4">
      <Field className="sm:col-span-2" inputSize="md" label="Nombre" placeholder="Playera Born to Die" error={errors.name?.message} {...register('name')} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="categoria" className="text-[13px] font-semibold">Categoría</label>
        <select id="categoria" aria-invalid={errors.categoryId ? true : undefined} className={`h-12 bg-white px-3 text-[15px] ${errors.categoryId ? 'border-[1.5px] border-danger' : 'border border-field'}`} {...register('categoryId')}>
          <option value="">Selecciona…</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.isActive ? '' : ' (oculta)'}
            </option>
          ))}
        </select>
        {errors.categoryId ? (
          <span className="animate-fade-in text-xs font-medium text-danger">{errors.categoryId.message}</span>
        ) : (
          <span className="text-xs text-subtle">
            ¿Falta una? <Link to="/admin/categorias">Administra las categorías</Link>
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="para" className="text-[13px] font-semibold">Para</label>
        <select id="para" className="h-12 border border-field bg-white px-3 text-[15px]" {...register('gender')}>
          <option value="unisex">Unisex</option>
          {GENDERS.filter((g) => g.slug !== 'unisex').map((g) => (
            <option key={g.slug} value={g.slug}>Solo {g.label.toLowerCase()}</option>
          ))}
        </select>
        <span className="text-xs text-subtle">Lo unisex aparece tanto en Mujer como en Hombre.</span>
      </div>

      <Field inputSize="md" label="Precio (MXN)" inputMode="decimal" placeholder="499" hint="IVA incluido" error={errors.price?.message} {...register('price')} />

      <Field inputSize="md" label="Precio antes (tachado)" inputMode="decimal" placeholder="Opcional, ej. 599" hint="Si lo llenas, se muestra como oferta: $599 → $449" error={errors.compareAt?.message} {...register('compareAt')} />

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="descripcion" className="text-[13px] font-semibold">Descripción</label>
        <textarea id="descripcion" rows={4} placeholder="Tela, corte, detalles…" className="border border-field bg-white px-4 py-3 text-[15px]" {...register('description')} />
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm sm:col-span-2">
        <input type="checkbox" className="size-[18px]" {...register('isActive')} />
        Visible en la tienda
      </label>
    </div>
  )
}
