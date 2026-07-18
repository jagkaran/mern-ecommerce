# Guest Checkout Design Spec

- **Date:** 2026-07-13
- **Status:** Approved (brainstorming complete, awaiting implementation plan)
- **Scope:** Backend auth bypass + guest order model + new claim endpoint; frontend one-page Checkout flow + post-purchase account creation.
- **Approach:** Email-on-order w/ optional auth middleware + signed claim token. Single-page stacked sections. One-click claim on success page.
- **Prior context:** Hverdag redesign shipped Phases 0–9 (commit bbb6051) with primitives, Toast, Coupon, Header split, E2E suite. Checkout is the only remaining friction-heavy flow.

---

## 1. Problem

Cart abandonment peaks at the "create an account or sign in" gate. Industry data (Baymard 2024): 24% of US shoppers abandon because the site wanted them to create an account. The current flow forces `/login` redirect when `/shipping` is hit without auth, which is the worst position for a guest to convert.

## 2. Goals

1. **Primary CTA = "Checkout as Guest".** Visible first, no marketing rebrand.
2. **Email captured upfront** for receipt, tracking, post-purchase claim.
3. **Trimmed form fields.** No company, no birthdate, no secondary phone.
4. **One-page layout.** Stack Contact / Shipping / Payment / Review vertically. No wizard step transitions on mobile.
5. **Sticky mobile CTA** with running total. Thumb-reach tap target ≥ 48px.
6. **One-click claim.** Success page form turns guest order into a full account with a single password.

## 3. Non-Goals (explicit cuts)

- Saved cards / address book. Stripe Elements handles saved cards; address book deferred.
- Magic-link signup email. Receipt path is unchanged SMTP; the claim form is local + in-app.
- Guest-cart merge on later signup via cron. The `claim` endpoint does the re-link synchronously.
- Multi-page wizard fallback. One-page only.

---

## 4. Backend Design

### 4.1 Data Model — `Order`

```js
// additions to existing schema
guestEmail: { type: String, lowercase: true, trim: true, index: true, sparse: true },
claimTokenHash: { type: String, index: true, sparse: true, select: false },
claimedAt: { type: Date, default: null },
onModel: { type: String, enum: ['User', 'Guest'], default: 'User' }
```

- `user` field becomes optional (already required for refPath — change to sparse).
- `guestEmail` required iff `user` absent. Enforced in service layer, not schema.
- `claimTokenHash` is HMAC-SHA256(`orderId|guestEmail`, `JWT_SECRET`), hex, **never returned** in API responses — only the raw token (sent in URL on success page).

### 4.2 Middleware — `optionalAuth`

```js
// backend/middleware/auth.js (add)
exports.optionalAuth = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("_id name email");
    next();
  } catch {
    req.user = null;
    next();
  }
};
```

### 4.3 Routes

