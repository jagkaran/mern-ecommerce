import axios from "axios";

export const getProduct =
  (
    keyword = "",
    currentPage = 1,
    price = [0, 5000],
    category,
    ratingValue = 0
  ) =>
  async (dispatch) => {
    try {
      dispatch({
        type: "ProductRequest",
      });

      let link = `/api/v1/products?keyword=${keyword}&page=${currentPage}
                  &price[gte]=${price[0]}&price[lte]=${price[1]}&ratings[gte]=${ratingValue}`;

      if (category) {
        link = `/api/v1/products?keyword=${keyword}&page=${currentPage}
                &price[gte]=${price[0]}&price[lte]=${price[1]}&category=${category}&ratings[gte]=${ratingValue}`;
      }

      const { data } = await axios.get(link);

      dispatch({
        type: "ProductSuccess",
        payload: data,
      });
    } catch (error) {
      dispatch({
        type: "ProductFailure",
        payload: error.response.data.message,
      });
    }
  };

export const getProductDetails = (id) => async (dispatch) => {
  try {
    dispatch({
      type: "ProductDetailsRequest",
    });

    const { data } = await axios.get(`/api/v1/product/${id}`);

    dispatch({
      type: "ProductDetailsSuccess",
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: "ProductDetailsFailure",
      payload: error.response.data.message,
    });
  }
};

// NEW REVIEW
export const newReview = (reviewData) => async (dispatch) => {
  try {
    dispatch({ type: "NewReviewRequest" });

    const config = {
      headers: { "Content-Type": "application/json" },
    };

    const { data } = await axios.put(`/api/v1/review`, reviewData, config);

    dispatch({
      type: "NewReviewSuccess",
      payload: data.success,
    });
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

    dispatch({
      type: "AllReviewSuccess",
      payload: data.reviews,
    });
  } catch (error) {
    dispatch({
      type: "AllReviewFailure",
      payload: error.response.data.message,
    });
  }
};

// Delete Review of a Product -- ADMIN ONLY
export const deleteReview = (reviewId, productId) => async (dispatch) => {
  try {
    dispatch({ type: "DeleteReviewRequest" });

    const { data } = await axios.delete(
      `/api/v1/reviews?id=${reviewId}&productId=${productId}`
    );

    dispatch({
      type: "DeleteReviewSuccess",
      payload: data.success,
    });
  } catch (error) {
    dispatch({
      type: "DeleteReviewFailure",
      payload: error.response.data.message,
    });
  }
};

// Get All Products For Admin
export const getAdminProducts = () => async (dispatch) => {
  try {
    dispatch({ type: "AdminProductRequest" });

    const { data } = await axios.get("/api/v1/admin/products");

    dispatch({
      type: "AdminProductSuccess",
      payload: data.products,
    });
  } catch (error) {
    dispatch({
      type: "AdminProductFailure",
      payload: error.response.data.message,
    });
  }
};

// Create Product -- Admin
export const createProduct = (productData) => async (dispatch) => {
  try {
    dispatch({ type: "NewProductRequest" });

    const config = {
      headers: { "Content-Type": "application/json" },
    };

    const { data } = await axios.post(
      `/api/v1/admin/product/new`,
      productData,
      config
    );

    dispatch({
      type: "NewProductSuccess",
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: "NewProductFailure",
      payload: error.response.data.message,
    });
  }
};

// Delete Product - ADMIN
export const deleteProduct = (id) => async (dispatch) => {
  try {
    dispatch({ type: "DeleteProductRequest" });

    const { data } = await axios.delete(`/api/v1/admin/product/${id}`);

    dispatch({
      type: "DeleteProductSuccess",
      payload: data.success,
    });
  } catch (error) {
    dispatch({
      type: "DeleteProductFailure",
      payload: error.response.data.message,
    });
  }
};

// Update Product -- ADMIN
export const updateProduct = (id, productData) => async (dispatch) => {
  try {
    dispatch({ type: "UpdateProductRequest" });

    const config = {
      headers: { "Content-Type": "application/json" },
    };

    const { data } = await axios.put(
      `/api/v1/admin/product/${id}`,
      productData,
      config
    );

    dispatch({
      type: "UpdateProductSuccess",
      payload: data.success,
    });
  } catch (error) {
    dispatch({
      type: "UpdateProductFailure",
      payload: error.response.data.message,
    });
  }
};

// Clearing Errors
export const clearErrors = () => async (dispatch) => {
  dispatch({
    type: "ClearErrors",
  });
};
