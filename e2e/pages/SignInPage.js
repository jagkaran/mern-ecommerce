"use strict";
/**
 * SignInPage — page object for /signin, /signup, /password/forgot routes.
 *
 * Encapsulates every locator used by auth flows so future specs only import
 * the methods and never touch raw selectors. The auth helper module
 * (e2e/helpers/auth.js) still provides `loginAsUser/loginAsAdmin` for one-shot
 * flows; this page object is for tests that want to exercise the form itself
 * (validation, error states, redirect after submit).
 *
 * All selectors use user-facing ARIA — getByLabel/getByRole — matching the
 * TESTING.md convention.
 */
const BasePage = require("./BasePage");

class SignInPage extends BasePage {
  // ---- Form fields -------------------------------------------------------

  /** Email input (label: "Email") */
  get emailInput() {
    return this.page.getByLabel(/^email$/i);
  }

  /** Password input (label: "Password") */
  get passwordInput() {
    return this.page.getByLabel(/^password$/i);
  }

  /** Name input on /signup (label: "Name") */
  get nameInput() {
    return this.page.getByLabel(/^name$/i);
  }

  /** Confirm-password input on /signup */
  get confirmPasswordInput() {
    return this.page.getByLabel(/confirm password/i);
  }

  // ---- Buttons -----------------------------------------------------------

  /** Submit button on /signin (label: "Sign in") */
  get submitButton() {
    return this.page.getByRole("button", { name: /^sign in$/i });
  }

  /** Submit button on /signup */
  get signUpButton() {
    return this.page.getByRole("button", { name: /sign up|register|create account/i });
  }

  // ---- Cross-links -------------------------------------------------------

  /** "Sign up" link from the /signin page */
  get signUpLink() {
    return this.page.getByRole("link", { name: /sign up|register|create an account/i }).first();
  }

  /** "Sign in" link from the /signup page */
  get signInLink() {
    return this.page.getByRole("link", { name: /sign in|log in/i }).first();
  }

  /** "Forgot password?" link */
  get forgotPasswordLink() {
    return this.page.getByRole("link", { name: /forgot/i }).first();
  }

  // ---- Headings ----------------------------------------------------------

  /** Page heading — drives the "form rendered" assertion */
  get heading() {
    return this.page.getByRole("heading", { name: /come in|sign in/i }).first();
  }

  // ---- Actions -----------------------------------------------------------

  async goto() {
    await super.goto("/signin");
  }

  async gotoSignUp() {
    await super.goto("/signup");
  }

  async gotoForgotPassword() {
    await super.goto("/password/forgot");
  }

  async fillCredentials(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    return this;
  }

  async submit() {
    await this.submitButton.click();
    return this;
  }

  /**
   * Convenience: full login flow with assertion that we left /signin.
   * @param {string} email
   * @param {string} password
   */
  async signIn(email, password) {
    await this.goto();
    await this.fillCredentials(email, password);
    await this.submit();
    await this.page.waitForURL((url) => !url.pathname.includes("/signin"), { timeout: 20_000 });
  }

  // ---- Assertions --------------------------------------------------------

  async expectHeading() {
    await this.heading.waitFor({ state: "visible", timeout: 10_000 });
  }
}

module.exports = SignInPage;
