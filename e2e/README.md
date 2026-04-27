# E2E Tests — Playwright

End-to-end tests covering the full user journey of the mern-ecommerce app.

## Setup

```bash
# Install Playwright (run once)
npm install --save-dev @playwright/test
npx playwright install chromium
```

## Running Tests

```bash
# Start the app first (two terminals)
npm run dev                        # backend :4000
npm start --prefix frontend        # frontend :3000

# Then run E2E tests
npm run e2e                        # headless Chromium
npm run e2e:ui                     # interactive Playwright UI
npm run e2e:ci                     # CI mode (retries + no UI)
```

## Auth-Required Tests

Some specs require real credentials. Set these env vars before running:

```bash
export TEST_EMAIL=your@email.com
export TEST_PASSWORD=YourPassword@1
export TEST_ADMIN_EMAIL=admin@email.com
export TEST_ADMIN_PASSWORD=AdminPass@1
```

Tests that need these vars are automatically **skipped** if the vars are not set,
so the suite still passes cleanly in CI without them.

## Test Suites

| File | Covers |
|------|--------|
| `auth.spec.js` | Sign-in, Register, Forgot Password |
| `product.spec.js` | Home, Products listing, Search, PDP, review date regression |
| `cart.spec.js` | Empty cart, Add to Cart |
| `checkout.spec.js` | Shipping form validation (requires auth) |
| `account.spec.js` | Profile, Update Password (requires auth) |
| `admin.spec.js` | Dashboard, Products, Orders, Create Product form (requires admin auth) |

## Regression Guards

- `product.spec.js` → `REGRESSION: review date is not empty` — guards the `createdAt` date bug fix
- `checkout.spec.js` → phone 10-digit, address 10-char validation guards
- `admin.spec.js` → create product form validation guards
