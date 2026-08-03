# MERN E-Commerce - Claude Code Guide

This document provides context and guidance for Claude Code to work effectively with this MERN E-Commerce codebase.

## Project Overview

A full-stack e-commerce platform built with MongoDB, Express, React, and Node.js. Code quality, security, and performance checks run through GitHub Actions CI + pre-commit hooks.

### Tech Stack

- **Frontend**: React 18, Redux Toolkit 2, Material UI 6, Tailwind CSS v4, RR v7 (data router), Vite 8
- **Frontend UX**: Lenis (smooth scroll, ~10KB gz), motion ^12 (formerly framer-motion, ~50KB gz)
- **Backend**: Node.js v20+, Express 4, Mongoose 8
- **Database**: MongoDB Atlas
- **Authentication**: JWT (httpOnly + secure + sameSite=strict cookie)
- **Storage**: Cloudinary
- **Payments**: Stripe
- **Testing**: Jest + Supertest + mongodb-memory-server (backend), Vitest + RTL + jsdom (frontend), Playwright (E2E)
- **CI/CD**: GitHub Actions → Render

## Project Structure

```
mern-ecommerce/
├── backend/                   # Express.js backend
│   ├── controllers/           # Business logic
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API endpoints
│   ├── middleware/           # Auth, error handling, validation, cache
│   ├── utils/                # Helpers (JWT, email, logger, transaction)
│   ├── config/               # Database configuration
│   └── __tests__/            # Jest tests
├── frontend/                  # React frontend (Vite + plain src/, no pages/ dir)
│   ├── src/
│   │   ├── components/       # All React components (page components live under
│   │   │                     #   components/ in role-named subdirs, e.g. Product/PDP/)
│   │   ├── design/           # Design tokens + primitives (Section, Container,
│   │   │                     #   Grid, Button, Disclosure, MotionDisclosure, etc.)
│   │   ├── hooks/            # useToast, useWishlist, useCurrency, useCsrfToken
│   │   ├── actions/          # Redux Toolkit thunks
│   │   ├── reducers/         # Redux slices (User, Cart, Product, Order, etc.)
│   │   ├── store/            # Redux store config
│   │   └── utils/            # Frontend utilities (lenis, debounce, contexts)
│   ├── public/
│   └── index.html            # Includes preconnect to fonts + Cloudinary
├── docs/                      # Documentation
│   ├── reports/              # Analysis and implementation reports
│   └── guides/               # Quick reference and guides
├── e2e/                       # Playwright E2E tests
└── coverage/                  # Coverage reports
```

## Key API Endpoints

### Authentication
- `POST /api/v1/register` - User registration
- `POST /api/v1/login` - User login (rate-limited: 20 req/15 min)
- `GET /api/v1/logout` - User logout
- `GET /api/v1/me` - Get current user profile
- `PUT /api/v1/password/update` - Update password
- `POST /api/v1/password/forgot` - Forgot password
- `PUT /api/v1/password/reset/:token` - Reset password

### Products
- `GET /api/v1/products` - List products (paginated, cached)
- `GET /api/v1/products/categories` - Get active categories (cached)
- `GET /api/v1/product/:id` - Get product details (cached)
- `POST /api/v1/admin/product/new` - Create product (admin)
- `PUT /api/v1/admin/product/:id` - Update product (admin)
- `DELETE /api/v1/admin/product/:id` - Delete product (admin)
- `PUT /api/v1/review` - Add/update review

### Orders
- `POST /api/v1/order/new` - Create order (with transaction)
- `GET /api/v1/order/:id` - Get order details
- `GET /api/v1/orders/me` - Get user's orders (paginated)
- `GET /api/v1/admin/orders` - Get all orders (admin, paginated)
- `PUT /api/v1/admin/order/:id` - Update order status (admin)
- `DELETE /api/v1/admin/order/:id` - Delete order (admin)