| Method | Path                      | Auth         | Behavior                                                                                                                                                                                                                                                                                                    |
| ------ | ------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/v1/order/new`       | optionalAuth | Auth path unchanged. Guest path: require `guestEmail` in body, omit `user` ref, mint claim token, return `{order, claimToken}` (token only when no user).                                                                                                                                                   |
| `POST` | `/api/v1/order/claim`     | none         | Public. Body: `{claimToken, password, name?}`. Verifies HMAC; loads order; if email matches existing User → 409 with `loginRequired:true`. Else: creates User with `email + password`, re-links all orders matching `guestEmail` (claimTokenHash verified per order), issues JWT cookie, marks `claimedAt`. |
| `POST` | `/api/v1/payment/process` | optionalAuth | Auth path unchanged. Guest path: requires `orderId` in body; verifies the order's `user` is null or matches `req.user`; returns clientSecret.                                                                                                                                                               |
| `POST` | `/api/v1/payment/webhook` | stripe sig   | Unchanged. Updates `paidAt`; if guest order, no user link — claim flow handles that.                                                                                                                                                                                                                        |

### 4.4 Validation

```js
// additions to backend/middleware/validation.js
body("guestEmail").optional().isEmail().normalizeEmail();
body("claimToken").isHex().isLength({ min: 64, max: 64 });
body("password").isLength({ min: 8, max: 128 });
```

### 4.5 Service Layer — `claimService`

Single new file `backend/services/claimService.js`:

```js
async function claimGuestOrder({ claimToken, password, name }) {
  // 1. Decode: split token → orderId | guestEmail; recompute HMAC; lookup order
  // 2. Reject if order.claimedAt set → 400 "already claimed"
  // 3. Lookup User by guestEmail → 409 with code: "ACCOUNT_EXISTS"
  // 4. Create User with random password reset flow bypassed
  // 5. withTransaction: set user on all matching guest orders, claimedAt, clear claimTokenHash
  // 6. Issue JWT, return { user, token }
}
```

### 4.6 Errors

| Code                   | HTTP | When                                              |
| ---------------------- | ---- | ------------------------------------------------- |
| `GUEST_EMAIL_REQUIRED` | 400  | order/new w/o auth and no guestEmail              |
| `INVALID_CLAIM_TOKEN`  | 400  | bad HMAC or unknown orderId                       |
| `ALREADY_CLAIMED`      | 400  | order.claimedAt already set                       |
| `ACCOUNT_EXISTS`       | 409  | guest email matches existing User; suggest /login |
| `STOCK_INSUFFICIENT`   | 400  | unchanged                                         |

---

## 5. Frontend Design

### 5.1 Route Map

| Old                         | New                                     |
| --------------------------- | --------------------------------------- |
| `/login?redirect=/shipping` | `/checkout` (no redirect, guest-first)  |
| `/shipping`                 | subsumed into `/checkout`               |
| `/order/confirm`            | subsumed into `/checkout`               |
| `/success` (existing)       | kept; receives `?token=` for claim form |

### 5.2 `/checkout` — One-Page Layout

```
┌────────────────────────────────────────────┐
│  ✦ Hverdag            Secure checkout       │
├────────────────────────────────────────────┤
│  0 · CONTACT                               │
│    ┌──────────────────────────┐            │
│    │ Email for receipt        │            │
│    └──────────────────────────┘            │
│    ☐ Continue as Guest (primary)           │
│      or Sign in for faster checkout        │
│                                            │
│  1 · SHIPPING                              │
│    [Full name           ]                  │
│    [Address line 1      ]                  │
│    [Address line 2 (opt) ]                 │
│    [City       ][State ][Postal]           │
│    [Country ▾  ][Phone          ]          │
│                                            │
│  2 · PAYMENT      [Stripe Elements ]       │
│                                            │
│  3 · REVIEW                                │
│    Items: 3   $87.00                       │
│    Shipping:        $5.00                  │
│    Tax:             $7.83                  │
│    ─────────────────                       │
│    Total:           $99.83                 │
│                                            │
│  [ 🔒  Place Order — $99.83 ]  ← sticky    │
└────────────────────────────────────────────┘
```

- **Logged in**: section 0 hides Guest CTA, email pre-fills from `user.email`. Step labels collapse to `1 · SHIPPING`.
- **Logged out**: Guest CTA is `variant="contained"` terracotta. Sign-in is `variant="text"` below.
- **Trust strip** under CTA: SSL lock · Powered by Stripe · Free returns over $50.

### 5.3 Components

```
frontend/src/components/Checkout/
  index.js                 # barrel
  CheckoutPage.jsx         # orchestrator
  ContactBlock.jsx         # email + guest/signin toggle
  ShippingBlock.jsx        # trimmed form
  PaymentBlock.jsx         # Stripe Elements wrapper
  ReviewBlock.jsx          # order summary + totals
  StickyCta.jsx            # mobile bottom bar
  TrustStrip.jsx           # security badges row
  ClaimForm.jsx            # post-purchase password
  useCheckoutForm.js       # form state, validation, persist
  checkoutValidators.js    # email / postal / phone rules
