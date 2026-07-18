# Guest Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a guest-first one-page checkout that lets unauthenticated buyers place orders with an email-only identity, then optionally convert that guest order into a real account via a one-click "set password" claim on the success page. End-state: no `/login` redirect for cart → checkout, claim token is single-use, all suites green, build green.

**Architecture:** Backend extends Order schema (`guestEmail`, `claimTokenHash`, `claimedAt`, optional `user`); new `optionalAuth` middleware that yields `req.user = null` when no/bad JWT (instead of 401); new `claimService` for token HMAC verification + User creation + order re-link; new `/order/claim` public endpoint. Frontend splits checkout into one stacked page at `/checkout` (Contact / Shipping / Payment / Review), persists draft to `sessionStorage`, ships a sticky mobile CTA, and mounts `ClaimForm` on `/success` when a `?token=` is present.

**Tech Stack:** Node 20, Express 4, Mongoose 8, Stripe Elements, React 17, Redux Toolkit, Material UI, Tailwind, Jest+supertest, Playwright.

**Spec:** `docs/superpowers/specs/2026-07-13-guest-checkout-design.md`

## Global Constraints

- **DRY**: do not duplicate existing `isAuthenticatedUser` — only add `optionalAuth` alongside.
- **TDD**: write failing test first for every behavior; no implementation before red.
- **No regressions**: existing 224 tests must stay green (BE 210, FE 14 baseline).
- **Commits per task**, conventional-commit style.
- **No new deps** for backend. Frontend: only libs already in `frontend/package.json`.
- **Security**: claimToken is HMAC-SHA256 of `orderId|guestEmail` with `JWT_SECRET`; raw token returned only in `/order/new` response to the original buyer.
- **Validation**: keep `express-validator` style. Reuse `handleValidationErrors`.
- **Stock safety**: even guest path uses `withTransaction` + atomic `$inc`.
- **Claim is single-use**: second call on same token returns 400 `ALREADY_CLAIMED`.

## File Structure

### Create (new)

- `backend/services/claimService.js` — HMAC, user create, order re-link inside `withTransaction`
- `backend/__tests__/guestOrder.test.js` — guest + claim endpoint coverage
- `frontend/src/slices/checkoutSlice.js` — form state, validation, `sessionStorage` persist
- `frontend/src/utils/checkoutValidators.js` — email / postal per-country / phone E.164
- `frontend/src/components/Checkout/CheckoutPage.jsx` — orchestrator
- `frontend/src/components/Checkout/ContactBlock.jsx`
- `frontend/src/components/Checkout/ShippingBlock.jsx`
- `frontend/src/components/Checkout/ReviewBlock.jsx`
- `frontend/src/components/Checkout/StickyCta.jsx`
- `frontend/src/components/Checkout/TrustStrip.jsx`
- `frontend/src/components/Checkout/ClaimForm.jsx`
- `frontend/src/components/Checkout/index.js` — barrel
- `frontend/src/components/Checkout/__tests__/CheckoutPage.test.js`
- `frontend/src/components/Checkout/__tests__/ContactBlock.test.js`
- `frontend/src/components/Checkout/__tests__/ShippingBlock.test.js`
- `frontend/src/components/Checkout/__tests__/ReviewBlock.test.js`
- `frontend/src/components/Checkout/__tests__/StickyCta.test.js`
- `frontend/src/components/Checkout/__tests__/TrustStrip.test.js`
- `frontend/src/components/Checkout/__tests__/ClaimForm.test.js`
- `frontend/src/slices/__tests__/checkoutSlice.test.js`
- `frontend/src/utils/__tests__/checkoutValidators.test.js`
- `e2e/guestCheckout.spec.js` — Playwright

### Modify (existing)

- `backend/models/orderModel.js` — guestEmail, claimTokenHash, claimedAt, `user` sparse
- `backend/middleware/auth.js` — add `optionalAuth`
- `backend/middleware/validation.js` — add `validateGuestOrder`, `validateClaim`
- `backend/controllers/orderController.js` — adapt `createOrder` for guest path, new `claimOrder`
- `backend/services/orderService.js` — accept `guestEmail`, mint `claimTokenHash`
- `backend/routes/orderRoute.js` — `/order/claim` (public), `/order/new` switches to `optionalAuth`
- `frontend/src/App.js` — route `/checkout` (lazy), keep `/shipping` as auth-only fallback
- `frontend/src/components/Cart/Basket.js` — primary CTA → `/checkout`
- `frontend/src/components/Checkout/Success.js` — mount `<ClaimForm>` when `?token=` present
- `frontend/src/actions/orderAction.js` — add `claimGuestOrder` thunk

---

## Task 1: Order model — guest fields + sparse user

**Files:**

- Modify: `backend/models/orderModel.js`
- Test: `backend/__tests__/guestOrder.test.js`

**Interfaces:** produces Order docs with optional `guestEmail`, `claimTokenHash`, `claimedAt`; `user` becomes optional (sparse).

- [ ] **Step 1: Write the failing model test**

```js
// backend/__tests__/guestOrder.test.js
const Order = require("../models/orderModel");
describe("Order model — guest fields", () => {
  it("accepts order without user when guestEmail provided", async () => {
    const o = await Order.create({
      shippingInfo: {
        address: "1 St",
        city: "C",
        state: "S",
        country: "X",
        zip: 12345,
        phone: 1234567890,
      },
      orderItems: [
        { name: "x", price: 1, quantity: 1, image: "i", product: "64a000000000000000000000" },
      ],
      paymentInfo: { id: "pi_test", status: "succeeded" },
      itemPrice: 1,
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: 1,
      paidAt: Date.now(),
      guestEmail: "guest@example.com",
      claimTokenHash: "abc123",
    });
    expect(o.guestEmail).toBe("guest@example.com");
    expect(o.user).toBeUndefined();
    expect(o.claimTokenHash).toBe("abc123");
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

Run: `cd backend && npx jest __tests__/guestOrder.test.js -t "guest fields"`
Expected: FAIL — `user: required` validation.

- [ ] **Step 3: Update schema**

In `backend/models/orderModel.js`:

```js
// after existing user field
user: { type: mongoose.Schema.ObjectId, ref: "User", required: false, index: true, sparse: true },
guestEmail: { type: String, lowercase: true, trim: true, index: true, sparse: true },
claimTokenHash: { type: String, index: true, sparse: true, select: false },
claimedAt: { type: Date, default: null },
```

- [ ] **Step 4: Run test, expect PASS**

Run: `cd backend && npx jest __tests__/guestOrder.test.js -t "guest fields"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/models/orderModel.js backend/__tests__/guestOrder.test.js
git commit -m "feat(order): guest order model — guestEmail, claimTokenHash, optional user"
```

---

## Task 2: `optionalAuth` middleware

**Files:**

- Modify: `backend/middleware/auth.js`
- Test: `backend/__tests__/guestOrder.test.js` (extend)

**Interfaces:** exports `optionalAuth(req,res,next)` — sets `req.user` from valid JWT cookie, else `req.user = null`, calls `next()`.

- [ ] **Step 1: Write failing tests**

```js
const request = require("supertest");
const app = require("../app");
const User = require("../models/userModel");

