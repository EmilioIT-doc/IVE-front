import type { Framing } from '../../lib/framing'
import { api } from '../../services/api'

/** Lugares del sitio con foto editable desde el panel (ver migración 018 del back). */
export type SiteSlot = 'home_hero' | 'home_editorial'
export type SiteImage = { url: string | null; altText: string | null; framing: Framing; updatedAt: string }
export type SiteImages = Record<SiteSlot, SiteImage>

export const siteApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSiteImages: build.query<SiteImages, void>({
      query: () => '/site-images',
      transformResponse: (res: { images: SiteImages }) => res.images,
      providesTags: ['Site'],
    }),
    updateSiteImageAlt: build.mutation<SiteImages, { slot: SiteSlot; altText: string | null }>({
      query: ({ slot, altText }) => ({ url: `/admin/site-images/${slot}`, method: 'PATCH', body: { altText } }),
      transformResponse: (res: { images: SiteImages }) => res.images,
      invalidatesTags: ['Site'],
    }),
    updateSiteImageFraming: build.mutation<SiteImages, { slot: SiteSlot; framing: Framing }>({
      query: ({ slot, framing }) => ({ url: `/admin/site-images/${slot}/framing`, method: 'PUT', body: framing }),
      transformResponse: (res: { images: SiteImages }) => res.images,
      invalidatesTags: ['Site'],
    }),
    removeSiteImage: build.mutation<SiteImages, SiteSlot>({
      query: (slot) => ({ url: `/admin/site-images/${slot}/image`, method: 'DELETE' }),
      transformResponse: (res: { images: SiteImages }) => res.images,
      invalidatesTags: ['Site'],
    }),
  }),
})

export const {
  useGetSiteImagesQuery,
  useUpdateSiteImageAltMutation,
  useUpdateSiteImageFramingMutation,
  useRemoveSiteImageMutation,
} = siteApi
