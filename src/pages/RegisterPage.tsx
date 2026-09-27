import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { VerifyCode } from '../components/auth/VerifyCode'
import { AddressForm } from '../components/forms/AddressForm'
import { Field } from '../components/forms/Field'
import { PasswordToggle } from '../components/forms/PasswordToggle'
import { AuthLayout } from '../components/layout/AuthLayout'
import type { AddressFormValues } from '../features/addresses/schemas'
import { useCheckEmailMutation } from '../features/auth/authApi'
import {
  PASSWORD_RULES,
  registerStep1Schema,
  registerStep2Schema,
  type RegisterStep1Input,
  type RegisterStep1Values,
  type RegisterStep2Values,
} from '../features/auth/schemas'
import type { VerificationInfo } from '../features/auth/types'
import { useSession } from '../features/auth/useSession'
import { getErrorMessage } from '../services/api'
import { ChannelOption } from '../components/auth/ChannelOption'

/**
 * Registro en 4 pasos:
 *  1 Tus datos (nombre, correo, celular, nacimiento) · 2 Domicilio · 3 Contraseña y cómo recibir el código
 *  4 Escribir el código (la cuenta existe, pero no sirve hasta confirmarlo) → bienvenida
 */
type Step = 1 | 2 | 3 | 4 | 'done'
const LABELS = { 1: 'Tus datos', 2: 'Domicilio', 3: 'Contraseña', 4: 'Confirmación' } as const

export function RegisterPage() {
  const [step, setStep] = useState<Step>(1)
  const [data, setData] = useState<RegisterStep1Values | null>(null)
  const [address, setAddress] = useState<AddressFormValues | null>(null)
  const [verification, setVerification] = useState<VerificationInfo | null>(null)
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  return (
    <AuthLayout
      tone="#cfc7b8"
      aside={
        <div className="flex flex-col gap-5">
          <p className="font-display text-[56px] leading-[1.02]">
            Crea tu cuenta
            <br />
            <em>en un minuto.</em>
          </p>
          <ul className="flex flex-col gap-2.5 text-[15px]">
            {['Sigue tus pedidos', 'Tu dirección lista para comprar', 'Guarda tus favoritos', 'Deja reseñas de lo que compras'].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <CheckMark /> {t}
              </li>
            ))}
          </ul>
        </div>
      }
    >
      <div className="flex flex-col gap-7">
        {step !== 'done' && (
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
              Paso {step} de 4 · {LABELS[step]}
            </span>
            <div role="progressbar" aria-label="Avance del registro" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step} className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <span key={n} className={`h-[3px] transition-colors duration-300 ${n <= step ? 'bg-ink' : 'bg-[#d6d0c5]'}`} />
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <StepOne
            defaults={data}
            onNext={(values) => {
              setData(values)
              setStep(2)
            }}
          />
        )}
        {step === 2 && data && (
          <div className="flex animate-fade-in flex-col gap-6">
            <div className="flex flex-col gap-2.5">
              <h1 className="font-display text-5xl leading-none md:text-[52px]">Tu domicilio</h1>
              <p className="text-[15px] text-muted">Queda como tu dirección de envío principal; la puedes cambiar cuando quieras.</p>
            </div>
            <AddressForm
              submitLabel="Continuar"
              hideDefaultOption
              defaultValues={{
                ...(address ? { ...address, intNumber: address.intNumber ?? '' } : {}),
                recipientName: address?.recipientName ?? `${data.firstName} ${data.lastName}`,
                phone: address?.phone ?? data.phone,
              }}
              onSubmit={(values) => {
                setAddress(values)
                setStep(3)
              }}
              secondaryAction={<button type="button" onClick={() => setStep(1)} className="h-14 border border-ink px-6 text-sm font-semibold">Atrás</button>}
            />
          </div>
        )}
        {step === 3 && data && address && (
          <StepThree
            data={data}
            address={address}
            onBack={() => setStep(2)}
            onSent={(info) => {
              setVerification(info)
              setStep(4)
            }}
          />
        )}
        {step === 4 && verification && <VerifyCode info={verification} onVerified={() => setStep('done')} />}
        {step === 'done' && data && <Welcome name={data.firstName} from={from} />}
      </div>
    </AuthLayout>
  )
}

