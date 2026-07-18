"use strict";
/**
 * ProductsPage — page object for /products, /search, / search results.
 *
 * Encapsulates the listing grid + search/filter affordances used across
 * happyPath, search, product, wishlist specs. The single CSS selector
 * `a[href*="/product/"]` is kept here with a comment explaining why — no
 * other ARIA query can target the link, since the only labelled child is
 * the product image (which lacks alt text in some listings).
 */
const BasePage = require("./BasePage");

class ProductsPage extends BasePage {
  // ---- Locators ----------------------------------------------------------

  /**
   * Product card grid. Each card is an anchor wrapping the image + name +
   * price. We use a CSS attribute selector because:
   *   - The card image lacks alt text in some listings
   *   - The product name is a heading, but no two products share a heading
   *     role we can disambiguate without filtering on innerText
   *   - `getByRole("link", { name: /./ })` matches header links too
   * Filter by visible text in specs that need to disambiguate by name.
   */
  get productCards() {
    return this.page.locator('a[href*="/product/"]');
  }

  /** Search input — uses placeholder text (user-facing) */
  get searchInput() {
    return this.page.getByPlaceholder(/search a product/i);
  }

  /** Page heading — drives the "form rendered" assertion */
  get heading() {
    return this.page
      .getByRole("heading", { name: /pieces made to live|look through the shelves/i })
      .first();
  }

  // ---- Actions -----------------------------------------------------------

  async gotoList() {
    await super.goto("/products");
  }

  async gotoSearch(keyword) {
    await super.goto(`/search/${encodeURIComponent(keyword)}`);
  }

  async search(keyword) {
    await this.searchInput.fill(keyword);
    await this.searchInput.press("Enter");
  }

  /**
   * Find the first product card that does NOT display an "Out of stock" badge.
   * Returns a Locator or null if no in-stock card is visible.
   */
  async pickInStockCard() {
    const cards = this.productCards;
    await cards.first().waitFor({ timeout: 20_000 });
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const text = (await card.innerText()).toLowerCase();
      if (!text.includes("out of stock")) return card;
    }
    return null;
  }
}

module.exports = ProductsPage;
