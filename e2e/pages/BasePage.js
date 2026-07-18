"use strict";
/**
 * BasePage — shared parent for all Page Object Model classes.
 *
 * Convention (see docs/TESTING.md):
 *   - One file per route in `e2e/pages/<Name>Page.js`, extending BasePage
 *   - Selectors use `page.getByRole` / `getByLabel` / `getByText` first;
 *     CSS/XPath only when ARIA is genuinely impossible (note the reason)
 *   - Methods that perform an action return `this` for chaining
 *   - Methods that read state return Locator or value; assertions live in
 *     the spec, not the page object
 *
 * @example
 *   const signIn = new SignInPage(page);
 *   await signIn.goto();
 *   await signIn.fillCredentials("user@test.com", "User@1234");
 *   await signIn.submit();
 */
class BasePage {
  /**
   * @param {import("@playwright/test").Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to a relative URL.
   * @param {string} path
   */
  async goto(path = "/") {
    await this.page.goto(path);
  }

  /**
   * The <main> landmark — use to confirm the page rendered something.
   */
  get main() {
    return this.page.getByRole("main");
  }

  /**
   * The <header> landmark.
   */
  get header() {
    return this.page.getByRole("banner");
  }

  /**
   * Block until the main landmark is visible — cheap sanity check before
   * downstream assertions.
   */
  async expectLoaded() {
    await this.main.waitFor({ state: "visible", timeout: 10_000 });
  }
}

module.exports = BasePage;
