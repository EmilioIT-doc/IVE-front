import { api } from '../../services/api'

export type AppliedCoupon = { code: string; description: string; discountCents: number }

export type Coupon = {
  id: string
  code: string
  description: string | null
  discountType: 'percent' | 'fixed'
  discountValue: number
  minSubtotalCents: number
  maxUses: number | null
  usesCount: number
  perUserLimit: number | null
  startsAt: string | null
  endsAt: string | null
  isActive: boolean
  createdAt: string
}

export type NewCoupon = Omit<Coupon, 'id' | 'usesCount' | 'createdAt'>

export const couponsApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** Revisa un código contra la bolsa actual (el descuento real lo vuelve a calcular el checkout). */
    previewCoupon: build.mutation<AppliedCoupon, string>({
      query: (code) => ({ url: '/coupons/preview', method: 'POST', body: { code } }),
      transformResponse: (res: { coupon: AppliedCoupon }) => res.coupon,
    }),
    getCoupons: build.query<Coupon[], void>({
      query: () => '/admin/coupons',
      transformResponse: (res: { coupons: Coupon[] }) => res.coupons,
      providesTags: ['AdminCoupons'],
    }),
    createCoupon: build.mutation<Coupon, NewCoupon>({
      query: (body) => ({ url: '/admin/coupons', method: 'POST', body }),
      transformResponse: (res: { coupon: Coupon }) => res.coupon,
      invalidatesTags: ['AdminCoupons'],
    }),
    setCouponActive: build.mutation<Coupon, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({ url: `/admin/coupons/${id}`, method: 'PATCH', body: { isActive } }),
      invalidatesTags: ['AdminCoupons'],
    }),
    deleteCoupon: build.mutation<void, string>({
      query: (id) => ({ url: `/admin/coupons/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminCoupons'],
    }),
  }),
})

export const { usePreviewCouponMutation, useGetCouponsQuery, useCreateCouponMutation, useSetCouponActiveMutation, useDeleteCouponMutation } = couponsApi
