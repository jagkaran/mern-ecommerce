import { createReducer } from "@reduxjs/toolkit";

const initialState = { products: [] };

export const productReducer = createReducer(initialState, (builder) => {
  builder
    .addCase("ProductRequest", (state) => {
      state.loading = true;
      state.products = [];
    })
    .addCase("AdminProductRequest", (state) => {
      state.loading = true;
      state.products = [];
    })
    .addCase("ProductSuccess", (state, action) => {
      state.loading = false;
      state.products = action.payload.products;
      state.productsCount = action.payload.productCount;
      state.resultPerPage = action.payload.resultPerPage;
      state.filteredProductsCount = action.payload.filteredProductsCount;
    })
    .addCase("AdminProductSuccess", (state, action) => {
      state.loading = false;
      state.products = action.payload;
    })
    .addCase("ProductFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("AdminProductFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("ClearErrors", (state) => {
      state.error = null;
    });
});

// Reducer for the dynamic active-categories list
export const categoriesReducer = createReducer(
  {
    categories: [],
    categoryCounts: {},
    priceRange: { min: 0, max: 5000 },
    loading: false,
    error: null,
  },
  (builder) => {
    builder
      .addCase("CategoriesRequest", (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase("CategoriesSuccess", (state, action) => {
        state.loading = false;
        state.categories = action.payload.categories;
        state.categoryCounts = action.payload.categoryCounts;
        state.priceRange = action.payload.priceRange;
      })
      .addCase("CategoriesFailure", (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
);

export const productModifyReducer = createReducer({}, (builder) => {
  builder
    .addCase("DeleteProductRequest", (state) => {
      state.loading = true;
    })
    .addCase("DeleteProductSuccess", (state, action) => {
      state.loading = false;
      state.isDeleted = action.payload;
    })
    .addCase("DeleteProductFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("DeleteProductReset", (state) => {
      state.isDeleted = false;
    })
    .addCase("UpdateProductRequest", (state) => {
      state.loading = true;
    })
    .addCase("UpdateProductSuccess", (state, action) => {
      state.loading = false;
      state.isUpdated = action.payload;
    })
    .addCase("UpdateProductFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("UpdateProductReset", (state) => {
      state.isUpdated = false;
    })
    .addCase("ClearErrors", (state) => {
      state.error = null;
    });
});

export const newProductReducer = createReducer({ product: {} }, (builder) => {
  builder
    .addCase("NewProductRequest", (state) => {
      state.loading = true;
    })
    .addCase("NewProductSuccess", (state, action) => {
      state.loading = false;
      state.success = action.payload.success;
      state.product = action.payload.product;
    })
    .addCase("NewProductFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("NewProductReset", (state) => {
      state.success = false;
    })
    .addCase("ClearErrors", (state) => {
      state.error = null;
    });
});

export const productDetailsReducer = createReducer({ product: {} }, (builder) => {
  builder
    .addCase("ProductDetailsRequest", (state) => {
      state.loading = true;
    })
    .addCase("ProductDetailsSuccess", (state, action) => {
      state.loading = false;
      state.product = action.payload.product;
    })
    .addCase("ProductDetailsFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("ClearErrors", (state) => {
      state.error = null;
    });
});

export const createReviewReducer = createReducer({}, (builder) => {
  builder
    .addCase("NewReviewRequest", (state) => {
      state.loading = true;
    })
    .addCase("NewReviewSuccess", (state, action) => {
      state.loading = false;
      state.success = action.payload;
    })
    .addCase("NewReviewFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("NewReviewReset", (state) => {
      state.success = false;
    })
    .addCase("ClearErrors", (state) => {
      state.error = null;
    });
});

export const allProductReviewsReducer = createReducer({ reviews: [] }, (builder) => {
  builder
    .addCase("AllReviewRequest", (state) => {
      state.loading = true;
    })
    .addCase("AllReviewSuccess", (state, action) => {
      state.loading = false;
      state.reviews = action.payload;
    })
    .addCase("AllReviewFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("ClearErrors", (state) => {
      state.error = null;
    });
});

export const reviewReducer = createReducer({}, (builder) => {
  builder
    .addCase("DeleteReviewRequest", (state) => {
      state.loading = true;
    })
    .addCase("DeleteReviewSuccess", (state, action) => {
      state.loading = false;
      state.isDeleted = action.payload;
    })
    .addCase("DeleteReviewFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("DeleteReviewReset", (state) => {
      state.isDeleted = false;
    })
    .addCase("ClearErrors", (state) => {
      state.error = null;
    });
});
