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

const store = configureStore({
  reducer: {
    product: productReducer,
    productDetails: productDetailsReducer,
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
  },
});

export default store;
