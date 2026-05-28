"use strict";
/**
 * Unit tests for backend/middleware/cache.js
 * Tests the in-memory NodeCache wrapper directly (no HTTP layer needed).
 */
const {
  cache: cacheMiddleware,
  invalidateCache,
  invalidatePattern,
  clearAll,
  getStats,
  get,
  set,
  del,
} = require("../middleware/cache");

// ─── helpers ────────────────────────────────────────────────────────────────

/** Build a minimal Express-style req/res/next triple */
function makeCtx(overrides = {}) {
  const captured = {};
  const req = { method: "GET", originalUrl: "/api/v1/products", ...overrides };
  const res = {
    json: jest.fn((body) => { captured.body = body; return res; }),
  };
  const next = jest.fn();
  return { req, res, next, captured };
}

// ─── setup / teardown ───────────────────────────────────────────────────────

beforeEach(() => clearAll());

// ─── get / set / del ────────────────────────────────────────────────────────

describe("low-level get/set/del", () => {
  it("set then get returns the stored value", () => {
    set("mykey", { data: 42 }, 60);
    expect(get("mykey")).toEqual({ data: 42 });
  });

  it("del removes the key", () => {
    set("delkey", "hello", 60);
    del("delkey");
    expect(get("delkey")).toBeUndefined();
  });

  it("get returns undefined for unknown key", () => {
    expect(get("ghost")).toBeUndefined();
  });
});

// ─── getStats ───────────────────────────────────────────────────────────────

describe("getStats", () => {
  it("returns keys count of 0 after clearAll", () => {
    const stats = getStats();
    expect(stats.keys).toBe(0);
    expect(stats.stats).toBeDefined();
  });

  it("increments keys count when items are added", () => {
    set("k1", 1, 60);
    set("k2", 2, 60);
    expect(getStats().keys).toBe(2);
  });
});

// ─── cache middleware ────────────────────────────────────────────────────────

describe("cache() middleware", () => {
  it("cache MISS: calls next() and wraps res.json to store response", () => {
    const { req, res, next } = makeCtx();
    const mw = cacheMiddleware(60);
    mw(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    // Simulate the controller calling res.json
    res.json({ success: true, products: [] });
    // Key should now be in cache
    expect(get("cache:/api/v1/products")).toEqual({ success: true, products: [] });
  });

  it("cache HIT: returns cached data without calling next()", () => {
    set("cache:/api/v1/products", { success: true, cached: true }, 60);
    const { req, res, next } = makeCtx();
    const mw = cacheMiddleware(60);
    mw(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, cached: true });
  });

  it("non-GET request bypasses cache and calls next()", () => {
    const { req, res, next } = makeCtx({ method: "POST" });
    const mw = cacheMiddleware(60);
    mw(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    // POST should NOT wrap res.json — calling it shouldn't cache anything
    res.json({ ok: true });
    expect(get("cache:/api/v1/products")).toBeUndefined();
  });

  it("different URLs get separate cache entries", () => {
    const mw = cacheMiddleware(60);
    const ctx1 = makeCtx({ originalUrl: "/api/v1/products?page=1" });
    const ctx2 = makeCtx({ originalUrl: "/api/v1/products?page=2" });

    mw(ctx1.req, ctx1.res, ctx1.next);
    ctx1.res.json({ page: 1 });

    mw(ctx2.req, ctx2.res, ctx2.next);
    ctx2.res.json({ page: 2 });

    expect(get("cache:/api/v1/products?page=1")).toEqual({ page: 1 });
    expect(get("cache:/api/v1/products?page=2")).toEqual({ page: 2 });
  });
});

// ─── invalidateCache ─────────────────────────────────────────────────────────

describe("invalidateCache() middleware", () => {
  it("removes all keys matching the pattern after res.json is called", () => {
    set("cache:/api/v1/products",        { a: 1 }, 60);
    set("cache:/api/v1/products?page=2", { b: 2 }, 60);
    set("cache:/api/v1/orders",          { c: 3 }, 60);

    const { req, res, next } = makeCtx({ method: "POST" });
    const mw = invalidateCache("product");
    mw(req, res, next);
    // Simulate controller response — triggers the wrapped res.json
    res.json({ success: true });

    expect(get("cache:/api/v1/products")).toBeUndefined();
    expect(get("cache:/api/v1/products?page=2")).toBeUndefined();
    // Orders cache must be untouched
    expect(get("cache:/api/v1/orders")).toEqual({ c: 3 });
  });
});

// ─── invalidatePattern ───────────────────────────────────────────────────────

describe("invalidatePattern() middleware", () => {
  it("clears matching keys immediately (before res.json) and calls next()", () => {
    set("cache:/api/v1/products",   { a: 1 }, 60);
    set("cache:/api/v1/orders",     { b: 2 }, 60);

    const { req, res, next } = makeCtx();
    const mw = invalidatePattern("product");
    mw(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(get("cache:/api/v1/products")).toBeUndefined();
    expect(get("cache:/api/v1/orders")).toEqual({ b: 2 });
  });
});

// ─── clearAll ────────────────────────────────────────────────────────────────

describe("clearAll", () => {
  it("removes every key from the cache", () => {
    set("k1", 1, 60); set("k2", 2, 60); set("k3", 3, 60);
    expect(getStats().keys).toBe(3);
    clearAll();
    expect(getStats().keys).toBe(0);
  });
});
