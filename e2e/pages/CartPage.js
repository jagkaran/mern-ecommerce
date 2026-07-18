"use strict";
/**
 * CartPage — page object for /cart.
 *
 * Encapsulates empty-state detection + the "Continue to checkout" CTA used
 * by happyPath, checkout, cart specs.
 */
const BasePage = require("./BasePage");

class CartPage extends BasePage {
  // ---- Locators ----------------------------------------------------------

  /** Empty-state heading (matches "Your bag is empty" / "Cart is empty") */
  get emptyState() {
    return this.page.getByText(/your bag is empty|cart is empty/i).first();
  }

  /** "Continue to checkout" CTA — exact wording used in the checkout flow */
  get continueToCheckoutLink() {
    return this.page.getByRole("link", { name: /continue to checkout/i }).first();
  }

  /** Page heading — used for the "form rendered" assertion */
  get heading() {
    return this.page.getByRole("heading", { name: /your bag|cart/i }).first();
  }

  // ---- Actions -----------------------------------------------------------

  async goto() {
    await super.goto("/cart");
  }

  /**
   * Click "Continue to checkout" and wait for the navigation to /shipping.
   * Returns when URL includes /shipping.
   */
  async continueToCheckout() {
    await this.continueToCheckoutLink.waitFor({ state: "visible", timeout: 10_000 });
    await this.continueToCheckoutLink.click();
    await this.page.waitForURL(/\/shipping/, { timeout: 15_000 });
  }

  // ---- Assertions --------------------------------------------------------

  async expectEmpty() {
    await this.emptyState.waitFor({ state: "visible", timeout: 10_000 });
  }

  async expectHeading() {
    await this.heading.waitFor({ state: "visible", timeout: 10_000 });
  }
}

module.exports = CartPage;
