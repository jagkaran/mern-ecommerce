// @ts-check
const { test, expect } = require("@playwright/test");

// ---------------------------------------------------------------------------
// Auth E2E Tests
// Covers: sign-in page, register page, forgot password page
// NOTE: These tests use the live app. For sign-in/register tests that mutate
//       state, tests are written to be idempotent where possible.
// ---------------------------------------------------------------------------

test.describe("Sign In page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signin");
  });

  test("renders sign-in form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows validation error for invalid email", async ({ page }) => {
    await page.getByLabel(/email/i).fill("not-an-email");
    await page.getByLabel(/email/i).blur();
    // MUI helperText should appear
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test("shows validation error for short password", async ({ page }) => {
    await page.getByLabel(/password/i).fill("123");
    await page.getByLabel(/password/i).blur();
    await expect(page.getByText(/password must be/i)).toBeVisible();
  });

  test("shows error on wrong credentials", async ({ page }) => {
    await page.getByLabel(/email/i).fill("wrong@example.com");
    await page.getByLabel(/password/i).fill("Wrong@123");
    await page.getByRole("button", { name: /sign in/i }).click();
    // react-alert or MUI snackbar with error message
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 10000 });
  });

  test("has link to sign up page", async ({ page }) => {
    const link = page.getByRole("link", { name: /don.t have an account/i });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/signup/);
  });
});

test.describe("Register page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
  });

  test("renders register form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /sign up/i })).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("shows name validation error", async ({ page }) => {
    await page.getByLabel(/^name/i).fill("A");
    await page.getByLabel(/^name/i).blur();
    // Name must be 2+ chars
    await expect(page.getByText(/name is required|name must/i)).toBeVisible();
  });

  test("shows email validation error", async ({ page }) => {
    await page.getByLabel(/email/i).fill("bademail");
    await page.getByLabel(/email/i).blur();
    await expect(page.getByText(/email is not valid|valid email/i)).toBeVisible();
  });

  test("shows password validation error", async ({ page }) => {
    await page.getByLabel(/password/i).fill("weak");
    await page.getByLabel(/password/i).blur();
    await expect(page.getByText(/password must be/i)).toBeVisible();
  });

  test("sign up button disabled until form valid and avatar uploaded", async ({ page }) => {
    const btn = page.getByRole("button", { name: /sign up/i });
    await expect(btn).toBeDisabled();
  });

  test("has link back to sign in", async ({ page }) => {
    await page.getByRole("link", { name: /already have an account/i }).click();
    await expect(page).toHaveURL(/\/signin/);
  });
});

test.describe("Forgot Password page", () => {
  test("renders forgot password form", async ({ page }) => {
    await page.goto("/password/forgot");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /send email|reset/i })).toBeVisible();
  });

  test("shows error for invalid email", async ({ page }) => {
    await page.goto("/password/forgot");
    await page.getByLabel(/email/i).fill("notvalid");
    await page.getByLabel(/email/i).blur();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });
});
