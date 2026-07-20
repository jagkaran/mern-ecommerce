import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import checkoutReducer from "../../../slices/checkoutSlice";
import ContactBlock from "../ContactBlock";

const renderWith = (signedIn = false) =>
  render(
    <Provider store={configureStore({ reducer: { checkout: checkoutReducer } })}>
      <ContactBlock signedIn={signedIn} />
    </Provider>
  );

it("shows Continue as Guest primary CTA when signed out", () => {
  renderWith(false);
  expect(screen.getByRole("button", { name: /continue as guest/i })).toBeInTheDocument();
  expect(screen.getByText(/sign in for faster/i)).toBeInTheDocument();
});

it("hides guest CTA when signed in", () => {
  renderWith(true);
  expect(screen.queryByRole("button", { name: /continue as guest/i })).toBeNull();
});

it("shows email validation error after blur", () => {
  renderWith(false);
  const input = screen.getByLabelText(/email/i);
  fireEvent.change(input, { target: { value: "nope" } });
  fireEvent.blur(input);
  expect(screen.getByText(/email slipped/i)).toBeInTheDocument();
});
