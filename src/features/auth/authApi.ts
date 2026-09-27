import { api } from '../../services/api'
import type { Channel, RegisterInput, User, VerificationInfo } from './types'

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<User | null, void>({
      // Un 401 aquí no es un error de la app: simplemente no hay sesión.
      queryFn: async (_arg, _api, _extra, baseQuery) => {
        const result = await baseQuery('/auth/me')
        if (result.error) {
          return result.error.status === 401 ? { data: null } : { error: result.error }
        }
        return { data: (result.data as { user: User }).user }
      },
      providesTags: ['Me'],
    }),
    checkEmail: build.mutation<{ available: boolean }, { email: string }>({
      query: (body) => ({ url: '/auth/check-email', method: 'POST', body }),
    }),
    login: build.mutation<User, { email: string; password: string; remember: boolean }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: (res: { user: User }) => res.user,
    }),
    // Crea la cuenta y manda el código: todavía NO hay sesión
    register: build.mutation<VerificationInfo, RegisterInput>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      transformResponse: (res: { verification: VerificationInfo }) => res.verification,
    }),
    resendCode: build.mutation<VerificationInfo, { email: string; channel: Channel }>({
      query: (body) => ({ url: '/auth/verification/resend', method: 'POST', body }),
      transformResponse: (res: { verification: VerificationInfo }) => res.verification,
    }),
    // Código correcto → cuenta confirmada + sesión iniciada
    verifyCode: build.mutation<User, { email: string; code: string }>({
      query: (body) => ({ url: '/auth/verify', method: 'POST', body }),
      transformResponse: (res: { user: User }) => res.user,
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
  }),
})

export const {
  useGetMeQuery,
  useCheckEmailMutation,
  useLoginMutation,
  useRegisterMutation,
  useResendCodeMutation,
  useVerifyCodeMutation,
  useLogoutMutation,
} = authApi
