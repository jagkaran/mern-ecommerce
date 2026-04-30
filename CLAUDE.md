# MERN E-Commerce - Claude Code Guide

This document provides context and guidance for Claude Code to work effectively with this MERN E-Commerce codebase.

## Project Overview

A full-stack e-commerce platform built with MongoDB, Express, React, and Node.js. The project includes a comprehensive SDLC agent system for automated code quality, security, and performance monitoring.

### Tech Stack

- **Frontend**: React 17, Redux Toolkit, Material UI, Tailwind CSS
- **Backend**: Node.js v20+, Express 4, Mongoose 8
- **Database**: MongoDB Atlas
- **Authentication**: JWT (httpOnly + secure + sameSite=strict cookie)
- **Storage**: Cloudinary
- **Payments**: Stripe
- **Testing**: Jest + Supertest + mongodb-memory-server (unit/integration), Playwright (E2E)
- **CI/CD**: GitHub Actions → Render

## Project Structure

```
mern-ecommerce/
├── agents/                    # SDLC agent system
│   ├── orchestrator.js        # Pipeline coordinator
│   ├── security-agent.js      # Security analysis
│   ├── test-agent.js          # Test suite management
│   ├── coverage-agent.js      # Coverage analysis
│   ├── critic-agent.js        # Code review
│   ├── readme-agent.js        # Documentation
│   ├── perf-agent.js          # Performance analysis
│   ├── quality-agent.js       # Code quality
│   └── dev-agent.js          # Code implementation
├── backend/                   # Express.js backend
│   ├── controllers/           # Business logic
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API endpoints
│   ├── middleware/           # Auth, error handling, validation, cache
│   ├── utils/                # Helpers (JWT, email, logger, transaction)
│   ├── config/               # Database configuration
│   └── __tests__/            # Jest tests
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── store/            # Redux store
│   │   └── utils/            # Frontend utilities
│   └── public/
├── docs/                      # Documentation
│   ├── sdlc/                 # SDLC agent system docs
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
- `POST /api/v1/payment/process` - Process payment (Stripe)
- `GET /api/v1/getstripeapikey` - Get Stripe publishable key

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

### Running SDLC Agents

```bash
# Run full pipeline
node agents/orchestrator.js

# Run selective agents
node agents/orchestrator.js --agents=security,test,critic

# Run individual agent
node agents/security-agent.js
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
- Use Tailwind CSS for styling
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
- xss-clean for XSS protection
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

## SDLC Agent System

The project includes a comprehensive SDLC agent system that can work independently or together:

### Agents

1. **security-agent** - Security analysis (npm audit, middleware checks, secret scan)
2. **dev-agent** - Code implementation (auto-patch known bugs)
3. **quality-agent** - Code quality (ESLint v9 + Prettier)
4. **test-agent** - Test suite (Jest + mongodb-memory-server)
5. **coverage-agent** - Coverage analysis (thresholds: 65% lines, 30% branches)
6. **perf-agent** - Performance analysis (anti-patterns, bottlenecks)
7. **critic-agent** - Code review (HTTP status codes, async patterns)
8. **readme-agent** - Documentation (auto-update README)

### Pipeline Flows

- **New Feature**: dev → test → coverage → security → critic → readme
- **Bug Fix**: dev → test → coverage → security → critic
- **Hotfix**: dev → test → security → critic

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
- `docs/sdlc/AGENTIC_SDLC_SYSTEM.md` - Complete SDLC system documentation
- `docs/sdlc/AGENT_SPECIFICATIONS.md` - Agent technical specifications
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

# SMTP (for password reset)
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

1. Run the SDLC agent pipeline before committing
2. Ensure all tests pass
3. Follow code conventions
4. Add tests for new features
5. Update documentation

## Getting Help

- Check documentation in `docs/`
- Review agent specifications in `docs/sdlc/`
- Check codebase analysis report in `docs/reports/`
- Review quick reference in `docs/guides/`

## Notes for Claude Code

- This project uses CommonJS (not ES modules)
- The backend uses Express 4.x
- Tests use in-memory MongoDB (no local database required)
- The SDLC agent system is a key feature - understand it before making changes
- All Cloudinary operations have error handling
- All order operations use transactions
- All stock updates use atomic operations
- Rate limiting is configured on multiple endpoints
- Caching is implemented for frequently accessed data
- Input validation is implemented on all endpoints