describe("optionalAuth middleware", () => {
  it("yields req.user=null when no cookie (no 401)", async () => {
    // Hits a route mounted with optionalAuth (claim endpoint stub — see Task 6)
    const res = await request(app).get("/api/v1/checkout/whoami");
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });
  it("hydrates req.user from valid cookie", async () => {
    const u = await User.create({
      name: "OA",
      email: `oa_${Date.now()}@x.io`,
      password: "Passw0rd!",
      profilePic: { public_id: "a", url: "http://e.com/i.jpg" },
    });
    const login = await request(app)
      .post("/api/v1/login")
      .send({ email: u.email, password: "Passw0rd!" });
    const cookie = login.headers["set-cookie"][0];
    const res = await request(app).get("/api/v1/checkout/whoami").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(u.email);
  });
  it("treats garbage token as anonymous (no 401)", async () => {
    const res = await request(app).get("/api/v1/checkout/whoami").set("Cookie", "token=garbage");
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });
});
```

- [ ] **Step 2: Add dev whoami probe endpoint**

In `backend/routes/orderRoute.js` add at bottom (placeholder, removed in Task 6):

```js
router.get("/checkout/whoami", exports_from_below.optionalAuth_or_via_app_js, (req, res) =>
  res.json({ user: req.user ? { email: req.user.email } : null })
);
```

Actually wire it in `backend/app.js` directly for test isolation — search for where routes are mounted, then add before `module.exports = app`:

```js
// dev probe for optionalAuth (remove after guest work ships)
const { optionalAuth } = require("./middleware/auth");
app.get("/api/v1/checkout/whoami", optionalAuth, (req, res) =>
  res.json({ user: req.user ? { email: req.user.email } : null })
);
```

- [ ] **Step 3: Run tests, expect RED**

Run: `npx jest __tests__/guestOrder.test.js -t "optionalAuth"`
Expected: FAIL — `optionalAuth is not a function`.

- [ ] **Step 4: Implement optionalAuth in `backend/middleware/auth.js`**

Append:

```js
exports.optionalAuth = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id name email role");
    req.user = user || null;
  } catch (_e) {
    req.user = null;
  }
  next();
});
```

- [ ] **Step 5: Run tests, expect GREEN**

Run: `npx jest __tests__/guestOrder.test.js -t "optionalAuth"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/middleware/auth.js backend/__tests__/guestOrder.test.js backend/app.js
git commit -m "feat(auth): optionalAuth middleware — null user when no/bad JWT"
```

---

## Task 3: Validation rules — guest order + claim

**Files:**

- Modify: `backend/middleware/validation.js`
- (no new tests — covered by Task 6 endpoint tests)

**Interfaces:** exports `validateGuestOrder`, `validateClaim`.

- [ ] **Step 1: Append to `backend/middleware/validation.js`**

```js
exports.validateGuestOrder = [
  body("guestEmail").isEmail().withMessage("Valid email required").normalizeEmail(),
  body("shippingInfo").isObject(),
  body("orderItems").isArray({ min: 1 }),
  handleValidationErrors,
];

exports.validateClaim = [
  body("claimToken").isString().isLength({ min: 64, max: 64 }).withMessage("Invalid claim token"),
  body("password")
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be 8-128 chars"),
  handleValidationErrors,
];
```

- [ ] **Step 2: Smoke-test import**

Run: `node -e "const v=require('./middleware/validation'); console.log(typeof v.validateGuestOrder, typeof v.validateClaim);"`
Expected: prints `function function`.

- [ ] **Step 3: Commit**

```bash
git add backend/middleware/validation.js
git commit -m "feat(validation): guest order + claim body rules"
```

---

## Task 4: `claimService` (TDD)

**Files:**

- Create: `backend/services/claimService.js`
- Create: `backend/__tests__/claimService.test.js`

**Interfaces:** `mintClaimToken(orderId, guestEmail)` → hex string; `claimGuestOrder({claimToken, password})` → `{user, tokenCookie}` or throws `ErrorHandler`.

- [ ] **Step 1: Write failing tests**

```js
// backend/__tests__/claimService.test.js
const crypto = require("crypto");
const mongoose = require("mongoose");
const orderService = require("../services/orderService");
const { mintClaimToken, claimGuestOrder } = require("../services/claimService");
const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");

let productId;
beforeAll(async () => {
  const p = await Product.create({
    name: "Claim Prod",
    description: "d",
    price: 50,
    category: "Test",
    stock: 10,
    images: [{ public_id: "cp", url: "http://e.com/c.jpg" }],
    createdBy: new mongoose.Types.ObjectId(),
  });
  productId = p._id;
});

describe("claimService — HMAC + lifecycle", () => {
  it("mintClaimToken returns 64-char hex", () => {
    const t = mintClaimToken(new mongoose.Types.ObjectId().toString(), "x@y.io");
    expect(t).toMatch(/^[0-9a-f]{64}$/);
  });

  it("claimGuestOrder rejects token that does not match an order", async () => {
    const fake = mintClaimToken(new mongoose.Types.ObjectId().toString(), "no@order.io");
    await expect(claimGuestOrder({ claimToken: fake, password: "passw0rd!" })).rejects.toThrow(
      /Invalid claim token/i
    );
  });

  it("claimGuestOrder rejects replayed token", async () => {
    // Create a guest order via orderService path then claim twice
    const u = new mongoose.Types.ObjectId();
    const order = await Order.create({
      shippingInfo: {
        address: "1 St",
        city: "C",
        state: "S",
        country: "X",
        zip: 12345,
        phone: 1234567890,
      },
      orderItems: [{ name: "x", price: 1, quantity: 1, image: "i", product: productId }],
      paymentInfo: { id: "pi_x", status: "succeeded" },
      itemPrice: 1,
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: 1,
      paidAt: Date.now(),
      guestEmail: "r1@y.io",
      claimTokenHash: require("crypto")
        .createHash("sha256")
        .update(mintClaimToken("FIX_ME", "r1@y.io"))
        .digest("hex"),
    });
    // Mint valid token for that orderId + email
    const token = mintClaimToken(order._id.toString(), "r1@y.io");
    order.claimTokenHash = require("crypto").createHash("sha256").update(token).digest("hex");
    await order.save();
    const first = await claimGuestOrder({ claimToken: token, password: "passw0rd!" });
    expect(first.user.email).toBe("r1@y.io");
    await expect(claimGuestOrder({ claimToken: token, password: "passw0rd!" })).rejects.toThrow(
      /already claimed/i
    );
  });

  it("claimGuestOrder signals ACCOUNT_EXISTS when email has User", async () => {
    await User.create({
      name: "E",
      email: "dup@y.io",
      password: "Existing1!",
      profilePic: { public_id: "d", url: "http://e.com/d.jpg" },
    });
    // Create a guest order w/ that email
    const oid = new mongoose.Types.ObjectId();
    const token = mintClaimToken(oid.toString(), "dup@y.io");
    await Order.create({
      shippingInfo: {
        address: "1 St",
        city: "C",
        state: "S",
        country: "X",
        zip: 12345,
        phone: 1234567890,
      },
      orderItems: [{ name: "x", price: 1, quantity: 1, image: "i", product: productId }],
      paymentInfo: { id: "pi_dup", status: "succeeded" },
      itemPrice: 1,
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: 1,
      paidAt: Date.now(),
      guestEmail: "dup@y.io",
      claimTokenHash: require("crypto").createHash("sha256").update(token).digest("hex"),
    });
    await expect(
      claimGuestOrder({ claimToken: token, password: "passw0rd!" })
    ).rejects.toMatchObject({ statusCode: 409, message: expect.stringMatching(/account exists/i) });
  });
});
```

- [ ] **Step 2: Run, expect RED**

Run: `npx jest __tests__/claimService.test.js`
Expected: FAIL — `claimService.claimGuestOrder is not a function`.

- [ ] **Step 3: Implement `backend/services/claimService.js`**

```js
const crypto = require("crypto");
const Order = require("../models/orderModel");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");
const { withTransaction } = require("../utils/transaction");
const { sendToken } = require("../utils/jwtToken");
const logger = require("../utils/logger");