### Payments
- `POST /api/v1/payment/process` - Process payment (Stripe). Body is `{ orderItems: [{ product, quantity }] }` — amount is computed server-side from authoritative DB prices. Legacy bodies of `{ amount }` are rejected with 400.
- `GET /api/v1/getstripeapikey` - Get Stripe publishable key
- `POST /api/v1/payment/webhook` - Stripe webhook (HMAC-signed raw body; signature verification enforced).

## Development Workflow

### Running the Application

```bash
# Install dependencies
npm install
npm install --prefix frontend

# Run backend (development)
npm run dev          # backend on :4000

# Run frontend (development)
npm start --prefix frontend  # frontend on :3000
```

### Running Tests

```bash
# Run all Jest tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run E2E tests
npm run e2e

# Run E2E tests with UI
npm run e2e:ui
```

## Code Conventions

### Backend

- Use `catchAsyncErrors` wrapper for all route handlers
- Use `ErrorHandler` for error responses
- Use `logger` for logging (not `console.log`)
- Use `withTransaction` for multi-document operations
- Use atomic operations (`$inc`) for counter updates
- Always validate input using validation middleware
- Always check for null after `findById`
- Use `lean()` for read-only queries
- Use `select()` to limit returned fields

### Frontend

- Use Redux Toolkit for state management
- Use Material UI components
- Use Tailwind CSS for styling (v4 — `@theme` directive in CSS, no `tailwind.config.js`)
- Use design tokens (`design/tokens.js` + `tokens-css.jsx` for CSS vars) — colors, typography, motion durations/easings
- Use design primitives (`design/primitives/`) — Container, Section, Grid, Headline, BodyText, Overline, PrimaryBtn/SecondaryBtn/GhostBtn, Disclosure, MotionDisclosure, Tile, Surface, Badge, QtyStepper, Reveal, etc.
- Use Lenis hooks (`utils/lenis.js`) for all scroll behavior — never `window.scrollTo` directly
- Use motion (`motion/react`) for animation — never CSS keyframes for component entry/exit
- New overlays/dialogs/drawers: wrap with `useLenisStop(open)` to pause page scroll during open
- All overlays need `aria-label` on the paper/container
- Mini-cart and search overlay: open via context (`useMiniCart`, `useSearchOverlay`), not local state passed through props
- Redux cart state is the source of truth — `MiniCartDrawer` and `ProductCard` both read/write it; no duplicate state
- Mobile filter UI uses plain `Drawer` (not `SwipeableDrawer`) — swipe variant intercepts touch events and blocks scrollable body
- Follow React best practices

### Database

- All models have indexes for frequently queried fields
- Use transactions for order creation
- Use atomic operations for stock updates
- Always validate stock before creating orders

## Security Best Practices

- JWT tokens are httpOnly + secure + sameSite=strict
- All user inputs are validated and sanitized
- Rate limiting on auth endpoints (20 req/15 min)
- Rate limiting on product endpoints (100 req/15 min)
- express-mongo-sanitize for NoSQL injection prevention
- express-xss-sanitizer for XSS protection
- Helmet for security headers
- CORS with origin whitelist

## Common Patterns

### Error Handling

```javascript
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");

exports.myFunction = catchAsyncErrors(async (req, res, next) => {
  try {
    // Your code here
  } catch (error) {
    return next(new ErrorHandler("Error message", 400));
  }
});
```

### Database Operations with Transactions

```javascript
const { withTransaction } = require("../utils/transaction");

exports.createOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await withTransaction(async (session) => {
    // Create order
    const newOrder = await Order.create([...], { session });
    // Update stock
    await Product.findByIdAndUpdate(id, { $inc: { stock: -quantity } }, { session });
    return newOrder;
  });
  res.status(201).json({ success: true, order });
});
```

### Atomic Stock Updates

```javascript
async function updateStock(id, quantity) {
  const result = await Product.findByIdAndUpdate(
    id,
    { $inc: { stock: -quantity } },
    { new: true, runValidators: true }
  );
  if (!result || result.stock < 0) {
    throw new ErrorHandler("Insufficient stock", 400);
  }
}
```

### Optimized Queries

```javascript
// Use lean() and select() for better performance
const products = await Product.find()
  .select('name price ratings images')
  .lean()
  .skip(skip)
  .limit(limit)
  .sort({ createdAt: -1 });
```

