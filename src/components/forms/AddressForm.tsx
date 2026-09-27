import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import {
  addressSchema,
  emptyAddress,
  MEXICAN_STATES,
  type AddressFormInput,
  type AddressFormValues,
} from '../../features/addresses/schemas'
import { Field } from './Field'

type Props = {
  onSubmit: (values: AddressFormValues, options: { save: boolean }) => void | Promise<void>
  submitLabel: string
  defaultValues?: Partial<AddressFormInput>
  showSaveOption?: boolean // en el checkout: "Guardar esta dirección"
  hideDefaultOption?: boolean // en el registro: siempre es la principal
  secondaryAction?: ReactNode
}

export function AddressForm({ onSubmit, submitLabel, defaultValues, showSaveOption, hideDefaultOption, secondaryAction }: Props) {
  const stateId = useId()
  const [save, setSave] = useState(true)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormInput, unknown, AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { ...emptyAddress, ...defaultValues },
  })

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values, { save }))} noValidate className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-4">
        <Field className="sm:col-span-2" inputSize="md" label="Nombre de quien recibe" autoComplete="name" placeholder="Nombre y apellidos" error={errors.recipientName?.message} {...register('recipientName')} />
        <Field inputSize="md" label="Teléfono" type="tel" inputMode="numeric" autoComplete="tel" placeholder="55 1234 5678" hint="10 dígitos" error={errors.phone?.message} {...register('phone')} />
        <Field inputSize="md" label="Código postal" inputMode="numeric" autoComplete="postal-code" placeholder="01000" maxLength={5} error={errors.postalCode?.message} {...register('postalCode')} />
        <Field className="sm:col-span-2" inputSize="md" label="Calle" autoComplete="address-line1" placeholder="Nombre de la calle" error={errors.street?.message} {...register('street')} />
        <Field inputSize="md" label="Número exterior" placeholder="123" error={errors.extNumber?.message} {...register('extNumber')} />
        <Field inputSize="md" label={<>Número interior <span className="font-normal text-subtle">(opcional)</span></>} placeholder="Depto. 4B" error={errors.intNumber?.message} {...register('intNumber')} />
        <Field inputSize="md" label="Colonia" placeholder="Colonia" error={errors.neighborhood?.message} {...register('neighborhood')} />
        <Field inputSize="md" label="Ciudad o municipio" autoComplete="address-level2" placeholder="Ciudad" error={errors.city?.message} {...register('city')} />
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor={stateId} className="text-[13px] font-semibold">Estado</label>
          <select
            id={stateId}
            autoComplete="address-level1"
            aria-invalid={errors.state ? true : undefined}
            className={`h-12 bg-white px-3 text-[15px] ${errors.state ? 'border-[1.5px] border-danger' : 'border border-field'}`}
            {...register('state')}
          >
            <option value="">Selecciona un estado</option>
            {MEXICAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.state && <span className="text-xs font-medium text-danger">{errors.state.message}</span>}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {showSaveOption && (
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input type="checkbox" className="size-[18px]" checked={save} onChange={(e) => setSave(e.target.checked)} />
            Guardar esta dirección en mi cuenta
          </label>
        )}
        {!hideDefaultOption && (
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input type="checkbox" className="size-[18px]" {...register('isDefault')} />
            Usar como mi dirección predeterminada
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {secondaryAction ?? <span />}
        <button type="submit" disabled={isSubmitting} className="h-14 bg-ink px-10 text-sm font-semibold tracking-[0.08em] text-bone uppercase disabled:opacity-60">
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