function secret() {
  return process.env.JWT_SECRET;
}

function sign(orderId, guestEmail) {
  return crypto.createHmac("sha256", secret()).update(`${orderId}|${guestEmail}`).digest("hex");
}

exports.mintClaimToken = function mintClaimToken(orderId, guestEmail) {
  return sign(orderId, (guestEmail || "").toLowerCase());
};

async function findOrderByToken(token) {
  // We don't store the raw token — only HMAC. Compute candidate hashes for
  // recent guest orders whose guestEmail matches nothing (claimed already have
  // claimTokenHash cleared). Brute-force safe: scope to orders w/ a claimTokenHash.
  const orders = await Order.find({ claimTokenHash: { $exists: true, $ne: null } })
    .select("+claimTokenHash")
    .limit(50)
    .sort({ createdAt: -1 })
    .lean();
  for (const o of orders) {
    if (!o.guestEmail) continue;
    if (sign(o._id.toString(), o.guestEmail) === token) return o;
  }
  return null;
}

exports.claimGuestOrder = async function claimGuestOrder({ claimToken, password }) {
  if (!/^[0-9a-f]{64}$/.test(claimToken || "")) {
    throw new ErrorHandler("Invalid claim token", 400);
  }

  const order = await findOrderByToken(claimToken);
  if (!order) throw new ErrorHandler("Invalid claim token", 400);

  if (order.claimedAt) throw new ErrorHandler("Order already claimed", 400);

  const email = order.guestEmail;
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new ErrorHandler("An account already exists for that email — please sign in", 409);
    err.code = "ACCOUNT_EXISTS";
    throw err;
  }

  const result = await withTransaction(async (session) => {
    const [user] = await User.create(
      [{ name: email.split("@")[0], email, password, profilePic: { public_id: "guest", url: "" } }],
      { session }
    );

    const linked = await Order.find({ guestEmail: email })
      .select("_id user claimTokenHash claimedAt")
      .session(session);

    for (const o of linked) {
      // verify each order's claimTokenHash matches this token (in case guest
      // had multiple orders; rare but possible)
      const sig = sign(o._id.toString(), email);
      if (sig !== claimToken && o.claimTokenHash) continue;
      o.user = user._id;
      o.claimedAt = new Date();
      o.claimTokenHash = undefined;
      await o.save({ session });
    }

    return { user };
  });

  logger.info(`Guest claimed order ${order._id}; new user ${result.user._id}`);
  return result;
};
```

- [ ] **Step 4: Run, expect GREEN (or only fixture-clean FAIL)**

Run: `npx jest __tests__/claimService.test.js`
Expected: tests pass.

If the "replayed token" test fails with "Invalid claim token" the second time, ensure the second claim attempt sees `claimedAt` set — adjust `findOrderByToken` filter to skip claimed orders:

```js
const orders = await Order.find({ claimTokenHash: { $ne: null }, claimedAt: null });
```

- [ ] **Step 5: Commit**

```bash
git add backend/services/claimService.js backend/__tests__/claimService.test.js
git commit -m "feat(claim): HMAC token mint + service layer with transactional user creation"
```

---

## Task 5: `orderService.createOrder` accepts guest path

**Files:**

- Modify: `backend/services/orderService.js`

**Interfaces:** `createOrder(data, userId | null)` — when `userId` is null and `data.guestEmail` is set, store `guestEmail`, mint raw `claimToken`, set `claimTokenHash`, return `{order, claimToken}` (claimToken only for guests).

- [ ] **Step 1: Tweak test**

Add to `backend/__tests__/claimService.test.js`:

```js
describe("orderService.createOrder — guest path", () => {
  it("returns claimToken on guest order creation", async () => {
    const order = await orderService.createOrder(
      {
        shippingInfo: {
          address: "1 St",
          city: "C",
          state: "S",
          country: "X",
          zip: 12345,
          phone: 1234567890,
        },
        orderItems: [{ name: "Item", price: 10, quantity: 1, image: "i", product: productId }],
        paymentInfo: { id: `pi_${Date.now()}`, status: "succeeded" },
      },
      null,
      { guestEmail: "guest1@y.io" }
    );
    expect(order.claimToken).toMatch(/^[0-9a-f]{64}$/);
    expect(order.order.guestEmail).toBe("guest1@y.io");
    expect(order.order.user).toBeUndefined();
  });
  it("rejects without user or guestEmail", async () => {
    await expect(
      orderService.createOrder(
        {
          shippingInfo: { address: "1", city: "C", state: "S", country: "X", zip: 1, phone: 1 },
          orderItems: [{ name: "i", price: 1, quantity: 1, image: "i", product: productId }],
          paymentInfo: { id: "pi_no", status: "succeeded" },
        },
        null,
        {}
      )
    ).rejects.toThrow(/email/i);
  });
});
```

- [ ] **Step 2: Run, expect RED**

Run: `npx jest __tests__/claimService.test.js -t "guest path"`
Expected: FAIL — `createOrder(...)` signature mismatch.

- [ ] **Step 3: Patch `orderService.createOrder` signature + add guest path**

At top:

```js
const { mintClaimToken } = require("./claimService");
```

Change signature to:

```js
async function createOrder({ shippingInfo, orderItems, paymentInfo, currency = "USD", currencyRate = 1, couponCode }, userId, opts = {}) {
  const guestEmail = opts.guestEmail ? String(opts.guestEmail).toLowerCase().trim() : null;
  if (!userId && !guestEmail) {
    throw new ErrorHandler("Email is required for guest checkout", 400);
  }
```

Inside the `withTransaction` callback, before creating the order, compute `claimToken`:

```js
const claimToken = userId ? null : mintClaimTokenPlaceholder();
```

Replace with:

```js
const claimToken = userId ? null : require("./claimService").mintClaimToken("(TMP)", guestEmail); // placeholder, replaced below
```

After `Order.create([{...}], {session})` returns, set real hash:

```js
const newOrderArr = await Order.create([{...}], { session });
const newOrder = newOrderArr[0];
if (!userId) {
  const real = require("./claimService").mintClaimToken(newOrder._id.toString(), guestEmail);
  newOrder.guestEmail = guestEmail;
  newOrder.claimTokenHash = require("crypto").createHash("sha256").update(real).digest("hex");
  await newOrder.save({ session });
}
return userId ? newOrder : { order: newOrder, claimToken: real };
```

Drop the `placeholder` line — it was a stub. Use the `mintClaimToken` from required module up top, then re-mint once ID is known.

(Final clean diff is small: store the ID-assigned token + hash post-insert. Keeps crypto sec rules straightforward.)

- [ ] **Step 4: Run, expect GREEN**

Run: `npx jest __tests__/claimService.test.js`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/services/orderService.js backend/__tests__/claimService.test.js
git commit -m "feat(order): service accepts guest path with claim token"
```

---

## Task 6: Routes + controller wiring + endpoint tests

**Files:**

- Modify: `backend/routes/orderRoute.js`
- Modify: `backend/controllers/orderController.js`
- Create: `backend/__tests__/guestEndpoints.test.js`
- Modify: `backend/app.js` (remove whoami probe)

**Interfaces:** `POST /api/v1/order/new` accepts optionalAuth; `POST /api/v1/order/claim` is public.

- [ ] **Step 1: Write failing endpoint tests**

```js
// backend/__tests__/guestEndpoints.test.js
const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const Product = require("../models/productModel");

let productId;
beforeAll(async () => {
  const p = await Product.create({
    name: "EP",
    description: "d",
    price: 25,
    category: "Test",
    stock: 10,
    images: [{ public_id: "e", url: "http://e.com/e.jpg" }],
    createdBy: new mongoose.Types.ObjectId(),
  });
  productId = p._id;
});

const shipping = {
  address: "1 St",
  city: "C",
  state: "S",
  country: "X",
  zip: "12345",
  phone: "9876543210",
};
const items = () => [{ name: "x", price: 25, quantity: 1, image: "i", product: productId }];

describe("POST /order/new — guest path", () => {
  it("201 + claimToken when no auth + valid guestEmail", async () => {
    const res = await request(app)
      .post("/api/v1/order/new")
      .send({
        shippingInfo: shipping,
        orderItems: items(),
        paymentInfo: { id: `pi_${Date.now()}`, status: "succeeded" },
        guestEmail: "guest_endpoint@y.io",
      });
    expect(res.status).toBe(201);
    expect(res.body.claimToken).toMatch(/^[0-9a-f]{64}$/);
    expect(res.body.order.guestEmail).toBe("guest_endpoint@y.io");
  });
  it("400 GUEST_EMAIL_REQUIRED when no auth + no email", async () => {
    const res = await request(app)
      .post("/api/v1/order/new")
      .send({
        shippingInfo: shipping,
        orderItems: items(),
        paymentInfo: { id: `pi_ne_${Date.now()}`, status: "succeeded" },
      });
    expect(res.status).toBe(400);
  });
  it("400 STOCK_INSUFFICIENT when qty > stock (guest)", async () => {
    const res = await request(app)
      .post("/api/v1/order/new")
      .send({
        shippingInfo: shipping,
        orderItems: [{ ...items()[0], quantity: 999 }],
        paymentInfo: { id: `pi_stk_${Date.now()}`, status: "succeeded" },
        guestEmail: "stockguest@y.io",
      });
    expect(res.status).toBe(400);
  });
});

describe("POST /order/claim", () => {
  it("201 + JWT cookie on success", async () => {
    const created = await request(app)
      .post("/api/v1/order/new")
      .send({
        shippingInfo: shipping,
        orderItems: items(),
        paymentInfo: { id: `pi_cl_${Date.now()}`, status: "succeeded" },
        guestEmail: "claimme@y.io",
      });
    const token = created.body.claimToken;
    const claim = await request(app)
      .post("/api/v1/order/claim")
      .send({ claimToken: token, password: "passw0rd!" });
    expect(claim.status).toBe(201);
    expect(claim.headers["set-cookie"]).toBeDefined();
    const me = await request(app).get("/api/v1/me").set("Cookie", claim.headers["set-cookie"][0]);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe("claimme@y.io");
  });
  it("400 on replay", async () => {
    const created = await request(app)
      .post("/api/v1/order/new")
      .send({
        shippingInfo: shipping,
        orderItems: items(),
        paymentInfo: { id: `pi_clr_${Date.now()}`, status: "succeeded" },
        guestEmail: "replay@y.io",
      });
    const token = created.body.claimToken;
    await request(app)
      .post("/api/v1/order/claim")
      .send({ claimToken: token, password: "passw0rd!" });
    const second = await request(app)
      .post("/api/v1/order/claim")
      .send({ claimToken: token, password: "passw0rd!" });
    expect(second.status).toBe(400);
  });
  it("409 when email matches existing User", async () => {
    await User.create({
      name: "Dup2",
      email: "dup2@y.io",
      password: "Existing1!",
      profilePic: { public_id: "x", url: "http://e.com/x.jpg" },
    });
    const created = await request(app)
      .post("/api/v1/order/new")
      .send({
        shippingInfo: shipping,
        orderItems: items(),
        paymentInfo: { id: `pi_dup_${Date.now()}`, status: "succeeded" },
        guestEmail: "dup2@y.io",
      });
    const res = await request(app)
      .post("/api/v1/order/claim")
      .send({ claimToken: created.body.claimToken, password: "passw0rd!" });
    expect(res.status).toBe(409);
  });
});
```

- [ ] **Step 2: Run tests, expect RED**

Run: `npx jest __tests__/guestEndpoints.test.js`
Expected: FAIL — 401 (route still requires auth).

- [ ] **Step 3: Wire routes**

In `backend/routes/orderRoute.js`:

```js
const {
  createOrder,
  getOrderDetails,
  getMyOrders,
  getAllOrders,
  updateOrder,
  deleteOrder,
  claimOrder,
} = require("../controllers/orderController");
const { isAuthenticatedUser, optionalAuth, authorizeRoles } = require("../middleware/auth");
const {
  validateCreateOrder,
  validateUpdateOrder,
  validateOrderId,
  validatePagination,
  validateClaim,
  validateGuestOrder,
} = require("../middleware/validation");

router.route("/order/new").post(optionalAuth, validateCreateOrder, createOrder);
router.route("/order/claim").post(validateClaim, claimOrder);
// keep all others as-is
```

In `backend/controllers/orderController.js` add (top of file):

```js
const { claimGuestOrder } = require("../services/claimService");
const { sendToken } = require("../utils/jwtToken");

exports.claimOrder = catchAsyncErrors(async (req, res, next) => {
  try {
    const { user } = await claimGuestOrder(req.body);
    sendToken(user, 201, res);
  } catch (err) {
    return next(err);
  }
});

// Replace createOrder body to forward guestEmail + handle null userId
exports.createOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    currency = "USD",
    currencyRate = 1,
    couponCode,
    guestEmail,
  } = req.body;
  try {
    const result = await orderService.createOrder(
      { shippingInfo, orderItems, paymentInfo, currency, currencyRate, couponCode },
      req.user ? req.user._id : null,
      { guestEmail }
    );
    if (req.user) {
      res.status(201).json({ success: true, order: result });
    } else {
      res.status(201).json({ success: true, order: result.order, claimToken: result.claimToken });
    }
  } catch (err) {
    return next(err);
  }
});
```

- [ ] **Step 4: Remove whoami probe + run all BE tests**

Run: `npx jest`
Expected: previous 210 + new ~12 tests pass, zero failures.

- [ ] **Step 5: Commit**

```bash
git add backend/routes/orderRoute.js backend/controllers/orderController.js backend/__tests__/guestEndpoints.test.js backend/app.js
git commit -m "feat(checkout): /order/claim public route + /order/new accepts guest"
```

---

## Task 7: Frontend infra — `checkoutSlice` + validators

**Files:**

- Create: `frontend/src/slices/checkoutSlice.js`
- Create: `frontend/src/utils/checkoutValidators.js`
- Create: `frontend/src/slices/__tests__/checkoutSlice.test.js`
- Create: `frontend/src/utils/__tests__/checkoutValidators.test.js`
- Modify: `frontend/src/store.js` (register slice)

**Interfaces:** exported selectors; `validateField(state, name)` returns error string|null.

- [ ] **Step 1: Write failing validator test**

```js
// frontend/src/utils/__tests__/checkoutValidators.test.js
import { validateEmail, validatePostal, validatePhone, validateField } from "../checkoutValidators";

describe("checkoutValidators", () => {
  it("email accepts jane@x.io", () => {
    expect(validateEmail("jane@x.io")).toBeNull();
    expect(validateEmail("nope")).toMatch(/email/i);
  });
  it("postal per-country", () => {
    expect(validatePostal("94107", "US")).toBeNull();
    expect(validatePostal("M5V 3A8", "CA")).toBeNull();
    expect(validatePostal("SW1A 1AA", "GB")).toBeNull();
    expect(validatePostal("abc", "US")).toMatch(/postcode/i);
  });
  it("phone accepts E.164 or 7-15 digits", () => {
    expect(validatePhone("+14155551234")).toBeNull();
    expect(validatePhone("4155551234")).toBeNull();
    expect(validatePhone("abc")).toMatch(/phone/i);
  });
  it("validateField routes by name", () => {
    expect(validateField("email", "not-an-email")).toMatch(/email/i);
    expect(validateField("postal", "abc", "US")).toMatch(/postcode/i);
    expect(validateField("zip", "abc", "US")).toMatch(/postcode/i);
  });
});
```

- [ ] **Step 2: Run, expect RED**

Run: `cd frontend && npx jest src/utils/__tests__/checkoutValidators.test.js`
Expected: module not found.

- [ ] **Step 3: Implement `frontend/src/utils/checkoutValidators.js`**

```js
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const US = /^\d{5}(-\d{4})?$/;
const CA = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i;
const GB = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
const IN_POSTAL = /^\d{6}$/;
const FALLBACK = /^\d{3,10}$/;

export function validateEmail(v) {
  if (!v) return "that email slipped away — try again?";
  return EMAIL.test(v) ? null : "that email slipped away — try again?";
}

const POSTAL_RULES = { US, CA, GB, IN: IN_POSTAL };
export function validatePostal(v, country) {
  if (!v) return "postcode needed";
  const re = POSTAL_RULES[country?.toUpperCase()] || FALLBACK;
  return re.test(String(v).trim()) ? null : "postcode looks off for that country";
}

export function validatePhone(v) {
  if (!v) return "phone needed";
  const cleaned = String(v).replace(/[\s\-()]/g, "");
  if (/^\+?\d{7,15}$/.test(cleaned)) return null;
  return "phone needs country code, e.g. +1…";
}

export function validateField(name, value, country) {
  switch (name) {
    case "email":
      return validateEmail(value);
    case "postal":
    case "zip":
      return validatePostal(value, country);
    case "phone":
      return validatePhone(value);
    default:
      return null;
  }
}
```

- [ ] **Step 4: Write failing slice test**

```js
// frontend/src/slices/__tests__/checkoutSlice.test.js
import reducer, { setField, setTouched, reset, hydrate } from "../checkoutSlice";

describe("checkoutSlice", () => {
  it("setField updates value and clears that error", () => {
    const s1 = reducer(undefined, setField({ name: "email", value: "x" }));
    expect(s1.email).toBe("x");
    s1.errors.email = "bad";
    const s2 = reducer(s1, setField({ name: "email", value: "jane@x.io" }));
    expect(s2.errors.email).toBeUndefined();
  });
  it("setTouched marks field", () => {
    const s = reducer(undefined, setTouched("email"));
    expect(s.touched.email).toBe(true);
  });
  it("reset returns initial state", () => {
    const s = reducer(undefined, setField({ name: "email", value: "x" }));
    const r = reducer(s, reset());
    expect(r.email).toBe("");
  });
  it("hydrate replaces state", () => {
    const r = reducer(undefined, hydrate({ email: "y@x.io", isGuest: false }));
    expect(r.email).toBe("y@x.io");
    expect(r.isGuest).toBe(false);
  });
});
```

- [ ] **Step 5: Run, expect RED**

Run: `npx jest src/slices/__tests__/checkoutSlice.test.js`
Expected: module not found.

- [ ] **Step 6: Implement `frontend/src/slices/checkoutSlice.js`**

```js
import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "hvrg_checkout_draft";

const initial = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    email: "",
    name: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postal: "",
    country: "US",
    phone: "",
    isGuest: true,
    touched: {},
    errors: {},
    step: "idle",
    orderId: null,
    claimToken: null,
    totalCents: 0,
  };
};

const slice = createSlice({
  name: "checkout",
  initialState: initial(),
  reducers: {
    setField: (state, { payload }) => {
      const { name, value } = payload;
      state[name] = value;
      if (state.errors[name]) delete state.errors[name];
    },
    setError: (state, { payload }) => {
      const { name, message } = payload;
      if (message) state.errors[name] = message;
      else delete state.errors[name];
    },
    setTouched: (state, { payload }) => {
      state.touched[payload] = true;
    },
    setStep: (state, { payload }) => {
      state.step = payload;
    },
    setGuest: (state, { payload }) => {
      state.isGuest = !!payload;
    },
    setOrder: (state, { payload }) => {
      state.orderId = payload.orderId;
      state.claimToken = payload.claimToken || null;
      state.step = "placed";
    },
    reset: () => initial(),
    hydrate: (_state, { payload }) => payload,
  },
});

export const { setField, setError, setTouched, setStep, setGuest, setOrder, reset, hydrate } =
  slice.actions;
export default slice.reducer;

// ponytail: tiny side-effect for sessionStorage — single key, JSON blob, no per-field writes
let saveTimer;
export const persistMiddleware = () => (next) => (action) => {
  const result = next(action);
  if (typeof action.type === "string" && action.type.startsWith("checkout/")) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next(action).checkout || {}));
      } catch {}
    }, 200);
  }
  return result;
};
```

Add the middleware + reducer in `frontend/src/store.js`:

```js
import checkoutReducer, { persistMiddleware } from "./slices/checkoutSlice";
// inside configureStore({ reducer: { ..., checkout: checkoutReducer }, middleware: (gdm) => gdm().concat(persistMiddleware) })
```

(Read store.js, splice in.)

- [ ] **Step 7: Run both suites green**

Run: `npx jest src/slices/__tests__/checkoutSlice.test.js src/utils/__tests__/checkoutValidators.test.js`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/slices/checkoutSlice.js frontend/src/slices/__tests__/checkoutSlice.test.js frontend/src/utils/checkoutValidators.js frontend/src/utils/__tests__/checkoutValidators.test.js frontend/src/store.js
git commit -m "feat(checkout): validators + checkoutSlice with sessionStorage persist"
```

---

## Task 8: Checkout components — Contact, Shipping, StickyCta, TrustStrip, Review

**Files:**

- Create: `frontend/src/components/Checkout/{ContactBlock,ShippingBlock,StickyCta,TrustStrip,ReviewBlock}.jsx`
- Create: tests per component

**Interfaces:** each is a presentational component consuming the slice via `useSelector`/`useDispatch`.

- [ ] **Step 1: ContactBlock — test + impl**

Test:

```js
// ContactBlock.test.js
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import checkoutReducer from "../../../slices/checkoutSlice";
import ContactBlock from "../ContactBlock";

const wrap = () => ({ checkout: checkoutReducer(undefined, { type: "@@INIT" }) });
const renderWith = () =>
  render(
    <Provider store={configureStore({ reducer: wrap() })}>
      <ContactBlock signedIn={false} />
    </Provider>
  );

it("shows Continue as Guest primary CTA when signed out", () => {
  renderWith();
  expect(screen.getByRole("button", { name: /continue as guest/i })).toBeInTheDocument();
  expect(screen.getByText(/sign in for faster/i)).toBeInTheDocument();
});
it("hides guest CTA when signed in", () => {
  render(
    <Provider store={configureStore({ reducer: wrap() })}>
      <ContactBlock signedIn />
    </Provider>
  );
  expect(screen.queryByRole("button", { name: /continue as guest/i })).toBeNull();
});
it("shows email validation error after blur", () => {
  renderWith();
  const input = screen.getByLabelText(/email/i);
  fireEvent.change(input, { target: { value: "nope" } });
  fireEvent.blur(input);
  expect(screen.getByText(/email slipped/i)).toBeInTheDocument();
});
```

`ContactBlock.jsx`:

```jsx
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setField, setError, setTouched } from "../../slices/checkoutSlice";
import { validateEmail } from "../../utils/checkoutValidators";
import { PrimaryBtn, GhostText } from "../../design/primitives";