## Testing

### Unit/Integration Tests

- Use `mongodb-memory-server` for in-memory MongoDB
- Mock external services (Stripe, Cloudinary, email)
- Tests are in `backend/__tests__/`
- Run with `npm test`

### E2E Tests

- Use Playwright for E2E testing
- Tests are in `e2e/`
- Run with `npm run e2e`

### Coverage

- Current thresholds: statements 65%, branches 30%, functions 40%, lines 65%
- Target thresholds: statements 80%, branches 70%, functions 75%, lines 80%

## Important Files

### Configuration
- `package.json` - Dependencies and scripts
- `eslint.config.js` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `playwright.config.js` - Playwright configuration
- `render.yaml` - Render deployment configuration
- `Procfile` - Heroku deployment configuration

### Backend
- `backend/app.js` - Express app configuration
- `backend/server.js` - Server entry point
- `backend/middleware/auth.js` - Authentication middleware
- `backend/middleware/error.js` - Error handling middleware
- `backend/middleware/validation.js` - Input validation
- `backend/middleware/cache.js` - Caching middleware
- `backend/utils/jwtToken.js` - JWT token utilities
- `backend/utils/logger.js` - Winston logger
- `backend/utils/transaction.js` - Transaction utilities

### Documentation
- `docs/reports/CODEBASE_ANALYSIS_REPORT.md` - Codebase analysis report
- `docs/guides/QUICK_REFERENCE.md` - Quick start guide

## Environment Variables

Required environment variables (in `backend/config/config.env`):

