import { createReducer } from "@reduxjs/toolkit";

const initialState = { products: [] };

export const productReducer = createReducer(initialState, {
  ProductRequest: (state) => {
    state.loading = true;
    state.products = [];
  },
  AdminProductRequest: (state) => {
    state.loading = true;
    state.products = [];
  },
  ProductSuccess: (state, action) => {
    state.loading = false;
    state.products = action.payload.products;
    state.productsCount = action.payload.productCount;
    state.resultPerPage = action.payload.resultPerPage;
    state.filteredProductsCount = action.payload.filteredProductsCount;
  },
  AdminProductSuccess: (state, action) => {
    state.loading = false;
    state.products = action.payload;
  },
  ProductFailure: (state, action) => {
    state.loading = false;
    state.error = action.payload;
  },
  AdminProductFailure: (state, action) => {
    state.loading = false;
    state.error = action.payload;
  },
  ClearErrors: (state) => {
    state.error = null;
  },
});

export const productModifyReducer = createReducer(
  {},
  {
    DeleteProductRequest: (state) => {
      state.loading = true;
    },
    DeleteProductSuccess: (state, action) => {
      state.loading = false;
      state.isDeleted = action.payload;
    },
    DeleteProductFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    DeleteProductReset: (state) => {
      state.isDeleted = false;
    },
    UpdateProductRequest: (state) => {
      state.loading = true;
    },
    UpdateProductSuccess: (state, action) => {
      state.loading = false;
      state.isUpdated = action.payload;
    },
    UpdateProductFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    UpdateProductReset: (state) => {
      state.isUpdated = false;
    },
    ClearErrors: (state) => {
      state.error = null;
    },
  }
);

export const newProductReducer = createReducer(
  { product: {} },
  {
    NewProductRequest: (state) => {
      state.loading = true;
    },
    NewProductSuccess: (state, action) => {
      state.loading = false;
      state.success = action.payload.success;
      state.product = action.payload.product;
    },
    NewProductFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    NewProductReset: (state) => {
      state.success = false;
    },
    ClearErrors: (state) => {
      state.error = null;
    },
  }
);

export const productDetailsReducer = createReducer(
  { product: {} },
  {
    ProductDetailsRequest: (state) => {
      state.loading = true;
    },
    ProductDetailsSuccess: (state, action) => {
      state.loading = false;
      state.product = action.payload.product;
    },
    ProductDetailsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    ClearErrors: (state) => {
      state.error = null;
    },
  }
);

export const createReviewReducer = createReducer(
  {},
  {
    NewReviewRequest: (state) => {
      state.loading = true;
    },
    NewReviewSuccess: (state, action) => {
      state.loading = false;
      state.success = action.payload;
    },
    NewReviewFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    NewReviewReset: (state) => {
      state.success = false;
    },
    ClearErrors: (state) => {
      state.error = null;
    },
  }
);

export const allProductReviewsReducer = createReducer(
  { reviews: [] },
  {
    AllReviewRequest: (state) => {
      state.loading = true;
    },
    AllReviewSuccess: (state, action) => {
      state.loading = false;
      state.reviews = action.payload;
    },
    AllReviewFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    ClearErrors: (state) => {
      state.error = null;
    },
  }
);

export const reviewReducer = createReducer(
  {},
  {
    DeleteReviewRequest: (state) => {
      state.loading = true;
    },
    DeleteReviewSuccess: (state, action) => {
      state.loading = false;
      state.isDeleted = action.payload;
    },
    DeleteReviewFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    DeleteReviewReset: (state) => {
      state.isDeleted = false;
    },
    ClearErrors: (state) => {
      state.error = null;
    },
  }
);
