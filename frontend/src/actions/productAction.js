import axios from "axios";

export const getProduct =
  (
    keyword = "",
    currentPage = 1,
    price = [0, 5000],
    category,
    ratingValue = 0,
    sort = "newest"
  ) =>
  async (dispatch) => {
    try {
      dispatch({ type: "ProductRequest" });

      let link = `/api/v1/products?keyword=${keyword}&page=${currentPage}&price[gte]=${price[0]}&price[lte]=${price[1]}&ratings[gte]=${ratingValue}`;
      if (category) link += `&category=${category}`;
      if (sort && sort !== "newest") link += `&sort=${sort}`;

      const { data } = await axios.get(link);
      dispatch({ type: "ProductSuccess", payload: data });
    } catch (error) {
      dispatch({ type: "ProductFailure", payload: error.response.data.message });
    }
  };

// Fetch active categories plus per-category counts and global price range.
// Used by the PLP sidebar to render category badges and dynamic slider.
export const getActiveCategories = () => async (dispatch) => {
  try {
    dispatch({ type: "CategoriesRequest" });
    const { data } = await axios.get("/api/v1/products/categories");
    dispatch({
      type: "CategoriesSuccess",
      payload: {
        categories: data.categories || [],
        categoryCounts: data.categoryCounts || {},
        priceRange: data.priceRange || { min: 0, max: 5000 },
      },
    });
  } catch (error) {
    dispatch({
      type: "CategoriesFailure",
      payload: error?.response?.data?.message || "Failed to load categories",
    });
  }
};

export const getProductDetails = (id) => async (dispatch) => {
  try {
    dispatch({ type: "ProductDetailsRequest" });
    const { data } = await axios.get(`/api/v1/product/${id}`);
    // JSON round-trip converts all Date objects (e.g. review.createdAt returned
    // by Mongoose) into plain ISO strings. Without this, Immer wraps the Date
    // in a Proxy, new Date(proxy) returns Invalid Date, and the date label
    // never renders in Reviewcard.
    const safeData = JSON.parse(JSON.stringify(data));
    dispatch({ type: "ProductDetailsSuccess", payload: safeData });
  } catch (error) {
    dispatch({ type: "ProductDetailsFailure", payload: error.response.data.message });
  }
};

// NEW REVIEW — send as plain JSON (not FormData) so body-parser can read it.
export const newReview = (reviewData) => async (dispatch) => {
  try {
    dispatch({ type: "NewReviewRequest" });

    // FormData cannot be serialised as JSON — convert to plain object first.
    let payload;
    if (reviewData instanceof FormData) {
      payload = Object.fromEntries(reviewData.entries());
    } else {
      payload = reviewData;
    }

    const config = { headers: { "Content-Type": "application/json" } };
    const { data } = await axios.put(`/api/v1/review`, payload, config);
    dispatch({ type: "NewReviewSuccess", payload: data.success });
  } catch (error) {
    dispatch({
      type: "NewReviewFailure",
      payload: error.response.data.message,
    });
  }
};

// Get All Reviews of a Product -- ADMIN ONLY
export const getAllReviews = (id) => async (dispatch) => {
  try {
    dispatch({ type: "AllReviewRequest" });
    const { data } = await axios.get(`/api/v1/reviews?id=${id}`);
    dispatch({ type: "AllReviewSuccess", payload: data.reviews });
  } catch (error) {
    dispatch({ type: "AllReviewFailure", payload: error.response.data.message });
  }
};

// Delete Review of a Product -- ADMIN ONLY
export const deleteReview = (reviewId, productId) => async (dispatch) => {
  try {
    dispatch({ type: "DeleteReviewRequest" });
    const { data } = await axios.delete(
      `/api/v1/review?id=${reviewId}&productId=${productId}`
    );
    dispatch({ type: "DeleteReviewSuccess", payload: data.success });
  } catch (error) {
    dispatch({ type: "DeleteReviewFailure", payload: error.response.data.message });
  }
};

// Get ALL Products For Admin (no pagination — admins see everything)
export const getAdminProducts = () => async (dispatch) => {
  try {
    dispatch({ type: "AdminProductRequest" });
    const { data } = await axios.get("/api/v1/admin/products");
    dispatch({ type: "AdminProductSuccess", payload: data.products });
  } catch (error) {
    dispatch({ type: "AdminProductFailure", payload: error.response.data.message });
  }
};

// Create Product -- Admin
export const createProduct = (productData) => async (dispatch) => {
  try {
    dispatch({ type: "NewProductRequest" });
    const config = { headers: { "Content-Type": "application/json" } };
    const { data } = await axios.post(`/api/v1/admin/product/new`, productData, config);
    dispatch({ type: "NewProductSuccess", payload: data });
  } catch (error) {
    dispatch({ type: "NewProductFailure", payload: error.response.data.message });
  }
};

// Delete Product - ADMIN
export const deleteProduct = (id) => async (dispatch) => {
  try {
    dispatch({ type: "DeleteProductRequest" });
    const { data } = await axios.delete(`/api/v1/admin/product/${id}`);
    dispatch({ type: "DeleteProductSuccess", payload: data.success });
  } catch (error) {
    dispatch({ type: "DeleteProductFailure", payload: error.response.data.message });
  }
};

// Update Product -- ADMIN
export const updateProduct = (id, productData) => async (dispatch) => {
  try {
    dispatch({ type: "UpdateProductRequest" });
    const config = { headers: { "Content-Type": "application/json" } };
    const { data } = await axios.put(`/api/v1/admin/product/${id}`, productData, config);
    dispatch({ type: "UpdateProductSuccess", payload: data.success });
  } catch (error) {
    dispatch({ type: "UpdateProductFailure", payload: error.response.data.message });
  }
};

// Clearing Errors
export const clearErrors = () => async (dispatch) => {
  dispatch({ type: "ClearErrors" });
};