```

### 5.4 Form Validation

| Field    | Rule                                                                                                                                | Error copy                             |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| email    | RFC-ish regex                                                                                                                       | "that email slipped away — try again?" |
| name     | 2–60 chars                                                                                                                          | "name looks short — add a bit more?"   |
| address1 | 3–120 chars                                                                                                                         | "address needs a few more characters"  |
| postal   | per-country regex (US 5 or 5+4, CA `[A-Z]\d[A-Z] \d[A-Z]\d`, UK `[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}`, IN `\d{6}`, fallback `\d{3,10}`) | "postcode looks off for that country"  |
| phone    | E.164 or 7–15 digits                                                                                                                | "phone needs country code, e.g. +1…"   |

Validation runs on blur + on submit. Errors clear on next keystroke.

### 5.5 State — `checkoutSlice`

```js
// frontend/src/store/checkoutSlice.js
{
  email, name, address1, address2, city, state, postal, country, phone,
  isGuest,            // bool, defaults true
  touched: { [field]: bool },
  errors: { [field]: string },
  step: 'idle' | 'submitting' | 'placed' | 'claiming',
  orderId, claimToken, totalCents
}
```

Persisted to `sessionStorage` keyed `hvrg_checkout_draft` so reload doesn't lose form state.

### 5.6 Success Page

Existing `/success` page extended:

- Order summary card (unchanged).
- Below: `<ClaimForm orderId claimToken />` — single password input + "Save my details" button.
- On submit → `POST /order/claim` → success toast → redirect `/login?claimed=1`.
- If user already had an account: show "Sign in to see your order" link instead of form.

---

## 6. Testing Strategy

### 6.1 Backend Jest (`backend/__tests__/order.test.js`)

| Test                                          | Setup                               | Expect                                                                                   |
| --------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| `POST /order/new as guest`                    | no cookie, valid body w/ guestEmail | 201, order.user null, claimToken 64-hex in response                                      |
| `POST /order/new as guest no email`           | no cookie, body missing guestEmail  | 400 GUEST_EMAIL_REQUIRED                                                                 |
| `POST /order/new as guest insufficient stock` | no cookie, qty > stock              | 400 STOCK_INSUFFICIENT, no order created                                                 |
| `POST /order/new as auth user`                | valid JWT                           | 201, user set, no claimToken in response                                                 |
| `POST /order/claim happy`                     | guest order created, valid token    | 201, User created, order.user set, JWT cookie set, claimedAt set, claimTokenHash cleared |
| `POST /order/claim reuses token`              | claim then re-claim same token      | 400 ALREADY_CLAIMED                                                                      |
| `POST /order/claim bad token`                 | random 64-hex                       | 400 INVALID_CLAIM_TOKEN                                                                  |
| `POST /order/claim account exists`            | guest email matches existing User   | 409 ACCOUNT_EXISTS                                                                       |
| `POST /order/claim weak password`             | 7-char password                     | 400 validation                                                                           |
| `optionalAuth w/o cookie`                     | no token                            | next(), req.user null                                                                    |
| `optionalAuth w/ bad cookie`                  | garbage token                       | next(), req.user null, no 401                                                            |

### 6.2 Frontend Jest (`frontend/src/__tests__/Checkout*.test.js`)

| Suite                        | Cases                                                                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `CheckoutPage.test.js`       | renders 4 blocks; Guest CTA primary when logged out; Sign-in link visible; email pre-fills when logged in; StickyCta shows total |
| `ContactBlock.test.js`       | email validation on blur; toggle updates checkoutSlice.isGuest                                                                   |
| `ShippingBlock.test.js`      | field trim contract (no company/birthdate/phone2); country change updates postal regex; submit blocked while errors present      |
| `ReviewBlock.test.js`        | totals = subtotal + shipping + tax; matches Pricing service output                                                               |
| `StickyCta.test.js`          | visible at 375×667; renders running total; click triggers submit                                                                 |
| `checkoutSlice.test.js`      | setField clears error; setTouched; reset clears form; persist round-trip sessionStorage                                          |
| `checkoutValidators.test.js` | email accepts valid, rejects empty/no-@-no-dot; postal per-country; phone E.164                                                  |
| `ClaimForm.test.js`          | renders only on success page; password ≥8 validates; submit → POST → toast                                                       |

### 6.3 E2E Playwright (`e2e/guestCheckout.spec.js`)

```gherkin
Scenario: Guest happy path
  Given cart has 2 items
  When user clicks Checkout from /cart
  And clicks "Continue as Guest"
  And fills email + shipping + Stripe test card 4242
  Then order appears in /success?token=...
  And order has claimToken

