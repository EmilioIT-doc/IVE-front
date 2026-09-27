export type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'customer' | 'admin'
  phone: string | null
  birthDate: string | null // "1998-05-21"
}

export type Channel = 'email' | 'sms'

/** Lo que regresa el back al registrarse o pedir otro código (todavía sin sesión). */
export type VerificationInfo = {
  email: string
  channel: Channel
  destination: string // "e••••o@gmail.com" / "•••• 5678"
  expiresAt: string
  resendAvailableAt: string
  canUseSms: boolean
}

export type RegisterInput = {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  birthDate: string
  channel: Channel
  address: {
    recipientName: string
    phone: string
    street: string
    extNumber: string
    intNumber: string | null
    neighborhood: string
    city: string
    state: string
    postalCode: string
  }
}
