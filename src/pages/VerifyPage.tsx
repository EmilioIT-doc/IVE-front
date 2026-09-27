import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { VerifyCode } from '../components/auth/VerifyCode'
import { AuthLayout } from '../components/layout/AuthLayout'
import { ChannelOption } from '../components/auth/ChannelOption'
import { useResendCodeMutation } from '../features/auth/authApi'
import type { Channel, VerificationInfo } from '../features/auth/types'
import { getErrorMessage } from '../services/api'

type State = { email?: string; canUseSms?: boolean; from?: string } | null

/**
 * /verificar — para quien intenta iniciar sesión con una cuenta sin confirmar.
 * Elige por dónde recibir el código, lo pide y lo escribe.
 */
export function VerifyPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as State
  const [info, setInfo] = useState<VerificationInfo | null>(null)
  const [channel, setChannel] = useState<Channel>('email')
  const [error, setError] = useState<string | null>(null)
  const [resend, { isLoading }] = useResendCodeMutation()

  if (!state?.email) return <Navigate to="/login" replace />

  const request = async () => {
    setError(null)
    try {
      setInfo(await resend({ email: state.email!, channel }).unwrap())
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <AuthLayout
      tone="#d2cabc"
      aside={<p className="font-display text-[56px] leading-[1.02]">Un paso más<br /><em>y ya estás dentro.</em></p>}
    >
      {info ? (
        <VerifyCode info={info} onVerified={() => navigate(state.from ?? '/', { replace: true })} />
      ) : (
        <div className="flex animate-fade-in flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            <h1 className="font-display text-5xl leading-none md:text-[52px]">Confirma tu cuenta</h1>
            <p className="text-[15px] text-muted">Tu cuenta <strong className="text-ink">{state.email}</strong> todavía no está confirmada. Te mandamos un código para terminar.</p>
          </div>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-[13px] font-semibold">¿Dónde quieres recibirlo?</legend>
            <ChannelOption checked={channel === 'email'} onChange={() => setChannel('email')} title="Por correo" text="Llega a tu bandeja de entrada" />
            {state.canUseSms && <ChannelOption checked={channel === 'sms'} onChange={() => setChannel('sms')} title="Por SMS" text="A tu celular registrado" />}
          </fieldset>
          {error && <p role="alert" className="animate-fade-in text-sm font-medium text-danger">{error}</p>}
          <button type="button" onClick={() => void request()} disabled={isLoading} className="h-14 bg-ink text-sm font-semibold tracking-[0.08em] text-bone uppercase disabled:opacity-60">
            {isLoading ? 'Enviando…' : 'Mandarme el código'}
          </button>
          <Link to="/login" className="text-sm text-muted">Volver a iniciar sesión</Link>
        </div>
      )}
    </AuthLayout>
  )
}
