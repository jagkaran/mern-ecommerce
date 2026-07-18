const { test, expect } = require("@playwright/test");
const SignInPage = require("./pages/SignInPage");

// POM proof: every selector in this spec flows through SignInPage. Future
// specs can copy the same pattern. See docs/TESTING.md.

test.describe("Sign In page", () => {
  test.beforeEach(async ({ page }) => {
    await new SignInPage(page).goto();
  });

  test("renders sign-in form", async ({ page }) => {
    // Arrange
    const signIn = new SignInPage(page);

    // Act + Assert
    await signIn.expectHeading();
    await expect(signIn.emailInput).toBeVisible();
    await expect(signIn.passwordInput).toBeVisible();
    await expect(signIn.submitButton).toBeVisible();
  });

  test("has link to sign up page", async ({ page }) => {
    // Arrange
    const signIn = new SignInPage(page);

    // Act + Assert
    await expect(signIn.signUpLink).toBeVisible();
  });
});

test.describe("Register page", () => {
  test.beforeEach(async ({ page }) => {
    await new SignInPage(page).gotoSignUp();
  });

  test("renders register form", async ({ page }) => {
    // Arrange
    const signIn = new SignInPage(page);

    // Act + Assert
    await expect(signIn.nameInput).toBeVisible();
    await expect(signIn.emailInput).toBeVisible();
    await expect(signIn.passwordInput).toBeVisible();
  });

  test("sign up button disabled until form valid and avatar uploaded", async ({ page }) => {
    // Arrange
    const signIn = new SignInPage(page);

    // Act + Assert
    await expect(signIn.signUpButton).toBeDisabled();
  });

  test("has link back to sign in", async ({ page }) => {
    // Arrange
    const signIn = new SignInPage(page);

    // Act + Assert
    await expect(signIn.signInLink).toBeVisible();
  });
});

test.describe("Forgot Password page", () => {
  test.beforeEach(async ({ page }) => {
    await new SignInPage(page).gotoForgotPassword();
  });

  test("renders forgot password form", async ({ page }) => {
    // Arrange
    const signIn = new SignInPage(page);

    // Act + Assert
    await expect(signIn.emailInput).toBeVisible();
  });
});
