import { createReducer } from "@reduxjs/toolkit";

export const newOrderReducer = createReducer(
  {},
  {
    CreateOrderRequest: (state) => {
      state.loading = true;
    },
    CreateOrderSuccess: (state, action) => {
      state.loading = false;
      state.order = action.payload;
    },
    CreateOrderFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    ClearErrors: (state) => {
      state.error = null;
    },
  }
);

export const myOrdersReducer = createReducer(
  { orders: [] },
  {
    MyOrdersRequest: (state) => {
      state.loading = true;
    },
    MyOrdersSuccess: (state, action) => {
      state.loading = false;
      state.orders = action.payload.orders;
      state.ordersCount = action.payload.orderCount;
    },
    MyOrdersFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    ClearErrors: (state) => {
      state.error = null;
    },
  }
);

export const allOrdersReducer = createReducer(
  { orders: [] },
  {
    AllOrdersRequest: (state) => {
      state.loading = true;
    },
    AllOrdersSuccess: (state, action) => {
      state.loading = false;
      state.orders = action.payload;
    },
    AllOrdersFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    ClearErrors: (state) => {
      state.error = null;
    },
  }
);

export const modifiedOrderReducer = createReducer(
  {},
  {
    UpdateOrderRequest: (state) => {
      state.loading = true;
    },
    UpdateOrderSuccess: (state, action) => {
      state.loading = false;
      state.isUpdated = action.payload;
    },
    UpdateOrderFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    UpdateOrderReset: (state) => {
      state.isUpdated = false;
    },
    DeleteOrderRequest: (state) => {
      state.loading = true;
    },
    DeleteOrderSuccess: (state, action) => {
      state.loading = false;
      state.isDeleted = action.payload;
    },
    DeleteOrderFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    DeleteOrderReset: (state) => {
      state.isDeleted = false;
    },
    ClearErrors: (state) => {
      state.error = null;
    },
  }
);

export const orderDetailsReducer = createReducer(
  { order: {} },
  {
    OrderDetailsRequest: (state) => {
      state.loading = true;
    },
    OrderDetailsSuccess: (state, action) => {
      state.loading = false;
      state.order = action.payload;
    },
    OrderDetailsFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    ClearErrors: (state) => {
      state.error = null;
    },
  }
);
