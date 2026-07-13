import { render, screen } from "@testing-library/react";
import TrustStrip from "../TrustStrip";

it("renders three trust badges in a row", () => {
  render(<TrustStrip />);
  expect(screen.getByText(/ssl/i)).toBeInTheDocument();
  expect(screen.getByText(/powered by stripe/i)).toBeInTheDocument();
  expect(screen.getByText(/free returns/i)).toBeInTheDocument();
});