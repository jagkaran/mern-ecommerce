/**
 * HIBP password-breach service tests. All network is mocked.
 */

// Override setup.js's fail-open mock so we get the real service
jest.mock("../services/passwordBreachService", () =>
  jest.requireActual("../services/passwordBreachService")
);

const { isPasswordBreached } = require("../services/passwordBreachService");
const logger = require("../utils/logger");

// SHA1 of "Password123" uppercase = B2E98AD6F6EB8508DD6A14CFA704BAD7F05F6FB1 (first 5 = "B2E98")
const PREFIX = "B2E98";
const SUFFIX = "AD6F6EB8508DD6A14CFA704BAD7F05F6FB1";

let originalFetch;

beforeAll(() => {
  originalFetch = global.fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

beforeEach(() => {
  global.fetch = jest.fn();
  jest.spyOn(logger, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("returns true when suffix appears in HIBP response", async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => "AAAABBBBCCCC:1\n" + SUFFIX + ":42\nDDDD:0\n",
  });

  const result = await isPasswordBreached("Password123");
  expect(result).toBe(true);
});

test("returns false when suffix is not in response", async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => "AAAABBBBCCCC:1\nDDDD:0\n",
  });

  const result = await isPasswordBreached("CleanUniquePass1");
  expect(result).toBe(false);
});

test("returns false (fail-open) on non-2xx status", async () => {
  global.fetch.mockResolvedValue({ ok: false, status: 429 });

  const result = await isPasswordBreached("Anything1");
  expect(result).toBe(false);
});

test("returns false (fail-open) on network error", async () => {
  global.fetch.mockRejectedValue(new Error("ECONNREFUSED"));

  const result = await isPasswordBreached("Anything1");
  expect(result).toBe(false);
  expect(logger.warn).toHaveBeenCalled();
});

test("returns false (fail-open) on timeout", async () => {
  global.fetch.mockImplementation(
    () =>
      new Promise((_, reject) => {
        const err = new Error("The operation was aborted");
        setTimeout(() => reject(err), 5);
      })
  );

  const result = await isPasswordBreached("Anything1");
  expect(result).toBe(false);
});

test("handles CR-LF line endings", async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => `AAAABBBBCCCC:1\r\n${SUFFIX}:5\r\nDDDD:0\r\n`,
  });

  const result = await isPasswordBreached("Password123");
  expect(result).toBe(true);
});

test("handles empty input", async () => {
  expect(await isPasswordBreached("")).toBe(false);
  expect(await isPasswordBreached(null)).toBe(false);
  expect(global.fetch).not.toHaveBeenCalled();
});
