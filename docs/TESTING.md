# Testing Guide

This document covers the strategic balance between unit tests (speed), code coverage (signal), and Playwright E2E tests (user confidence) for the mern-ecommerce repo. It is the source of truth for the AAA pattern, the edge-case checklist, the POM convention, and the new-feature workflow.

## Quick reference

| Layer               | Tool                         | When to add                                      | When NOT to add                                       |
| ------------------- | ---------------------------- | ------------------------------------------------ | ----------------------------------------------------- |
| Backend unit        | Jest + mongodb-memory-server | New pure function, new branch, new money path    | Re-implementing something covered by integration test |
| Backend integration | Jest + supertest             | New endpoint, new auth role, new validation rule | Logic already covered by unit tests                   |
| Frontend unit       | React Testing Library        | New reducer, new hook, new utility               | Component that's exercised by E2E                     |
| E2E                 | Playwright                   | New page, new user flow, new visible error state | Pure-presentation tweak (Tailwind class swap)         |

---

## 1. Unit tests — the AAA pattern

Every backend unit test **must** follow Arrange / Act / Assert explicitly. AAA gives reviewers a scanline: setup → invocation → verification.

```js
// ✅ GOOD
it("rejects a malformed coupon code with 400", async () => {
  // Arrange
  const items = [{ product: productId.toString(), quantity: 1 }];
  const coupon = { code: "BAD CODE!", discountType: "percentage", discountValue: 10 };

  // Act + Assert
  await expect(computeOrderPricing(items, coupon)).rejects.toMatchObject({
    statusCode: 400,
    message: /coupon code format/i,
  });
});
```

### Anti-patterns

| Anti-pattern            | Symptom                                                                                  | Fix                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Silent-skip guard       | `if (!userCookie) return;` passes a test with **zero assertions**                        | Throw in `beforeAll` if setup login fails                                            |
| Fused Act+Assert        | `(await foo()).bar === baz` on one line hides intermediate state                         | Split into named `result` and explicit assertion                                     |
| Setup bleeding into Act | `beforeAll` does too much; per-test setup is invisible                                   | Use `beforeEach` for per-test fixtures, `beforeAll` only for shared immutable state  |
| Mock-by-copy            | Copying a real response shape into a mock rather than letting the SDK return its default | Use the global mock's default; override per-test only when you need a specific shape |

### Side-effect isolation

Global mocks live in `backend/__tests__/setup.js`. They run before any module is required (`setupFiles`, not `setupFilesAfterEach`), so they're available to every test in the suite.

| Service               | Mock file        | Default behaviour                                                                                                                      |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Stripe SDK            | `setup.js`       | Singleton instance; `paymentIntents.create` / `.retrieve` resolve to a fake intent; `webhooks.constructEvent` JSON.parses the raw body |
| Cloudinary            | `setup.js`       | `uploader.upload` / `destroy` resolve to `{public_id, secure_url}`                                                                     |
| storageService        | `setup.js`       | Wraps Cloudinary; resolves to `{public_id, url}`                                                                                       |
| passwordBreachService | `setup.js`       | Fail-open (`isPasswordBreached → false`)                                                                                               |
| emailQualityService   | `setup.js`       | Fail-open (`isDisposableEmail → false`)                                                                                                |
| nodemailer            | `setup.js`       | `sendMail → {messageId: "test_message_id"}`; no real SMTP                                                                              |
| MongoDB               | `globalSetup.js` | `mongodb-memory-server` (single-node — no replica set)                                                                                 |

Override per-test with `jest.spyOn(module, "method").mockResolvedValueOnce(...)` — the Stripe singleton works because the mock factory hoists a single instance, so every `require("stripe")()` returns the same object.

---

## 2. Edge-case checklist

Before opening a PR, walk this list for any new code you touched:

### Money path (pricing, payment, order, coupon)

- [ ] **Negative numbers** — `discountValue = -10`, `quantity = -1`
- [ ] **Zero** — `quantity = 0`, `discountValue = 0`, `amount = 0`
- [ ] **Boundary equals** — `price * quantity === FREE_SHIPPING_THRESHOLD` (off-by-one on `>` vs `>=`)
- [ ] **Decimals** — `19.99 * 3` exercises `.toFixed(2)` rounding; check `taxPrice` is exactly `9.00`, not `8.99` or `9.01`
- [ ] **Percentage out-of-range** — `discountValue = 0`, `101`, `150`, `NaN`, `Infinity`
- [ ] **Flat out-of-range** — `discountValue = 0`, `-25`, `NaN`, `Infinity`
- [ ] **Discount > subtotal** — flat coupon capped at `itemPrice`; verify the cap, not just the result
- [ ] **Unknown discount type** — `discountType: "lol"` → 400
- [ ] **Currency rounding** — non-USD totals: EUR @ 0.92, GBP @ 0.79 — verify the rate is applied, not the amount

### Inventory

- [ ] **stock < requested** — backend rejects with 400
- [ ] **stock === 0** — listing shows "Out of stock", Add-to-Cart disabled
- [ ] **stock === requested** — boundary, not over-orderable

### Auth / session

- [ ] **expired token** — 401 + clear error
- [ ] **wrong role** — admin route accessed by user → 403, not 401
- [ ] **rate limit** — 21st login attempt in 15 min → 429
- [ ] **CSRF missing** — POST without token in production → 403

### Payment

- [ ] **PaymentIntent already used** → 409 (double-spend guard, see `orderService.js:46-49`)
- [ ] **Intent not in `succeeded` status** → 402
- [ ] **Intent amount ≠ server-computed total** → 400 (tamper guard, see `orderService.js:61-64`)
- [ ] **Stripe API down** — error propagates from `retrievePaymentIntent`

