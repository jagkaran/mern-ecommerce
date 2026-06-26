import { apiSlice } from './apiSlice';

export const productsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      // Accept optional limit param; default handled by backend
      query: (limit) => {
        const url = limit ? `/api/v1/products?limit=${limit}` : '/api/v1/products';
        return { url };
      },
      providesTags: (result) =>
        result && result.products
          ? [
              ...result.products.map(({ _id }) => ({ type: 'Product', id: _id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
    }),
    getProductDetails: builder.query({
      query: (id) => `/api/v1/product/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    // Additional endpoints (create review, etc.) can be added later
  }),
  overrideExisting: false,
});

export const { useGetProductsQuery, useGetProductDetailsQuery } = productsApiSlice;
