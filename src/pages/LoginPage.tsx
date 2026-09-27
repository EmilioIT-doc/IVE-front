import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { Field } from '../components/forms/Field'
import { PasswordToggle } from '../components/forms/PasswordToggle'
import { AuthLayout } from '../components/layout/AuthLayout'
import { loginSchema, type LoginValues } from '../features/auth/schemas'
import { useAuth } from '../features/auth/useAuth'
import { useSession } from '../features/auth/useSession'
import { getErrorMessage, type ApiErrorBody } from '../services/api'

export function LoginPage() {
  const { user } = useAuth()
  const session = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  })

  // Si ya hay sesión, no tiene sentido ver el login
  if (user && !isSubmitting) return <Navigate to={from} replace />

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      await session.login(values)
      navigate(from, { replace: true })
    } catch (err) {
      // Cuenta sin confirmar: lo mandamos a pedir su código
      const body = (err as { data?: ApiErrorBody }).data
      if (body?.error.code === 'ACCOUNT_NOT_VERIFIED') {
        const details = body.error.details as { email: string; canUseSms: boolean }
        navigate('/verificar', { state: { email: details.email, canUseSms: details.canUseSms, from } })
        return
      }
      setServerError(getErrorMessage(err))
    }
  })

  return (
    <AuthLayout
      tone="#d2cabc"
      aside={
        <div className="flex flex-col gap-4">
          <p className="font-display text-[56px] leading-[1.02]">
            Tus pedidos, tus direcciones
            <br />
            <em>y tu bolsa, en un solo lugar.</em>
          </p>
          <span className="text-[11px] font-semibold tracking-[0.14em] text-[#4a463f] uppercase">[Foto de campaña]</span>
        </div>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-7">
        <div className="flex flex-col gap-2.5">
          <h1 className="font-display text-5xl leading-none md:text-[56px]">Inicia sesión</h1>
          <p className="text-[15px] text-muted">
            ¿Aún no tienes cuenta?{' '}
            <Link to="/registro" state={location.state} className="font-semibold text-ink">
              Crea una
            </Link>
          </p>
        </div>

        {serverError && (
          <div role="alert" className="flex animate-fade-in items-start gap-2.5 bg-[#f4e4de] px-4 py-3.5 text-sm text-[#7a2615]">
            {serverError}
          </div>
        )}

        <div className="flex flex-col gap-5">
          <Field label="Correo electrónico" type="email" autoComplete="email" placeholder="tu@correo.com" error={errors.email?.message} {...register('email')} />
          <div className="flex flex-col gap-1.5">
            <Field
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Tu contraseña"
              error={errors.password?.message}
              trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
              {...register('password')}
            />
            <Link to="/ayuda/recuperar" className="self-end text-[13px] text-muted">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input type="checkbox" className="size-[18px]" {...register('remember')} />
            Mantener mi sesión iniciada
          </label>
        </div>

        <button type="submit" disabled={isSubmitting} className="h-14 bg-ink text-sm font-semibold tracking-[0.08em] text-bone uppercase disabled:opacity-60">
          {isSubmitting ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>
    </AuthLayout>
  )
}