```env
DB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
COOKIE_EXPIRE=7
NODE_ENV=production
CLIENT_URL=https://your-frontend-url.com

# Cloudinary
CLOUDINARY_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Stripe
STRIPE_API_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
# REQUIRED in production. Used by /api/v1/payment/webhook to verify the
# stripe-signature header against the raw request body. Without this every
# webhook call returns 401 and order paidAt never gets set.
STRIPE_WEBHOOK_SECRET=whsec_...

# CSRF — REQUIRED in production. Backend crashes at boot if missing in prod.
# Generate with: openssl rand -hex 32
# The frontend fetches GET /api/v1/csrf-token on app mount; axios attaches the
# token as X-CSRF-Token on POST/PUT/DELETE/PATCH. Without this, every mutation
# is 403'd in production.
CSRF_SECRET=

# SMTP (for password reset — current SMTP path uses OAuth refresh tokens only;
# this block is for legacy app-password fallback, NOT used by sendEmail.js)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SERVICE=gmail
SMTP_MAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## Deployment

### Render

1. Connect GitHub repo to Render as a Web Service
2. Build: `npm install && npm install --prefix frontend && npm run build --prefix frontend`
3. Start: `node backend/server.js`
4. Set environment variables in Render dashboard

### Heroku

Similar to Render, use the Procfile for deployment.

## Common Issues

### MongoDB Connection Issues
- Ensure `DB_URI` is correctly set
- Check IP whitelist in MongoDB Atlas
- Verify connection string format

### Cloudinary Upload Issues
- Ensure API credentials are correct
- Check folder permissions
- Verify image format and size

### Test Failures
- Ensure `mongodb-memory-server` is installed
- Check that all mocks are properly configured
- Verify test environment variables

### Rate Limiting Issues
- Adjust rate limits in `backend/app.js`
- Check `trust proxy` setting
- Verify client IP forwarding

## Performance Optimization

### Database Indexes
All models have indexes for frequently queried fields:
- User: email (unique), createdAt
- Product: category, createdAt, full-text search, ratings, price
- Order: user, createdAt, orderStatus, compound (user + createdAt)

### Caching
- Product listings: 5 minutes
- Product details: 5 minutes
- Categories: 10 minutes
- Cache is invalidated on product modifications

### Query Optimization
- Use `lean()` for read-only queries
- Use `select()` to limit returned fields
- Use parallel queries with `Promise.all()`
- Use efficient pagination

## Contributing

1. Ensure all tests pass
3. Follow code conventions
4. Add tests for new features
5. Update documentation

## Getting Help

- Check documentation in `docs/`
- Check codebase analysis report in `docs/reports/`
- Review quick reference in `docs/guides/`

## Notes for Claude Code

- This project uses CommonJS (not ES modules)
- The backend uses Express 4.x
- Tests use in-memory MongoDB (no local database required)
- CI workflows (`.github/workflows/ci.yml`) and pre-commit hooks enforce quality gates
- All Cloudinary operations have error handling
- All order operations use transactions
- All stock updates use atomic operations
- Rate limiting is configured on multiple endpoints
- Caching is implemented for frequently accessed data
- Input validation is implemented on all endpoints

## UX Features Shipped (2026-07-30 → 2026-08-03)

### Smooth scroll UX (Lenis)
- App-wide smooth scroll via `<ReactLenis root>` in `App.jsx` RootLayout
- 1.2s exponential easing, `lerp: 0` under `prefers-reduced-motion`
- Page scroll resets to top on every route change (`useScrollResetOnRouteChange`)
- Lenis pauses while any overlay is open (`useLenisStop`, used by all dialogs/drawers)
- Anchor links (`useScrollToAnchor`) account for sticky header height (+ CheckoutPage uses `-126` for sticky stepper)

### Drawers / overlays
- `MiniCartDrawer` — opens from header cart icon (desktop + mobile drawer) and on add-to-cart from PLP/PDP/QuickView
- `SearchOverlay` — fullscreen overlay, 250ms debounced typeahead against `/api/v1/products?keyword=`, top 6 results
- Mobile PLP filter drawer — bottom-sheet, plain `Drawer` (NOT `SwipeableDrawer` — touch-event interception blocks scroll)
- `ScrollTopButton` — fading Fab at bottom-right past 600px; `ScrollProgress` — 2px top bar driven by `lenis.progress`

### Animations (motion)
- Hero — 5-element staggered entry on mount
- CategoryGrid + ProductSection — `whileInView` stagger via `staggerChildren` + child variants
- `MotionDisclosure` primitive — drop-in for `Disclosure` with `AnimatePresence` height animation; used on PDP for Materials/Care/Shipping
- `motion` auto-honors `prefers-reduced-motion`

### Loading / skeleton
- PDP — full skeleton layout mirroring image/info columns (no CLS)
- PLP — 8-card grid skeleton + filter rail skeleton

### A11y
- All overlay `paper` props carry `aria-label`
- Filter button: descriptive text content
- Dialog/drawer focus handled by MUI `Modal` (no manual focus trap needed)
- `ScrollProgress` is `aria-hidden`; `ScrollToTopButton` toggles `tabIndex` based on visibility

### Behavioral fixes
- `ProductCard` add-to-cart: now reads existing qty and dispatches `existingQty + 1` (previously always sent `1`, so repeat clicks overwrote instead of incrementing)
- `CheckoutPage` step scroll: `scrollIntoView` → `useScrollToAnchor(-126)` (Lenis + stepper offset)
- `lenis/react` `root="asChild"` is WRONG — `root={true}` (bare boolean) is the no-wrapper variant (docs/source mismatch)

### E2E coverage
- `e2e/newFeatures.spec.js` — covers mini-cart, scroll-to-top, scroll progress, PDP jump pills, mobile filter drawer, loading skeletons

### Frontend hooks inventory (utils/)
- `lenis.js` — `useLenisOptions`, `useLenisStop`, `useScrollResetOnRouteChange`, `useScrollToAnchor`
- `useDebounce.js` — generic debounce
- `miniCartContext.jsx` — `useMiniCart`, `MiniCartProvider`
- `searchOverlayContext.jsx` — `useSearchOverlay`, `SearchOverlayProvider`

### Performance
- Cloudinary preconnect in `index.html`
- All below-fold images have `loading="lazy"`; PDP main image is `loading="eager"` (intentional)
- Routes lazy-loaded via RR v7 `lazy:`; admin Chart.js bundle is its own chunk
