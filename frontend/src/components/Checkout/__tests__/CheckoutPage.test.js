import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";
import checkoutReducer from "../../../slices/checkoutSlice";
import CheckoutPage from "../CheckoutPage";

// Stub the cart reducer — CheckoutPage reads cartItems/shippingInfo, but the
// guest CTA assertion only needs the user slice to drive ContactBlock.
const cartReducerStub = (s = { cartItems: [], shippingInfo: {} }) => s;
const newOrderStub = (s = {}) => s;

const renderCheckout = (userState) => {
  const store = configureStore({
    reducer: {
      checkout: checkoutReducer,
      cart: cartReducerStub,
      user: (s = userState) => s,
      newOrder: newOrderStub,
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    </Provider>
  );
};

it("renders Contact block with Continue-as-Guest CTA when logged out", () => {
  renderCheckout({ user: null, isAuthenticated: false });
  expect(
    screen.getByRole("button", { name: /continue as guest/i })
  ).toBeInTheDocument();
});

it("hides Continue-as-Guest CTA when user is present", () => {
  renderCheckout({ user: { email: "j@x.io" }, isAuthenticated: true });
  expect(
    screen.queryByRole("button", { name: /continue as guest/i })
  ).toBeNull();
});
