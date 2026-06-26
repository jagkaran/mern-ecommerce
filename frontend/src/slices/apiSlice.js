import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/',
    credentials: 'include', // send cookies for auth & CSRF
  }),
  tagTypes: ['Product', 'Order', 'User'],
  endpoints: () => ({}),
});

// Export hooks for usage in components
export const { reducer: apiReducer, middleware: apiMiddleware } = apiSlice;
