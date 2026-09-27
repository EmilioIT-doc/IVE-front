export type Address = {
  id: string
  recipientName: string
  phone: string
  street: string
  extNumber: string
  intNumber: string | null
  neighborhood: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

export type AddressInput = Omit<Address, 'id' | 'country' | 'isDefault'> & { isDefault?: boolean }

/** "Av. Reforma 100 int. 4B, Juárez, 06600 CDMX, Ciudad de México" */
export function formatAddress(a: Pick<Address, 'street' | 'extNumber' | 'intNumber' | 'neighborhood' | 'postalCode' | 'city' | 'state'>) {
  const interior = a.intNumber ? ` int. ${a.intNumber}` : ''
  return `${a.street} ${a.extNumber}${interior}, ${a.neighborhood}, ${a.postalCode} ${a.city}, ${a.state}`
}