/** Paso 1: datos personales + ¿el correo ya existe? (POST /auth/check-email) */
function StepOne({ defaults, onNext }: { defaults: RegisterStep1Values | null; onNext: (v: RegisterStep1Values) => void }) {
  const location = useLocation()
  const [checkEmail] = useCheckEmailMutation()
  const [emailTaken, setEmailTaken] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterStep1Input, unknown, RegisterStep1Values>({
    resolver: zodResolver(registerStep1Schema),
    defaultValues: defaults ?? { firstName: '', lastName: '', email: '', phone: '', birthDate: '' },
  })
  // Máximo: hoy (no se puede nacer en el futuro)
  const today = new Date().toISOString().slice(0, 10)

  const onSubmit = handleSubmit(async (values) => {
    setEmailTaken(false)
    try {
      const { available } = await checkEmail({ email: values.email }).unwrap()
      if (!available) {
        setEmailTaken(true)
        setError('email', { message: 'Ya existe una cuenta con este correo.' })
        return
      }
      onNext(values)
    } catch (err) {
      setError('root', { message: getErrorMessage(err) })
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex animate-fade-in flex-col gap-7">
      <div className="flex flex-col gap-2.5">
        <h1 className="font-display text-5xl leading-none md:text-[52px]">Tus datos</h1>
        <p className="text-[15px] text-muted">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" state={location.state} className="font-semibold text-ink">
            Inicia sesión
          </Link>
        </p>
      </div>
      {errors.root && <p role="alert" className="text-sm font-medium text-danger">{errors.root.message}</p>}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-4">
        <Field label="Nombre" autoComplete="given-name" error={errors.firstName?.message} {...register('firstName')} />
        <Field label="Apellido" autoComplete="family-name" error={errors.lastName?.message} {...register('lastName')} />
        <div className="sm:col-span-2">
          <Field label="Correo electrónico" type="email" autoComplete="email" placeholder="tu@correo.com" error={errors.email?.message} {...register('email')} />
          {emailTaken && (
            <p className="mt-1.5 text-xs text-muted">
              <Link to="/login" state={location.state} className="font-semibold text-ink">Inicia sesión</Link> con ese correo.
            </p>
          )}
        </div>
        <Field label="Celular" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="55 1234 5678" hint="10 dígitos" error={errors.phone?.message} {...register('phone')} />
        <Field label="Fecha de nacimiento" type="date" max={today} autoComplete="bday" error={errors.birthDate?.message} {...register('birthDate')} />
      </div>
      <button type="submit" disabled={isSubmitting} className="h-14 bg-ink text-sm font-semibold tracking-[0.08em] text-bone uppercase disabled:opacity-60">
        {isSubmitting ? 'Revisando…' : 'Continuar'}
      </button>
    </form>
  )
}

/** Paso 3: contraseña con requisitos en vivo, por dónde mandar el código y términos. */
function StepThree({ data, address, onBack, onSent }: { data: RegisterStep1Values; address: AddressFormValues; onBack: () => void; onSent: (info: VerificationInfo) => void }) {
  const session = useSession()
  const [show, setShow] = useState(false)
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<RegisterStep2Values>({
    resolver: zodResolver(registerStep2Schema),
    mode: 'onChange', // valida mientras escribes → habilita el botón en vivo
    defaultValues: { password: '', confirmPassword: '', terms: false, channel: 'email' },
  })
  const password = useWatch({ control, name: 'password' })
  const channel = useWatch({ control, name: 'channel' })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const info = await session.register({
        ...data,
        password: values.password,
        channel: values.channel,
        address: { ...address, intNumber: address.intNumber || null },
      })
      onSent(info)
    } catch (err) {
      setError('root', { message: getErrorMessage(err) })
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex animate-fade-in flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <h1 className="font-display text-5xl leading-none md:text-[52px]">Crea tu contraseña</h1>
        <p className="text-[15px] text-muted">
          Para {data.email} ·{' '}
          <button type="button" onClick={onBack} className="text-ink underline">Atrás</button>
        </p>
      </div>
      {errors.root && <p role="alert" className="text-sm font-medium text-danger">{errors.root.message}</p>}

      <Field
        label="Contraseña"
        type={show ? 'text' : 'password'}
        autoComplete="new-password"
        aria-describedby="reglas-password"
        trailing={<PasswordToggle visible={show} onToggle={() => setShow((v) => !v)} />}
        {...register('password')}
      />
      <ul id="reglas-password" aria-label="Requisitos de la contraseña" className="-mt-2 grid grid-cols-2 gap-2.5">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.regex.test(password ?? '')
          return (
            <li key={rule.label} className={`flex items-center gap-2 text-[13px] ${ok ? 'text-ink' : 'text-muted'}`}>
              {ok ? (
                <span className="flex size-[18px] animate-fade-in items-center justify-center rounded-full bg-olive text-bone"><CheckMark size={11} /></span>
              ) : (
                <span className="size-[18px] rounded-full border-[1.5px] border-[#a39e95]" />
              )}
              {rule.label}
              <span className="sr-only">{ok ? '(cumplido)' : '(pendiente)'}</span>
            </li>
          )
        })}
      </ul>

      <Field
        label="Confirma la contraseña"
        type={show ? 'text' : 'password'}
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-[13px] font-semibold">Para confirmar que eres tú, te mandamos un código</legend>
        <ChannelOption checked={channel === 'email'} onChange={() => setValue('channel', 'email', { shouldValidate: true })} title="Por correo" text={data.email} />
        <ChannelOption checked={channel === 'sms'} onChange={() => setValue('channel', 'sms', { shouldValidate: true })} title="Por SMS" text={`Al ${data.phone.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3')}`} />
      </fieldset>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-normal">
        <input type="checkbox" className="mt-0.5 size-[18px] shrink-0" {...register('terms')} />
        <span>
          Acepto los <Link to="/ayuda/terminos">Términos</Link> y el <Link to="/ayuda/privacidad">Aviso de privacidad</Link>.
        </span>
      </label>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="h-14 border border-ink px-6 text-sm font-semibold">Atrás</button>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="h-14 flex-1 bg-ink text-sm font-semibold tracking-[0.08em] text-bone uppercase disabled:bg-[#d8d3ca] disabled:text-[#5e5a53]"
        >
          {isSubmitting ? 'Creando…' : 'Crear cuenta'}
        </button>
      </div>
    </form>
  )
}

function Welcome({ name, from }: { name: string; from?: string }) {
  const navigate = useNavigate()
  return (
    <div className="flex animate-fade-in flex-col gap-6">
      <span className="flex size-16 items-center justify-center rounded-full bg-ink text-bone"><CheckMark size={30} /></span>
      <h1 className="font-display text-5xl leading-none md:text-[56px]">
        Te damos la bienvenida,
        <br />
        <em>{name.split(' ')[0]}.</em>
      </h1>
      <p className="text-[15px] text-muted">Tu cuenta quedó confirmada y ya iniciaste sesión.</p>
      <button type="button" onClick={() => navigate(from ?? '/tienda', { replace: true })} className="flex h-[52px] items-center self-start bg-ink px-8 text-sm font-semibold tracking-wide text-bone">
        {from === '/checkout' ? 'Continuar con mi compra' : 'Ir a la tienda'}
      </button>
    </div>
  )
}

function CheckMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12l5 5 9-10" />
    </svg>
  )
}
