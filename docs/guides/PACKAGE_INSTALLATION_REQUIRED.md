# 📦 Package Installation Required

## Missing Dependencies

The following package needs to be installed for the caching functionality:

```bash
npm install node-cache --save
```

If you encounter permission issues, run:

```bash
sudo chown -R $(whoami) ~/.npm
npm install node-cache --save
```

## Why node-cache?

- Simple in-memory caching
- No external dependencies
- Fast and lightweight
- Perfect for API response caching
- Automatic expiration
- Easy to use

## Usage

The cache middleware is already implemented in:
- `backend/middleware/cache.js`

And integrated into:
- `backend/routes/productRoute.js`

## Cache Configuration

Default TTL: 10 minutes (600 seconds)

Cache durations by endpoint:
- `/api/v1/products`: 5 minutes (300 seconds)
- `/api/v1/products/categories`: 10 minutes (600 seconds)
- `/api/v1/product/:id`: 5 minutes (300 seconds)

## Cache Invalidation

Cache is automatically invalidated when:
- Product is created
- Product is updated
- Product is deleted
- Product review is added/updated/deleted
