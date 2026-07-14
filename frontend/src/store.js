import { configureStore } from "@reduxjs/toolkit";
import { cartReducer } from "./reducers/Cart";
import {
  allOrdersReducer,
  modifiedOrderReducer,
  myOrdersReducer,
  newOrderReducer,
  orderDetailsReducer,
} from "./reducers/Order";
import {
  allProductReviewsReducer,
  categoriesReducer,
  createReviewReducer,
  newProductReducer,
  productDetailsReducer,
  productModifyReducer,
  productReducer,
  reviewReducer,
} from "./reducers/Product";
import {
  allUsersReducer,
  forgotPasswordReducer,
  profileReducer,
  userDetailsReducer,
  userReducer,
} from "./reducers/User";
import { wishlistReducer } from "./reducers/wishlistReducer";
import { toastReducer } from "./reducers/toastReducer";
import { apiReducer, apiMiddleware } from "./slices/apiSlice";
import checkoutReducer, { persistMiddleware } from "./slices/checkoutSlice";

const store = configureStore({
  reducer: {
    api: apiReducer,
    product: productReducer,
    productDetails: productDetailsReducer,
    categories: categoriesReducer,
    user: userReducer,
    profile: profileReducer,
    forgotPassword: forgotPasswordReducer,
    cart: cartReducer,
    newOrder: newOrderReducer,
    myOrders: myOrdersReducer,
    orderDetails: orderDetailsReducer,
    newReview: createReviewReducer,
    newProduct: newProductReducer,
    allOrders: allOrdersReducer,
    allUsers: allUsersReducer,
    modifiedProduct: productModifyReducer,
    modifiedOrder: modifiedOrderReducer,
    userDetails: userDetailsReducer,
    allReviews: allProductReviewsReducer,
    review: reviewReducer,
    wishlist: wishlistReducer,
    toast: toastReducer,
    checkout: checkoutReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiMiddleware, persistMiddleware),
});

export default store;
