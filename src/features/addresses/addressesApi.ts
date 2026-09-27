import { api } from '../../services/api'
import type { Address, AddressInput } from './types'

export const addressesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAddresses: build.query<Address[], void>({
      query: () => '/addresses',
      transformResponse: (res: { addresses: Address[] }) => res.addresses,
      providesTags: ['Addresses'],
    }),
    createAddress: build.mutation<Address, AddressInput>({
      query: (body) => ({ url: '/addresses', method: 'POST', body }),
      transformResponse: (res: { address: Address }) => res.address,
      invalidatesTags: ['Addresses'],
    }),
    makeDefaultAddress: build.mutation<Address, string>({
      query: (id) => ({ url: `/addresses/${id}/default`, method: 'PATCH' }),
      invalidatesTags: ['Addresses'],
    }),
    deleteAddress: build.mutation<void, string>({
      query: (id) => ({ url: `/addresses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Addresses'],
    }),
  }),
})

export const { useGetAddressesQuery, useCreateAddressMutation, useMakeDefaultAddressMutation, useDeleteAddressMutation } =
  addressesApi
