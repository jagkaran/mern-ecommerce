import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import checkoutReducer from "../../../slices/checkoutSlice";
import ShippingBlock from "../ShippingBlock";

it("renders trimmed form — no company/birthdate/phone2 fields", () => {
  const { container } = render(
    <Provider store={configureStore({ reducer: { checkout: checkoutReducer } })}>
      <ShippingBlock />
    </Provider>
  );
  const html = container.innerHTML.toLowerCase();
  expect(html).not.toMatch(/name=["']?company|companyname/);
  expect(html).not.toMatch(/birth|date.of.birth|dob/);
  expect(html).not.toMatch(/phone.?2|secondary.?phone|fax/);
  expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/postal|zip/i)).toBeInTheDocument();
});