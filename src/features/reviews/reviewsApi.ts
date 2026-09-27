import { api } from '../../services/api'

export type Review = {
  id: string
  rating: number
  title: string | null
  comment: string | null
  authorName: string
  verifiedPurchase: boolean
  isHidden: boolean
  isMine: boolean
  createdAt: string
  updatedAt: string
}

export type ReviewSummary = { count: number; average: number | null; distribution: Record<'1' | '2' | '3' | '4' | '5', number> }
export type ReviewSort = 'recent' | 'best' | 'worst'
export type ReviewsPage = { summary: ReviewSummary; items: Review[]; mine: Review | null; page: number; totalPages: number }
export type ReviewInput = { rating: number; title: string | null; comment: string | null }
export type AdminReview = Omit<Review, 'isMine'> & { productName: string; productSlug: string; userEmail: string }

export const reviewsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getReviews: build.query<ReviewsPage, { slug: string; sort: ReviewSort; page: number }>({
      query: ({ slug, sort, page }) => `/products/${slug}/reviews?sort=${sort}&page=${page}&limit=5`,
      providesTags: (_r, _e, { slug }) => [{ type: 'Reviews', id: slug }],
    }),
    saveReview: build.mutation<Review, { slug: string } & ReviewInput>({
      query: ({ slug, ...body }) => ({ url: `/products/${slug}/reviews/mine`, method: 'PUT', body }),
      transformResponse: (res: { review: Review }) => res.review,
      // El promedio de las tarjetas del catálogo también cambia
      invalidatesTags: (_r, _e, { slug }) => [{ type: 'Reviews', id: slug }, 'AdminReviews'],
    }),
    deleteReview: build.mutation<void, string>({
      query: (slug) => ({ url: `/products/${slug}/reviews/mine`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, slug) => [{ type: 'Reviews', id: slug }, 'AdminReviews'],
    }),
    // ---- admin
    getAdminReviews: build.query<{ items: AdminReview[]; page: number; totalPages: number; total: number }, { status: 'all' | 'visible' | 'hidden'; page: number }>({
      query: ({ status, page }) => `/admin/reviews?status=${status}&page=${page}`,
      providesTags: ['AdminReviews'],
    }),
    moderateReview: build.mutation<void, { id: string; isHidden: boolean; productSlug: string }>({
      query: ({ id, isHidden }) => ({ url: `/admin/reviews/${id}`, method: 'PATCH', body: { isHidden } }),
      invalidatesTags: (_r, _e, { productSlug }) => ['AdminReviews', { type: 'Reviews', id: productSlug }],
    }),
  }),
})

export const { useGetReviewsQuery, useSaveReviewMutation, useDeleteReviewMutation, useGetAdminReviewsQuery, useModerateReviewMutation } = reviewsApi