Scenario: Claim converts guest to user
  Given success page with claim token
  When user enters password "passw0rd!"
  Then JWT cookie set
  And /orders/me lists the order
  And /login no longer prompts for password reset

Scenario: Auth user skips guest path
  Given logged in user with cart
  When user clicks Checkout
  Then Guest CTA is hidden
  And email field is pre-filled
```

### 6.4 Coverage

Existing thresholds (lines 65 / branches 30 / fns 40 / stmts 65) apply. New code must lift or hold these:

- `backend/services/claimService.js` → 100% lines (security path).
- `frontend/src/components/Checkout/*` → ≥ 80% lines.
- `frontend/src/store/checkoutSlice.js` → 100% lines (small).

Don't bump global threshold (could fail unrelated code). Add `coverageDelta` script in package.json that fails CI if new-file coverage < targets.

---

## 7. Risks & Mitigations

| Risk                                                  | Mitigation                                                                                                                 |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Claim token leaked in URL                             | Token is single-use, consumed atomically; URL stripped after redirect; short expiry (24h) — claimTokenHash has `expiresAt` |
| Guest buys → already has account (different password) | 409 ACCOUNT_EXISTS → UI offers "send reset link" instead of claim form                                                     |
| Cart cleared during checkout                          | sessionStorage draft persists form state; cart restore on return                                                           |
| Stock race on guest order                             | Same withTransaction + atomic `$inc` as auth path                                                                          |
| Webhook fires before claim                            | Claim tolerates already-paid orders                                                                                        |

---

## 8. Files Affected

**Backend (5):**

- `models/orderModel.js` (add fields, sparse user)
- `middleware/auth.js` (add optionalAuth)
- `middleware/validation.js` (add guest/claim rules)
- `controllers/orderController.js` (new claimOrder + guest path on newOrder)
- `services/claimService.js` (new)
- `routes/orderRoute.js` (mount claim, swap auth → optionalAuth)
- `__tests__/order.test.js` (8 new tests)

**Frontend (11 new + 4 edits):**

- New: `pages/Checkout.js`, `pages/CheckoutSuccess.js`, `components/Checkout/*` (10 files), `store/checkoutSlice.js`, `actions/claimAction.js`
- Edit: `App.js` (routes), `components/Cart/Cart.js` (CTA → `/checkout`), `store/index.js` (register slice), `pages/Success.js` (mount ClaimForm)
- Test: `__tests__/Checkout*.test.js`, `e2e/guestCheckout.spec.js`

---

## 9. Acceptance Criteria

- [ ] Unauthenticated user reaches `/checkout` directly from `/cart` with no `/login` redirect.
- [ ] Guest CTA is the visually dominant CTA on the contact block when logged out.
- [ ] Order placement with guest email returns a 64-hex claim token.
- [ ] Claim form on success page converts guest to user in one POST, links all prior guest orders by email.
- [ ] Replaying a consumed claim token returns 400 ALREADY_CLAIMED.
- [ ] Sticky CTA visible at 375px width with running total.
- [ ] Form fields audit: no inputs labeled `company`, `birthdate`, `secondary phone`, `fax`.
- [ ] All Jest + Playwright suites green; new-file coverage meets §6.4 targets.
- [ ] No regression in existing 224-test suite (BE 210 + FE 14 baseline).
