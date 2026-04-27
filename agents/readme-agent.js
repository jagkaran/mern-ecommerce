#!/usr/bin/env node
/**
 * README Agent -- mern-ecommerce
 * Auto-generates / updates README.md with project overview,
 * setup instructions, API reference, and agent pipeline docs.
 */
"use strict";
const fs   = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const today = new Date().toISOString().split("T")[0];

const readme = `# \u{1F6D2} MERN E-Commerce

> Full-stack e-commerce platform built with MongoDB, Express, React and Node.js.
> Enterprise-grade security, SDLC automation, form validation, and Playwright E2E tests.

![CI](https://github.com/jagkaran/mern-ecommerce/actions/workflows/ci.yml/badge.svg)

---

## \u{1F4E6} Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 17, Redux Toolkit, Material UI |
| Backend    | Node.js ${process.version}, Express 4, Mongoose 8 |
| Database   | MongoDB Atlas |
| Auth       | JWT (httpOnly + secure + sameSite=strict cookie) |
| Storage    | Cloudinary |
| Payments   | Stripe |
| Testing    | Jest + Supertest + mongodb-memory-server (unit/integration) |
| E2E        | Playwright (Chromium) |
| CI/CD      | GitHub Actions \u2192 Render |

---

## \u{1F680} Quick Start

\`\`\`bash
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
npm run dev                        # backend on :4000
npm start --prefix frontend        # frontend on :3000
\`\`\`

---

## \u{1F916} SDLC Agent Pipeline

\`\`\`bash
node agents/orchestrator.js                          # full pipeline
node agents/orchestrator.js --agents=security,test   # selective
\`\`\`

| Agent    | Purpose                                               | Blocking |
|----------|-------------------------------------------------------|----------|
| security | npm audit, middleware checks, JWT flags, secret scan  | \u2705 |
| dev      | Auto-patch known bugs (idempotent, safe to re-run)    | \u2705 |
| quality  | ESLint v9 flat config + Prettier                      | \u2705 |
| test     | Jest + mongodb-memory-server (no real DB needed)      | \u2705 |
| coverage | Line coverage threshold \u2265 50%                         | \u26A0\uFE0F |
| perf     | Static scan for performance anti-patterns             | \u26A0\uFE0F |
| critic   | Architecture & HTTP status code review                | \u26A0\uFE0F |
| readme   | Regenerates this file                                 | \u26A0\uFE0F |

---

## \u{1F511} Key API Routes

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/v1/register | Register user |
| POST | /api/v1/login | Login (rate-limited: 20 req/15 min) |
| GET  | /api/v1/logout | Logout |
| GET  | /api/v1/me | Get own profile |
| PUT  | /api/v1/password/update | Change password |
| POST | /api/v1/password/forgot | Forgot password (email link) |
| PUT  | /api/v1/password/reset/:token | Reset password |

### Products
| Method | Route | Description |
|--------|-------|-------------|
| GET  | /api/v1/products | All products (paginated, filterable) |
| GET  | /api/v1/product/:id | Product detail |
| POST | /api/v1/admin/product/new | Create product (admin) |
| PUT  | /api/v1/admin/product/:id | Update product (admin) |
| DELETE | /api/v1/admin/product/:id | Delete product (admin) |
| PUT  | /api/v1/review | Add/update review |

### Orders
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/v1/order/new | Create order |
| GET  | /api/v1/order/:id | Order detail |
| GET  | /api/v1/orders/me | My orders |
| GET  | /api/v1/admin/orders | All orders (admin) |
| PUT  | /api/v1/admin/order/:id | Update order status (admin) |

---

## \u{1F6E1}\uFE0F Security Features

- Helmet HTTP headers (with Stripe CSP whitelist)
- CORS with origin whitelist (CLIENT_URL env var)
- Rate limiting on auth routes (20 req / 15 min)
- express-mongo-sanitize (NoSQL injection prevention)
- xss-clean (XSS protection)
- JWT in httpOnly + secure + sameSite=strict cookie
- bcryptjs password hashing (salt rounds 10)
- SHA-256 hashed password reset tokens in DB

---

## \u{1F9EA} Tests

\`\`\`bash
npm test                     # run all Jest tests
npm test -- --coverage       # with coverage report
npx playwright test          # run E2E tests
npx playwright test --ui     # Playwright interactive mode
\`\`\`

*Jest tests use an in-memory MongoDB \u2014 no local database required.*

---

## \u{1F6A2} Deployment (Render)

1. Connect GitHub repo to Render as a **Web Service**
2. Build: \`npm install && npm install --prefix frontend && npm run build --prefix frontend\`
3. Start: \`node backend/server.js\`
4. Set environment variables in Render dashboard (never in render.yaml):
   - \`DB_URI\`, \`JWT_SECRET\`, \`JWT_EXPIRE\`, \`COOKIE_EXPIRE\`
   - \`STRIPE_API_KEY\`, \`STRIPE_SECRET_KEY\`
   - \`CLOUDINARY_NAME\`, \`CLOUDINARY_API_KEY\`, \`CLOUDINARY_API_SECRET\`
   - \`SMTP_HOST\`, \`SMTP_PORT\`, \`SMTP_EMAIL\`, \`SMTP_PASSWORD\`
   - \`CLIENT_URL\` = your Render service URL
   - \`NODE_ENV\` = \`production\` (lowercase \u2014 required by Express)

---

## \u2705 Recent Fixes

- \`render.yaml\`: NODE_ENV corrected to \`production\` (lowercase) \u2014 fixes Express static serving & secure cookie
- \`jwtToken.js\`: \`secure\` flag now checks \`=== "production"\` (lowercase)
- ProductDetailsV2 routing fix (replaced dead ProductDetails component)
- Review card \`createdAt\` date display corrected (two-effect pattern)
- Shared \`validators.js\` for consistent validation across all pages
- Shipping form: inline field validation (firstName, lastName, address, phone, zip, city, country)
- Playwright E2E test suite added (auth, products, cart, checkout, admin flows)

---

*Generated by readme-agent v${pkg.version} \u2014 ${today}*
`;

const readmePath = path.join(ROOT, "README.md");
fs.writeFileSync(readmePath, readme, "utf8");
console.log("\n\uD83D\uDCDD  [readme-agent] README.md updated successfully.\n");