export default function ContactBlock({ signedIn }) {
  const dispatch = useDispatch();
  const { email, touched, errors, isGuest } = useSelector((s) => s.checkout);
  const onEmail = (e) => dispatch(setField({ name: "email", value: e.target.value }));
  const onBlur = () => {
    dispatch(setTouched("email"));
    dispatch(setError({ name: "email", message: validateEmail(email) }));
  };
  return (
    <section aria-label="Contact">
      <h2>0 · Contact</h2>
      <label htmlFor="co-email">Email for receipt</label>
      <input
        id="co-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={onEmail}
        onBlur={onBlur}
        aria-invalid={!!(touched.email && errors.email)}
      />
      {touched.email && errors.email && <p role="alert">{errors.email}</p>}
      {!signedIn && (
        <div className="flex gap-2 items-center">
          <PrimaryBtn
            onClick={() => dispatch({ type: "checkout/setGuest", payload: true })}
            aria-pressed={isGuest}
          >
            Continue as Guest
          </PrimaryBtn>
          <GhostText as="a" href="/signin?redirect=/checkout">
            or sign in for faster checkout
          </GhostText>
        </div>
      )}
    </section>
  );
}
```

(Use whatever the design primitive imports already in this repo are — adapt names if `PrimaryBtn`/`GhostText` differ; fall back to MUI `Button` with `variant="contained"`.)

- [ ] **Step 2: ShippingBlock — test + impl**

Test asserts the audit: no `company`, `birthdate`, `phone2`, `fax` inputs.

```js
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import checkoutReducer from "../../../slices/checkoutSlice";
import ShippingBlock from "../ShippingBlock";

