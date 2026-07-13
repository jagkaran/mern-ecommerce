import { render } from "@testing-library/react";
import StickyCta from "../StickyCta";

it("shows Place Order CTA with total at mobile viewport", () => {
  global.innerWidth = 375;
  global.innerHeight = 667;
  const { getByRole } = render(
    <StickyCta totalLabel="$99.83" onClick={() => {}} submitting={false} />
  );
  const btn = getByRole("button", { name: /place order/i });
  expect(btn).toBeInTheDocument();
  expect(btn.textContent).toMatch(/99\.83/);
});