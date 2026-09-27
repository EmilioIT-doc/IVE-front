import { z } from 'zod'

export const MEXICAN_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
  'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero',
  'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro',
  'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz',
  'Yucatán', 'Zacatecas',
] as const

const required = (message: string) => z.string().trim().min(1, message)

// Mismas regex que el back y que los CHECK de la tabla addresses
export const addressSchema = z.object({
  recipientName: required('Escribe el nombre de quien recibe').max(100),
  phone: z
    .string()
    .transform((s) => s.replace(/[\s-]/g, '')) // "55 1234-5678" → "5512345678"
    .pipe(z.string().regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos')),
  postalCode: z.string().trim().regex(/^\d{5}$/, 'Escribe los 5 dígitos del código postal'),
  street: required('Escribe la calle').max(150),
  extNumber: required('Escribe el número exterior').max(20),
  intNumber: z.string().trim().max(20),
  neighborhood: required('Escribe la colonia').max(100),
  city: required('Escribe la ciudad o municipio').max(100),
  state: z.string().refine((s) => (MEXICAN_STATES as readonly string[]).includes(s), 'Selecciona un estado'),
  isDefault: z.boolean(),
})

export type AddressFormInput = z.input<typeof addressSchema>
export type AddressFormValues = z.output<typeof addressSchema>

export const emptyAddress: AddressFormInput = {
  recipientName: '',
  phone: '',
  postalCode: '',
  street: '',
  extNumber: '',
  intNumber: '',
  neighborhood: '',
  city: '',
  state: '',
  isDefault: false,
}