it("renders trimmed form — no company/birthdate/phone2 fields", () => {
  const { container } = render(
    <Provider store={configureStore({ reducer: { checkout: checkoutReducer } })}>
      <ShippingBlock />
    </Provider>
  );
  const html = container.innerHTML.toLowerCase();
  expect(html).not.toMatch(/name=["']?company|companyname/);
  expect(html).not.toMatch(/birth|date.of.birth|dob/);
  expect(html).not.toMatch(/phone.?2|secondary.?phone|fax/);
  expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/postal|zip/i)).toBeInTheDocument();
});
```

`ShippingBlock.jsx`: dropdown + text fields, reuses `useSelector`/`setField`/`setError`/`setTouched`. Postal validator runs on blur with `country` from state.

- [ ] **Step 3: StickyCta — test + impl**

Test at mobile viewport (375×667):

```js
it("shows Place Order CTA with total at mobile viewport", () => {
  global.innerWidth = 375;
  global.innerHeight = 667;
  const { getByRole } = render(
    <StickyCta totalLabel="$99.83" onClick={() => {}} submitting={false} />
  );
  expect(getByRole("button", { name: /place order/i })).toHaveTextContent(/99\.83/);
});
```

`StickyCta.jsx`: position: fixed bottom 0 full-width on mobile, inline on desktop (`@media (min-width: 900px)`).

- [ ] **Step 4: TrustStrip — test + impl**

Renders three labels in a row; trivial snapshot.

- [ ] **Step 5: ReviewBlock — test + impl**

```js
it("computes totals = subtotal + shipping + tax", () => {
  const { getByTestId } = render(<ReviewBlock subtotal={87} shipping={5} tax={7.83} />);
  expect(getByTestId("total")).toHaveTextContent("$99.83");
});
```

`ReviewBlock.jsx` takes props for now — wire to Pricing service in next task.

- [ ] **Step 6: Run FE suite per file**

Run: `npx jest src/components/Checkout/__tests__/ -t ""`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/Checkout frontend/src/components/Checkout/__tests__
git commit -m "feat(checkout): contact/shipping/sticky/trust/review blocks"
```

