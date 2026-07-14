import axios from "axios";

export const createOrder = (order) => async (dispatch) => {
  try {
    dispatch({
      type: "CreateOrderRequest",
    });

    const config = { headers: { "Content-Type": "application/json" } };
    const { data } = await axios.post("/api/v1/order/new", order, config);

    dispatch({
      type: "CreateOrderSuccess",
      // Store only the order document — not the whole {success, order} envelope
      payload: data.order,
    });

    // Return both the order AND the claimToken (when present). Returning the
    // full object lets CheckoutPage pass `claimToken` into the success URL
    // for the /success page's ClaimForm. Authenticated users get
    // `claimToken: undefined`, callers must handle both shapes.
    //
    // LEGACY: prior versions returned `data.order` directly. Callers that
    // awaited a single `.order` doc (Shipping.js) will now need to read
    // `.order._id` off the resolved value — see CheckoutPage + Shipping
    // for the updated handling.
    return { order: data.order, claimToken: data.claimToken };
  } catch (error) {
    dispatch({
      type: "CreateOrderFail",
      payload: error.response?.data?.message || "Order failed",
    });
    // Preserve backward compatibility: dispatch error so callers that
    // check `result.error` still work.
    return { error: error.response?.data?.message || "Order failed" };
  }
};

export const myOrders = () => async (dispatch) => {
  try {
    dispatch({
      type: "MyOrdersRequest",
    });

    const { data } = await axios.get("/api/v1/orders/me");

    dispatch({
      type: "MyOrdersSuccess",
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: "MyOrdersFail",
      payload: error.response.data.message,
    });
  }
};

// Get Order Details
export const getOrderDetails = (id) => async (dispatch) => {
  try {
    dispatch({ type: "OrderDetailsRequest" });

    const { data } = await axios.get(`/api/v1/order/${id}`);

    dispatch({ type: "OrderDetailsSuccess", payload: data.order });
  } catch (error) {
    dispatch({
      type: "OrderDetailsFail",
      payload: error.response.data.message,
    });
  }
};

// Get All Orders (admin) — dispatch full payload so reducer gets orderCount + totalAmount
export const getAllOrders = () => async (dispatch) => {
  try {
    dispatch({ type: "AllOrdersRequest" });

    const { data } = await axios.get("/api/v1/admin/orders");

    // Pass the entire response object so the reducer can store
    // orders, orderCount, and totalAmount all at once.
    dispatch({ type: "AllOrdersSuccess", payload: data });
  } catch (error) {
    dispatch({
      type: "AllOrdersFail",
      payload: error.response.data.message,
    });
  }
};

// Update Order
export const updateOrder = (id, order) => async (dispatch) => {
  try {
    dispatch({ type: "UpdateOrderRequest" });

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    const { data } = await axios.put(
      `/api/v1/admin/order/${id}`,
      order,
      config
    );

    dispatch({ type: "UpdateOrderSuccess", payload: data.success });
  } catch (error) {
    dispatch({
      type: "UpdateOrderFail",
      payload: error.response.data.message,
    });
  }
};

// Delete Order
export const deleteOrder = (id) => async (dispatch) => {
  try {
    dispatch({ type: "DeleteOrderRequest" });

    const { data } = await axios.delete(`/api/v1/admin/order/${id}`);

    dispatch({ type: "DeleteOrderSuccess", payload: data.success });
  } catch (error) {
    dispatch({
      type: "DeleteOrderFail",
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