---

## 3. Code coverage thresholds

| Path                                 | Statements | Branches | Functions | Lines |
| ------------------------------------ | ---------- | -------- | --------- | ----- |
| **Global** (everything)              | 70%        | 45%      | 55%       | 70%   |
| `backend/utils/pricing.js`           | 85%        | 80%      | 85%       | 85%   |
| `backend/services/couponService.js`  | 85%        | 80%      | 85%       | 85%   |
| `backend/services/paymentService.js` | 80%        | 70%      | 80%       | 80%   |
| `backend/services/orderService.js`   | 80%        | 70%      | 80%       | 80%   |

CI runs `npm test -- --coverage` (`.github/workflows/ci.yml:53`); Jest's built-in threshold gate fails the build if any glob drops below its number. Branch coverage is tracked because pricing/payment has heavy branching on user input — line coverage alone misses the `if`-vs-`else` paths.

**When you can lower a threshold:** never. If a glob is failing because of an unreachable defensive branch, remove the branch. If it's failing because real-world code paths aren't tested, add the test.

**When you must raise a threshold:** only after adding tests that already exercise the missing branches. Never raise to "make the gate pass."

---

## 4. Playwright — Page Object Model

POM groups selectors and high-level actions into `e2e/pages/<Name>Page.js` so structural UI changes touch one file, not dozens of specs.

### Convention

```js
// e2e/pages/SignInPage.js
const BasePage = require("./BasePage");
class SignInPage extends BasePage {
  get emailInput() {
    return this.page.getByLabel(/^email$/i);
  } // ✅ user-facing
  get submit() {
    return this.page.getByRole("button", { name: /^sign in$/i });
  }
  async signIn(email, password) {
    /* chains actions, asserts navigation */
  }
}
module.exports = SignInPage;
```

```js
// e2e/auth.spec.js
const SignInPage = require("./pages/SignInPage");
test("...", async ({ page }) => {
  const signIn = new SignInPage(page);
  await signIn.goto();
  await signIn.signIn("user@test.com", "User@1234");
});
```

### Selector rules

1. **`getByRole` first** — matches how screen readers and shoppers find elements.
2. **`getByLabel` for form inputs** — assumes the input has a `<label>` (it should).
3. **`getByText` for non-interactive content** — toasts, headings, error messages.
4. **`getByPlaceholder` only when there's no label** — search inputs often fall in this bucket.
5. **CSS/XPath last** — and only with a comment explaining why ARIA didn't work. The lone current example is `a[href*="/product/"]` on `ProductsPage.productCards`, where the link has no accessible name because the image lacks alt text.

### Adding a new page

1. Create `e2e/pages/<Name>Page.js`, extend `BasePage`.
2. Expose getters for every interactive element.
3. Add high-level methods that chain actions (`signIn`, `pickInStockCard`).
4. Update one spec to use the new page as proof — the rest can migrate one-per-PR.

---

## 5. Network mocking (`page.route()`)

Don't write to a live database for every test. Use Playwright's `page.route()` to intercept and mock heavy / stateful endpoints.

### Helpers

`e2e/helpers/mocks.js` exposes:

```js
const { mockProductsRoute, mockPaymentRoute } = require("./helpers/mocks");

test("...", async ({ page }) => {
  // Mocks persist for the page's lifetime
  await mockProductsRoute(page, [
    { _id: "p1", name: "Mug", price: 20, stock: 10, category: "Test" },
  ]);
  await mockPaymentRoute(page); // default fake client_secret
  // ... rest of test
});
```

### Env-gated live seed

`e2e/helpers/adminSeed.js` honors `E2E_MOCK_PRODUCTS=1`. When set, `ensureInStock(n)` returns `[]` without touching the DB. Use this when:

- The spec doesn't depend on stock values (e.g., admin tests, page smoke)
- You want hermetic test runs without backend state leakage

```bash
E2E_MOCK_PRODUCTS=1 npm run e2e -- e2e/admin.spec.js
```

### When NOT to mock

- Real backend roundtrips you want to exercise (e.g., checkout → order placement → `paidAt` set)
- Auth flows — real login is needed for cookie/CSRF state
- The verified-purchase gate for reviews (use `e2e/helpers/reviewSeed.js` for that)

---

## 6. New-feature workflow

When you add a feature, optimization, or approach, this checklist is **required** before opening a PR. The PR template mirrors it.

1. **Walk the edge-case checklist** (section 2) for any new code.
2. **Write unit tests with explicit AAA** — every branch in your new code, not just the happy path.
3. **Add a Playwright spec** if the change is user-facing — new page, new visible state, new error.
4. **Run coverage locally** before pushing:
   ```bash
   npm test -- --coverage --forceExit
   ```
   Confirm your touched file(s) still meet the per-glob thresholds in section 3.
5. **If you changed a Page Object**, migrate one spec as proof that the new accessor works end-to-end.
6. **If you added a new mockable endpoint**, add a helper in `e2e/helpers/mocks.js`.

### Automation hooks

The realistic "trigger on new feature" hook is process, not code:

- The PR template (`.github/PULL_REQUEST_TEMPLATE.md`) repeats this checklist as checkboxes.
- CI runs `npm test -- --coverage` and fails on threshold drop.
- Husky hooks are scaffolded but inactive — when lint-staged or a test-on-pre-commit hook is needed, install and configure there.

There is no AST-based auto-test generator — the maintainer is responsible for writing the tests.
