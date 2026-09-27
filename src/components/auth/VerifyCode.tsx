import { useEffect, useId, useState, type FormEvent } from 'react'
import { useResendCodeMutation } from '../../features/auth/authApi'
import type { Channel, User, VerificationInfo } from '../../features/auth/types'
import { useSession } from '../../features/auth/useSession'
import { getErrorMessage, type ApiErrorBody } from '../../services/api'

type Props = { info: VerificationInfo; onVerified: (user: User) => void }

/** Pantalla "Escribe el código de 6 dígitos" con reenvío y cambio de canal. */
export function VerifyCode({ info: initial, onVerified }: Props) {
  const session = useSession()
  const [resend, resendState] = useResendCodeMutation()
  const [info, setInfo] = useState(initial)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const inputId = useId()

  // Reloj para la cuenta regresiva de "Reenviar en 45 s"
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const wait = Math.max(0, Math.ceil((new Date(info.resendAvailableAt).getTime() - now) / 1000))

  const submit = async (value: string) => {
    if (!/^\d{6}$/.test(value)) return setError('El código tiene 6 dígitos')
    setError(null)
    setVerifying(true)
    try {
      onVerified(await session.verify({ email: info.email, code: value }))
    } catch (err) {
      setError(getErrorMessage(err))
      setCode('')
      setVerifying(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void submit(code)
  }

  const send = async (channel: Channel) => {
    setError(null)
    setNotice(null)
    try {
      const next = await resend({ email: info.email, channel }).unwrap()
      setInfo(next)
      setNotice(`Listo, te mandamos un código nuevo a ${next.destination}.`)
    } catch (err) {
      const body = (err as { data?: ApiErrorBody }).data
      setError(body?.error.message ?? getErrorMessage(err))
    }
  }

  const other: Channel = info.channel === 'email' ? 'sms' : 'email'

  return (
    <form onSubmit={onSubmit} noValidate className="flex animate-fade-in flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <h1 className="font-display text-5xl leading-none md:text-[52px]">Confirma que eres tú</h1>
        <p className="text-[15px] text-muted">
          Te mandamos un código de 6 dígitos {info.channel === 'email' ? 'por correo a' : 'por SMS al'} <strong className="text-ink">{info.destination}</strong>. Vence en 10 minutos.
        </p>
      </div>

      {notice && <p role="status" className="animate-fade-in bg-[#dfe3d8] px-4 py-3 text-sm text-olive">{notice}</p>}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-[13px] font-semibold">Código</label>
        <input
          id={inputId}
          value={code}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 6) // solo números
            setCode(digits)
            if (digits.length === 6) void submit(digits) // se envía solo al completar
          }}
          placeholder="••••••"
          className={`h-16 bg-white px-4 text-center font-mono text-3xl tracking-[0.6em] ${error ? 'border-[1.5px] border-danger' : 'border border-field'}`}
        />
        {error && <span role="alert" className="animate-fade-in text-sm font-medium text-danger">{error}</span>}
      </div>

      <button type="submit" disabled={verifying || code.length !== 6} className="h-14 bg-ink text-sm font-semibold tracking-[0.08em] text-bone uppercase disabled:bg-[#d8d3ca] disabled:text-[#5e5a53]">
        {verifying ? 'Verificando…' : 'Confirmar'}
      </button>

      <div className="flex flex-col gap-2 text-sm">
        <span className="text-muted">¿No te llegó? Revisa tu carpeta de spam.</span>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <button type="button" disabled={wait > 0 || resendState.isLoading} onClick={() => void send(info.channel)} className="font-semibold underline disabled:text-subtle disabled:no-underline">
            {wait > 0 ? `Reenviar en ${wait} s` : 'Reenviar código'}
          </button>
          {(other === 'email' || info.canUseSms) && (
            <button type="button" disabled={wait > 0 || resendState.isLoading} onClick={() => void send(other)} className="font-semibold underline disabled:text-subtle disabled:no-underline">
              {other === 'sms' ? 'Mandármelo por SMS' : 'Mandármelo por correo'}
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
