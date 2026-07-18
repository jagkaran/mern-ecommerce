import { createReducer } from "@reduxjs/toolkit";

export const newOrderReducer = createReducer({}, (builder) => {
  builder.addCase("CreateOrderRequest", (state) => {
    state.loading = true;
  });
  builder.addCase("CreateOrderSuccess", (state, action) => {
    state.loading = false;
    state.order = action.payload;
  });
  builder.addCase("CreateOrderFail", (state, action) => {
    state.loading = false;
    state.error = action.payload;
  });
  builder.addCase("ClearErrors", (state) => {
    state.error = null;
  });
});

export const myOrdersReducer = createReducer({ orders: [] }, (builder) => {
  builder.addCase("MyOrdersRequest", (state) => {
    state.loading = true;
  });
  builder.addCase("MyOrdersSuccess", (state, action) => {
    state.loading = false;
    state.orders = action.payload.orders;
    state.ordersCount = action.payload.orderCount;
  });
  builder.addCase("MyOrdersFail", (state, action) => {
    state.loading = false;
    state.error = action.payload;
  });
  builder.addCase("ClearErrors", (state) => {
    state.error = null;
  });
});

export const allOrdersReducer = createReducer(
  { orders: [], orderCount: 0, totalAmount: 0 },
  (builder) => {
    builder.addCase("AllOrdersRequest", (state) => {
      state.loading = true;
    });
    builder.addCase("AllOrdersSuccess", (state, action) => {
      state.loading = false;
      state.orders = action.payload.orders;
      state.orderCount = action.payload.orderCount;
      state.totalAmount = action.payload.totalAmount;
    });
    builder.addCase("AllOrdersFail", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    builder.addCase("ClearErrors", (state) => {
      state.error = null;
    });
  }
);

export const modifiedOrderReducer = createReducer({}, (builder) => {
  builder.addCase("UpdateOrderRequest", (state) => {
    state.loading = true;
  });
  builder.addCase("UpdateOrderSuccess", (state, action) => {
    state.loading = false;
    state.isUpdated = action.payload;
  });
  builder.addCase("UpdateOrderFail", (state, action) => {
    state.loading = false;
    state.error = action.payload;
  });
  builder.addCase("UpdateOrderReset", (state) => {
    state.isUpdated = false;
  });
  builder.addCase("DeleteOrderRequest", (state) => {
    state.loading = true;
  });
  builder.addCase("DeleteOrderSuccess", (state, action) => {
    state.loading = false;
    state.isDeleted = action.payload;
  });
  builder.addCase("DeleteOrderFail", (state, action) => {
    state.loading = false;
    state.error = action.payload;
  });
  builder.addCase("DeleteOrderReset", (state) => {
    state.isDeleted = false;
  });
  builder.addCase("ClearErrors", (state) => {
    state.error = null;
  });
});

export const orderDetailsReducer = createReducer({ order: {} }, (builder) => {
  builder.addCase("OrderDetailsRequest", (state) => {
    state.loading = true;
  });
  builder.addCase("OrderDetailsSuccess", (state, action) => {
    state.loading = false;
    state.order = action.payload;
  });
  builder.addCase("OrderDetailsFail", (state, action) => {
    state.loading = false;
    state.error = action.payload;
  });
  builder.addCase("ClearErrors", (state) => {
    state.error = null;
  });
});