---

## Task 9: CheckoutPage orchestrator + routes + Cart CTA

**Files:**

- Create: `frontend/src/components/Checkout/CheckoutPage.jsx`
- Modify: `frontend/src/App.js`
- Modify: `frontend/src/components/Cart/Basket.js` (one-line CTA swap)

**Interfaces:** page reads `user` from `state.user`; renders ContactBlock(signedIn={!!user}); passes form state down; PaymentBlock reuses Stripe Elements from existing wrapper.

- [ ] **Step 1: Write page-level test**

```js
it("renders Contact block with Guest CTA when logged out", () => {
  const store = configureStore({
    reducer: { checkout: checkoutReducer, user: (s = { user: null }) => s },
  });
  const { getByText } = render(
    <Provider store={store}>
      <CheckoutPage />
    </Provider>
  );
  expect(getByText(/continue as guest/i)).toBeInTheDocument();
});
it("hides Guest CTA when user present", () => {
  const userSlice = (s = { user: { email: "j@x.io" } }) => s;
  const store = configureStore({ reducer: { checkout: checkoutReducer, user: userSlice } });
  const { queryByText } = render(
    <Provider store={store}>
      <CheckoutPage />
    </Provider>
  );
  expect(queryByText(/continue as guest/i)).toBeNull();
});
```

