/**
 * Tests for backend/services/httpClient.js
 * All outbound HTTP is mocked — no network required in CI.
 */

const { getJson } = require("../services/httpClient");
const cache = require("../middleware/cache");
const logger = require("../utils/logger");

// ── Helpers ──────────────────────────────────────────────────────────
const TEST_URL = "https://example.com/api/data";
const CACHE_KEY = "test:httpClient";

let originalFetch;

beforeAll(() => {
  originalFetch = global.fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

beforeEach(() => {
  // Reset fetch mock before each test
  global.fetch = jest.fn();
  // Clear cache entries used by tests
  cache.del(CACHE_KEY);
  // Spy on logger.warn
  jest.spyOn(logger, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── Success ─────────────────────────────────────────────────────────
test("returns parsed JSON on 200", async () => {
  const payload = { rate: 1.05, currency: "EUR" };
  global.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => payload,
  });

  const result = await getJson(TEST_URL);
  expect(result).toEqual(payload);
  expect(global.fetch).toHaveBeenCalledWith(
    TEST_URL,
    expect.objectContaining({
      signal: expect.any(AbortSignal),
      headers: expect.objectContaining({ "User-Agent": "mern-ecommerce" }),
    })
  );
});

// ── Caching ─────────────────────────────────────────────────────────
test("caches response when cacheKey + cacheTtl provided", async () => {
  const payload = { items: [1, 2, 3] };
  global.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => payload,
  });

  const result = await getJson(TEST_URL, {
    cacheKey: CACHE_KEY,
    cacheTtl: 3600,
  });
  expect(result).toEqual(payload);

  // Second call should hit cache, not fetch
  const result2 = await getJson(TEST_URL, {
    cacheKey: CACHE_KEY,
    cacheTtl: 3600,
  });
  expect(result2).toEqual(payload);
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test("skips fetch on cache hit and returns cached data", async () => {
  // Pre-populate cache
  cache.set(CACHE_KEY, { cached: true }, 3600);

  const result = await getJson(TEST_URL, {
    cacheKey: CACHE_KEY,
    cacheTtl: 3600,
  });
  expect(result).toEqual({ cached: true });
  expect(global.fetch).not.toHaveBeenCalled();
});

// ── Timeout ─────────────────────────────────────────────────────────
test("returns null and logs warn on timeout", async () => {
  global.fetch.mockImplementation(
    () =>
      new Promise((_, reject) => {
        const err = new Error("The operation was aborted");
        err.name = "AbortError";
        // Simulate abort after a tick (setTimeout in httpClient fires)
        setTimeout(() => reject(err), 10);
      })
  );

  const result = await getJson(TEST_URL, { timeoutMs: 5 });
  expect(result).toBeNull();
  expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("External API failed"));
});

// ── Non-2xx ─────────────────────────────────────────────────────────
test("returns null and logs warn on non-2xx status", async () => {
  global.fetch.mockResolvedValue({
    ok: false,
    status: 429,
  });

  const result = await getJson(TEST_URL);
  expect(result).toBeNull();
  expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("HTTP 429"));
});

// ── Parse error ─────────────────────────────────────────────────────
test("returns null and logs warn when JSON parsing fails", async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => {
      throw new Error("Unexpected token");
    },
  });

  const result = await getJson(TEST_URL);
  expect(result).toBeNull();
  expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("External API failed"));
});

// ── Network error ───────────────────────────────────────────────────
test("returns null and logs warn on network error", async () => {
  global.fetch.mockRejectedValue(new Error("ECONNREFUSED"));

  const result = await getJson(TEST_URL);
  expect(result).toBeNull();
  expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("ECONNREFUSED"));
});

// ── Custom headers ──────────────────────────────────────────────────
test("merges custom headers with defaults", async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
  });

  await getJson(TEST_URL, {
    headers: { "Add-Padding": "true" },
  });

  expect(global.fetch).toHaveBeenCalledWith(
    TEST_URL,
    expect.objectContaining({
      headers: expect.objectContaining({
        "User-Agent": "mern-ecommerce",
        "Add-Padding": "true",
      }),
    })
  );
});
