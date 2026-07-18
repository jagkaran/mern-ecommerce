/**
 * Disify disposable-email tests. Network is mocked.
 */

// Override setup.js's fail-open mock so we get the real service
jest.mock("../services/emailQualityService", () =>
  jest.requireActual("../services/emailQualityService")
);

const { isDisposableEmail } = require("../services/emailQualityService");
const { getJson } = require("../services/httpClient");
const cache = require("../middleware/cache");

jest.mock("../services/httpClient", () => ({
  getJson: jest.fn(),
}));

beforeEach(() => {
  getJson.mockReset();
  // wipe all cache entries to keep tests isolated
  cache.clearAll();
});

test("returns true when Disify reports disposable", async () => {
  getJson.mockResolvedValue({ disposable: true, format: "x" });
  expect(await isDisposableEmail("foo@mailinator.com")).toBe(true);
  expect(getJson).toHaveBeenCalledWith(expect.stringContaining("foo%40mailinator.com"));
});

test("returns false when Disify reports not disposable", async () => {
  getJson.mockResolvedValue({ disposable: false, format: "x" });
  expect(await isDisposableEmail("foo@gmail.com")).toBe(false);
});

test("caches per-domain so the second call skips the network", async () => {
  getJson.mockResolvedValue({ disposable: true });
  await isDisposableEmail("a@mailinator.com");
  await isDisposableEmail("b@mailinator.com");
  expect(getJson).toHaveBeenCalledTimes(1);
});

test("returns false (fail-open) when Disify errors out", async () => {
  getJson.mockResolvedValue(null);
  expect(await isDisposableEmail("anyone@somewhere.com")).toBe(false);
});

test("returns false for empty / malformed inputs without calling the API", async () => {
  getJson.mockReset();
  expect(await isDisposableEmail("")).toBe(false);
  expect(await isDisposableEmail("not-an-email")).toBe(false);
  expect(await isDisposableEmail(null)).toBe(false);
  expect(getJson).not.toHaveBeenCalled();
});
