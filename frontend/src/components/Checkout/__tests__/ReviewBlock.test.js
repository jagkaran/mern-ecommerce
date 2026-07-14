import { render } from "@testing-library/react";
import ReviewBlock from "../ReviewBlock";

it("computes totals = subtotal + shipping + tax", () => {
  const { getByTestId } = render(
    <ReviewBlock subtotal={87} shipping={5} tax={7.83} />
  );
  expect(getByTestId("total")).toHaveTextContent("$99.83");
});