- [ ] **Step 2: Implement `CheckoutPage.jsx`**

Sketch (350 lines expected):

```jsx
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import loadStripe from "@stripe/stripe-js";

import ContactBlock from "./ContactBlock";
import ShippingBlock from "./ShippingBlock";
import ReviewBlock from "./ReviewBlock";
import StickyCta from "./StickyCta";
import TrustStrip from "./TrustStrip";
import { useToast } from "../../hooks/useToast";
import { claimOrder, createOrder } from "../../actions/orderAction";

export default function CheckoutPage() {
  const { user } = useSelector((s) => s.user);
  const { cartItems, shippingInfo } = useSelector((s) => s.cart);
  const { subtotal, shipping, tax, total } = useSelector((s) => computeTotals(s.cart));
  const stripePromise = loadStripe(/* read from global via meta */);
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const onPlace = async () => {
    /* aggregates all blocks, hits createOrder */
  };

  return (
    <main className="co-page">
      <ContactBlock signedIn={!!user} />
      <ShippingBlock />
      <Elements stripe={stripePromise}>
        {/* PaymentBlock carries CardNumberElement like existing PaymentForm */}
      </Elements>
      <ReviewBlock subtotal={subtotal} shipping={shipping} tax={tax} total={total} />
      <TrustStrip />
      <StickyCta totalLabel={fmt(total)} submitting={submitting} onClick={onPlace} />
    </main>
  );
}
```

(Implementation fills `onPlace` from the existing `Shipping.js` submit logic. Re-export `computeTotals` from `frontend/src/utils/pricing` or the cart reducer.)

- [ ] **Step 3: Routes**

In `frontend/src/App.js`:

```js
const Checkout = lazy(() => import("./components/Checkout/CheckoutPage"));
// inside <Routes>, before protected routes:
<Route path="/checkout" element={<Checkout />} />;
```

Mount `<ToastHost />` should already wrap.

- [ ] **Step 4: Basket CTA swap**

In `frontend/src/components/Cart/Basket.js`, find the existing "Proceed to Checkout" / "Checkout" link (currently `/login?redirect=/shipping` per current pattern). Replace href with `/checkout`. Single `Edit`.

- [ ] **Step 5: Run FE suite**

Run: `npx jest`
Expected: existing 14 + new suites pass; no regression.

- [ ] **Step 6: Manual smoke**

Run: `npm start --prefix frontend` + open `http://localhost:3000/cart`. Confirm "Checkout" button navigates to `/checkout`. Reload — form draft should restore from sessionStorage.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/Checkout/CheckoutPage.jsx frontend/src/components/Checkout/__tests__/CheckoutPage.test.js frontend/src/App.js frontend/src/components/Cart/Basket.js
git commit -m "feat(checkout): /checkout route + orchestrator + Basket CTA"
```

---

## Task 10: ClaimForm + Success wiring + claim action

**Files:**

- Create: `frontend/src/components/Checkout/ClaimForm.jsx`
- Create: `frontend/src/components/Checkout/__tests__/ClaimForm.test.js`
- Modify: `frontend/src/components/Checkout/Success.js`
- Modify: `frontend/src/actions/orderAction.js`

**Interfaces:** `<ClaimForm claimToken />` POSTs to `/api/v1/order/claim`; on 201 navigates to `/orders` (and reloads user state).

- [ ] **Step 1: Test**

```js
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../../reducers/User";
import ClaimForm from "../ClaimForm";

jest.mock("axios");

