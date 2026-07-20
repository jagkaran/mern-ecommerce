# 🛒 MERN E-Commerce

> Full-stack e-commerce platform built with MongoDB, Express, React and Node.js with enterprise-grade security, SDLC automation, and comprehensive testing.

![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📦 Tech Stack

| Layer    | Technology                                                                    |
| -------- | ----------------------------------------------------------------------------- |
| Frontend | React 18, Redux Toolkit, Material UI, Tailwind CSS, Vite, react-router v7    |
| Backend  | Node.js v20+, Express 4, Mongoose 8                                           |
| Database | MongoDB Atlas                                                                 |
| Auth     | JWT (httpOnly + secure + sameSite=strict cookie)                              |
| Storage  | Cloudinary                                                                    |
| Payments | Stripe                                                                        |
| Testing  | Jest + Supertest + mongodb-memory-server (BE), Vitest + RTL (FE), Playwright (E2E) |
| CI/CD    | GitHub Actions → Render                                                       |

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/jagkaran/mern-ecommerce.git
cd mern-ecommerce

# 2. Install all dependencies
npm install
npm install --prefix frontend

# 3. Configure environment
cp backend/config/config.env.example backend/config/config.env
# Fill in: DB_URI, JWT_SECRET, CLOUDINARY_*, STRIPE_API_KEY, SMTP_*

# 4. Run in development
npm run dev          # backend on :10000
npm start --prefix frontend  # frontend on :3000 (vite dev server, proxies /api → :10000)
```

---

## 📂 Project Structure

```
mern-ecommerce/
├── agents/              # SDLC agent system
│   ├── orchestrator.js  # Pipeline coordinator
│   ├── security-agent.js
│   ├── test-agent.js
│   ├── coverage-agent.js
│   ├── critic-agent.js
│   ├── readme-agent.js
│   ├── perf-agent.js
│   ├── quality-agent.js
│   └── dev-agent.js
├── backend/             # Express.js backend
│   ├── controllers/     # Business logic
│   ├── services/        # Service layer (storage, payment, order, coupon, email, …)
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth, error handling, validation, cache
│   ├── utils/           # Helpers (JWT, email, logger, transaction, pricing)
│   ├── config/          # Database configuration
│   └── __tests__/       # Jest tests
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── store/       # Redux store + RTK Query apiSlice
│   │   └── utils/       # Frontend utilities
│   └── public/
├── docs/                # Documentation
│   ├── sdlc/           # SDLC agent system docs
│   ├── reports/        # Analysis and implementation reports
│   └── guides/         # Quick reference and guides
├── e2e/                 # Playwright E2E tests
└── coverage/            # Coverage reports
```

---

## 🤖 SDLC Agent Pipeline

```bash
node agents/orchestrator.js                        # full pipeline
node agents/orchestrator.js --agents=security,test  # selective
```

| Agent    | Purpose                                              | Critical |
| -------- | ---------------------------------------------------- | -------- |
| security | npm audit, middleware checks, JWT flags, secret scan | ✅       |
| dev      | Auto-patch known bugs (idempotent, safe to re-run)   | ✅       |
| quality  | ESLint v9 flat config + Prettier                     | ⚠️       |
| test     | Jest + mongodb-memory-server (no real DB needed)     | ✅       |
| coverage | Line coverage threshold ≥65%                         | ⚠️       |
| perf     | Static scan for performance anti-patterns            | ⚠️       |
| critic   | Architecture & HTTP status code review               | ⚠️       |
| readme   | Regenerates this file                                | ⚠️       |

---

## 🔑 Key API Routes

### Authentication

| Method | Route                         | Description                         |
| ------ | ----------------------------- | ----------------------------------- |
| POST   | /api/v1/register              | Register user                       |
| POST   | /api/v1/login                 | Login (rate-limited: 20 req/15 min) |
| GET    | /api/v1/logout                | Logout                              |
| GET    | /api/v1/me                    | Get own profile                     |
| PUT    | /api/v1/password/update       | Change password                     |
| POST   | /api/v1/password/forgot       | Forgot password (email link)        |
| PUT    | /api/v1/password/reset/:token | Reset password                      |

### Products

| Method | Route                       | Description                                  |
| ------ | --------------------------- | -------------------------------------------- |
| GET    | /api/v1/products            | All products (paginated, filterable, cached) |
| GET    | /api/v1/products/categories | Get active categories (cached)               |
| GET    | /api/v1/product/:id         | Product detail (cached)                      |
| POST   | /api/v1/admin/product/new   | Create product (admin)                       |
| PUT    | /api/v1/admin/product/:id   | Update product (admin)                       |
| DELETE | /api/v1/admin/product/:id   | Delete product (admin)                       |
| PUT    | /api/v1/review              | Add/update review                            |
| GET    | /api/v1/reviews             | Get product reviews                          |
| DELETE | /api/v1/reviews             | Delete review                                |

### Orders

| Method | Route                   | Description                     |
| ------ | ----------------------- | ------------------------------- |
| POST   | /api/v1/order/new       | Create order (with transaction) |
| GET    | /api/v1/order/:id       | Order detail                    |
| GET    | /api/v1/orders/me       | My orders (paginated)           |
| GET    | /api/v1/admin/orders    | All orders (admin, paginated)   |
| PUT    | /api/v1/admin/order/:id | Update order status (admin)     |
| DELETE | /api/v1/admin/order/:id | Delete order (admin)            |

### Payments

| Method | Route                   | Description                |
| ------ | ----------------------- | -------------------------- |
| POST   | /api/v1/payment/process | Process payment (Stripe)   |
| GET    | /api/v1/getstripeapikey | Get Stripe publishable key |

### Users (Admin)

| Method | Route                  | Description               |
| ------ | ---------------------- | ------------------------- |
| GET    | /api/v1/admin/users    | Get all users (paginated) |
| GET    | /api/v1/admin/user/:id | Get single user           |
| PUT    | /api/v1/admin/user/:id | Update user role          |
| DELETE | /api/v1/admin/user/:id | Delete user               |

---

## 🛡️ Security Features

- Helmet HTTP headers with CSP whitelist
- CORS with origin whitelist (CLIENT_URL env var)
- Rate limiting on auth routes (20 req / 15 min)
- Rate limiting on product routes (100 req / 15 min)
- express-mongo-sanitize (NoSQL injection prevention)
- express-xss-sanitizer (XSS protection)
- JWT in httpOnly + secure + sameSite=strict cookie
- bcryptjs password hashing (salt rounds 10)
- SHA-256 hashed password reset tokens in DB
- CSRF token (axios `X-CSRF-Token` header, `csrf-csrf` double-submit cookie) — required in production
- Stripe webhook signature verification (raw body + `STRIPE_WEBHOOK_SECRET`)
- Payment amount computed server-side from authoritative DB prices (legacy `{ amount }` bodies rejected)
- Comprehensive input validation on all endpoints
- Secret scanning in CI

---

## 🧪 Tests

```bash
# Run backend Jest tests
npm test

# Run backend tests with coverage
npm test -- --coverage

# Run frontend Vitest tests
npm test --prefix frontend

# Run frontend tests in watch mode
npm test:watch --prefix frontend

# Build frontend (output → frontend/build/)
npm run build --prefix frontend

# Run E2E tests
npm run e2e

# Run E2E tests with UI
npm run e2e:ui

# Run E2E tests in CI
npm run e2e:ci
```

_Jest tests use an in-memory MongoDB — no local database required._

_Playwright E2E tests cover auth, products, cart, checkout, and admin flows._

---

## 📊 Coverage

Current coverage thresholds (enforced in CI):

- Statements: 65%
- Branches: 30%
- Functions: 40%
- Lines: 65%

Latest run (2026-06-05):

- Statements: **70.98%**
- Branches: **52.15%**
- Functions: **70.33%**
- Lines: **71.51%**

Target thresholds (next milestone):

- Statements: 80%
- Branches: 70%
- Functions: 75%
- Lines: 80%

---

## 🚀 Deployment

### Render

1. Connect GitHub repo to Render as a **Web Service**
2. Build: `npm install && npm install --prefix frontend && npm run build --prefix frontend`
3. Start: `node backend/server.js`
4. Set environment variables in Render dashboard:
   - `DB_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `COOKIE_EXPIRE`
   - `STRIPE_API_KEY`, `STRIPE_SECRET_KEY`
   - `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_EMAIL`, `SMTP_PASSWORD`
   - `CLIENT_URL` = your Render service URL
   - `NODE_ENV` = `production` (lowercase)

### Heroku

Similar to Render, use the included Procfile for deployment.

---

## 🔧 Environment Variables

Required environment variables:

```env
# Database
DB_URI=mongodb+srv://...

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
COOKIE_EXPIRE=7

# Node
NODE_ENV=production

# Frontend URL
CLIENT_URL=https://your-frontend-url.com

# Cloudinary
CLOUDINARY_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Stripe
STRIPE_API_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
# REQUIRED in production. Stripe webhook signature verification (raw body).
# Generate via Stripe Dashboard → Developers → Webhooks → Add endpoint.
STRIPE_WEBHOOK_SECRET=whsec_...

# CSRF — REQUIRED in production. Backend crashes at boot if missing in prod.
# Generate with: openssl rand -hex 32
CSRF_SECRET=

# SMTP (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SERVICE=gmail
SMTP_MAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

## 📚 Documentation

- [CLAUDE.md](CLAUDE.md) - Claude Code guide for this codebase
- [docs/sdlc/AGENTIC_SDLC_SYSTEM.md](docs/sdlc/AGENTIC_SDLC_SYSTEM.md) - Complete SDLC system documentation
- [docs/sdlc/AGENT_SPECIFICATIONS.md](docs/sdlc/AGENT_SPECIFICATIONS.md) - Agent technical specifications
- [docs/sdlc/SDLC_IMPLEMENTATION_ROADMAP.md](docs/sdlc/SDLC_IMPLEMENTATION_ROADMAP.md) - 12-week implementation roadmap
- [docs/reports/CODEBASE_ANALYSIS_REPORT.md](docs/reports/CODEBASE_ANALYSIS_REPORT.md) - Codebase analysis report
- [docs/guides/QUICK_REFERENCE.md](docs/guides/QUICK_REFERENCE.md) - Quick start guide

---

## ✨ Recent Improvements

### Architecture & Code Quality (2026-06-05)

- **SOLID refactor — Service Layer extraction**
  - New `StorageService` abstracts all Cloudinary operations (uploadImage, uploadMany, destroyImage, destroyMany, uploadAvatar, uploadProductImage, **uploadBuffer**)
  - New `EmailService` encapsulates email delivery (sendPasswordReset) behind an interface
  - Controllers (`userController.js`, `productController.js`) now depend on services, not infrastructure — DIP compliant
- **Aggregation helpers** (`backend/utils/aggregationHelpers.js`)
  - `recalculateRatings()` — pure function for review averaging (deduped from 2 controllers)
  - `productWithReviews()` — MongoDB pipeline for product + populated reviews
  - `reviewsWithUserInfo()` — pipeline for reviews with user details
  - 100% unit test coverage (7 tests)
- **Request logging middleware** (`backend/middleware/logger.js`) — structured JSON logs with sensitive-field redaction, request timing, async-context correlation IDs
- **uploadBuffer()** on StorageService — direct buffer uploads, no temp files

### CI/CD & Security Hardening

- **GitHub Actions matrix** — Node 18, 20, 22 (pin SHAs, cache keys include Node version)
- **Jobs**: lint → test (coverage gate) → secret-scan (gitleaks + truffleHog) → e2e (Playwright, headed=false, webServer auto-start)
- **Dependabot** weekly (npm + github-actions) with security-only labels
- **CODEOWNERS** — auto-assign security reviews for `backend/services/`, `backend/middleware/auth.js`, `.github/workflows/`
- **SECURITY.md** — vulnerability disclosure policy with 90-day coordinated disclosure
- **.gitleaks.toml** — tailored ruleset (allow-list test fixtures, deny real secrets)

### Performance

- Added database indexes for frequently queried fields
- Optimized product listing queries with parallel execution
- Implemented in-memory caching for frequently accessed data
- Added query projection and lean queries for better performance

### Security

- Fixed race conditions in stock updates using atomic operations
- Added transaction support to order creation
- Implemented comprehensive input validation on all endpoints
- Added rate limiting to product endpoints

### Code Quality

- Added proper error handling to Cloudinary operations
- Fixed missing null checks in controllers
- Implemented transaction utilities for data consistency
- Added comprehensive validation middleware

### Testing

- Enhanced test coverage with mongodb-memory-server
- Added E2E tests with Playwright
- Implemented automated SDLC agent pipeline
- Jest tests: 133 passing | Coverage gate: statements 70.98% | branches 52.15% | functions 70.33% | lines 71.51%

---

## 🐛 Troubleshooting

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

### Package Installation Issues

If you encounter permission issues with npm:

```bash
sudo chown -R $(whoami) ~/.npm
npm install
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Run the SDLC agent pipeline (`node agents/orchestrator.js`)
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

### Development Guidelines

- Run the SDLC agent pipeline before committing
- Ensure all tests pass
- Follow code conventions
- Add tests for new features
- Update documentation

---

## 📝 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Built with MERN stack
- UI components from Material UI
- Icons from various sources
- Testing with Jest and Playwright

---

_Generated by readme-agent v1.0.0 — 2026-06-05_