it("submits claimToken + password and shows success", async () => {
  axios.post.mockResolvedValueOnce({ status: 201, data: { success: true } });
  render(<Provider store={configureStore({ reducer: { user: userReducer } })}><ClaimForm claimToken="a".repeat(64)} /></Provider>);
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "passw0rd!" } });
  fireEvent.click(screen.getByRole("button", { name: /save/i }));
  await waitFor(() => expect(axios.post).toHaveBeenCalledWith(
    expect.stringMatching(/order\/claim/),
    expect.objectContaining({ claimToken: "a".repeat(64), password: "passw0rd!" }),
    expect.anything()
  ));
});
it("rejects passwords shorter than 8", () => {
  render(<Provider store={configureStore({ reducer: { user: userReducer } })}><ClaimForm claimToken="a".repeat(64)} /></Provider>);
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "short" } });
  fireEvent.click(screen.getByRole("button", { name: /save/i }));
  expect(screen.getByText(/at least 8/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Implement `ClaimForm.jsx`**

```jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import { PrimaryBtn, Field } from "../../design/primitives";

export default function ClaimForm({ claimToken }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) {
      setErr("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      const { data } = await axios.post(
        `/api/v1/order/claim`,
        { claimToken, password: pw },
        { withCredentials: true }
      );
      toast.success("Welcome! Your orders are now linked.");
      navigate("/orders");
    } catch (e) {
      setErr(e.response?.data?.message || "Could not save — try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} aria-label="Save your details">
      <h3>Save your details</h3>
      <Field
        label="Password"
        type="password"
        autoComplete="new-password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        required
        minLength={8}
      />
      {err && <p role="alert">{err}</p>}
      <PrimaryBtn type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save my details"}
      </PrimaryBtn>
    </form>
  );
}
```

- [ ] **Step 3: Mount on `Success.js`**

In `frontend/src/components/Checkout/Success.js`:

```jsx
import { useSearchParams } from "react-router-dom";
import ClaimForm from "./ClaimForm";

const [params] = useSearchParams();
const token = params.get("token");
// inside the existing JSX, below order summary:
{
  token && !user && <ClaimForm claimToken={token} />;
}
```

- [ ] **Step 4: Toast + verify**

Run: `npx jest src/components/Checkout/__tests__/ClaimForm.test.js`
Expected: PASS.

Manual: complete a guest checkout at localhost, watch success page show the form, set a password, ensure `/orders` shows the order (token consumed once).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Checkout/ClaimForm.jsx frontend/src/components/Checkout/__tests__/ClaimForm.test.js frontend/src/components/Checkout/Success.js
git commit -m "feat(checkout): one-click ClaimForm on success page"
```

---

## Task 11: E2E (Playwright) + full verification

**Files:**

- Create: `e2e/guestCheckout.spec.js`

- [ ] **Step 1: Add E2E spec**

```js
const { test, expect } = require("@playwright/test");

test("guest happy path places order + claim converts to user", async ({ page, request }) => {
  await page.goto("/");
  // Assume seed has a product and cart is empty — add to cart through API or UI
  await page.goto("/products");
  await page
    .getByRole("button", { name: /add to cart/i })
    .first()
    .click();
  await page.goto("/cart");
  await page.getByRole("link", { name: /checkout/i }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  await page.getByRole("button", { name: /continue as guest/i }).click();
  await page.getByLabel(/email/i).fill(`g_${Date.now()}@example.com`);
  await page.getByLabel(/full name/i).fill("Guest Buyer");
  await page.getByLabel(/address line 1/i).fill("1 Test St");
  await page.getByLabel(/city/i).fill("Testville");
  await page.getByLabel(/state/i).fill("TS");
  await page.getByLabel(/postal|zip/i).fill("12345");
  await page.getByLabel(/country/i).selectOption("US");
  await page.getByLabel(/phone/i).fill("4155551234");
  await page.getByPlaceholder(/card/i).fill("4242424242424242");
  await page.getByPlaceholder(/exp/i).fill("12/30");
  await page.getByPlaceholder(/cvc/i).fill("123");
  await page.getByRole("button", { name: /place order/i }).click();

  await expect(page).toHaveURL(/\/success/);
  const url = page.url();
  const token = new URL(url).searchParams.get("token");
  expect(token).toMatch(/^[0-9a-f]{64}$/);

  await page.getByLabel(/password/i).fill("passw0rd!");
  await page.getByRole("button", { name: /save my details/i }).click();
  await expect(page).toHaveURL(/\/(orders|myorders)/);

  // Verify cookie via API
  const ctx = page.context();
  const cookies = await ctx.cookies();
  expect(cookies.find((c) => c.name === "token")).toBeDefined();

  // Verify order shows in /orders
  await page.goto("/orders");
  await expect(page.getByText(/1 test st|Testville|TS/).first()).toBeVisible();
});

test("auth user skips guest CTA + email pre-filled", async ({ page }) => {
  await page.goto("/signin");
  await page.getByLabel(/email/i).fill(process.env.E2E_USER_EMAIL || "user@e2e.io");
  await page.getByLabel(/password/i).fill(process.env.E2E_USER_PW || "passw0rd!");
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.goto("/cart");
  await page.getByRole("link", { name: /checkout/i }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole("button", { name: /continue as guest/i })).toBeHidden();
  await expect(page.getByLabel(/email/i)).not.toHaveValue("");
});
```

- [ ] **Step 2: Run E2E locally**

Run: `npm run e2e -- e2e/guestCheckout.spec.js`
Expected: 2/2 pass (against a local dev server; ensure Stripe test mode + `e2eServer.js` is up per prior phases).

- [ ] **Step 3: Run full backend suite**

Run: `cd backend && npx jest --silent`
Expected: previous 210 + ~12 new tests = 222+ pass.

- [ ] **Step 4: Run full frontend suite**

Run: `cd frontend && npx jest --silent`
Expected: previous 14 + ~16 new tests = 30+ pass.

- [ ] **Step 5: Frontend build**

Run: `cd frontend && npm run build`
Expected: `Compiled successfully`, no warnings (existing constraint from CLAUDE.md global lint gate — none introduced).

- [ ] **Step 6: Smoke via dev server**

Run `npm start --prefix frontend` → open `http://localhost:3000/cart` → click Checkout → page renders 4 blocks, draft persists after reload. Verify:

- 0 console errors
- 0 network 4xx/5xx
- Sticky CTA visible at 375px
- /success?token=… mounts ClaimForm; setting a password clears the token

- [ ] **Step 7: Final commit**

```bash
git add e2e/guestCheckout.spec.js
git commit -m "test(e2e): guest checkout happy path + auth prefill variant"
```

---

## Acceptance Verification (re-stated)

- [ ] Unauth user reaches `/checkout` from `/cart` with no `/login` redirect.
- [ ] Guest CTA is the visually dominant CTA on the Contact block when logged out.
- [ ] Guest order placement returns a 64-hex claim token.
- [ ] Claim form on success page converts guest → user in one POST, links prior orders by email.
- [ ] Replayed token returns 400 ALREADY_CLAIMED.
- [ ] Sticky CTA visible at 375px with running total.
- [ ] No inputs labeled `company`, `birthdate`, `secondary phone`, `fax`.
- [ ] New-file coverage: backend `claimService` 100% lines; frontend `Checkout/*` ≥80% lines; `checkoutSlice` 100% lines.
- [ ] No regressions in baseline 224-test suite.
- [ ] `npm run build` green.
- [ ] `npm start` + chrome-devtools: 0 console errors, 0 client 4xx/5xx on `/cart → /checkout → /success`.

## What's deliberately deferred (no task exists)

- Address book / saved cards — `/account` already handles saved info if/when added; not blocking.
- Cron-based order merge for guests who signup via /signup flow later — `claim` endpoint covers the post-purchase path; cron can be added without breaking this surface.
- Email-based magic-link signup — out of scope per spec §3.
