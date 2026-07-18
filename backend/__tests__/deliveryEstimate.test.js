/**
 * Delivery estimate service tests.
 * Mocks httpClient.getJson and uses fixed dates to ensure deterministic results.
 */

const { estimateDelivery } = require("../services/deliveryEstimateService");
const { getJson } = require("../services/httpClient");

jest.mock("../services/httpClient", () => ({ getJson: jest.fn() }));

beforeEach(() => {
  getJson.mockReset();
});

test("estimateDelivery skips weekends and holidays", async () => {
  getJson.mockResolvedValue([{ date: "2026-07-03" }, { date: "2026-07-04" }]);

  const from = new Date("2026-06-28");
  const result = await estimateDelivery("US", from, 5);
  expect(result).toBeInstanceOf(Date);
  expect(result.toISOString().slice(0, 10)).toBe("2026-07-06");
});

test("estimateDelivery falls back to weekends-only when holidays unavailable", async () => {
  getJson.mockResolvedValue(null);

  const from = new Date("2026-06-28");
  const result = await estimateDelivery("US", from, 5);
  expect(result).toBeInstanceOf(Date);
  expect(result.toISOString().slice(0, 10)).toBe("2026-07-03");
});

test("estimateDelivery returns null on invalid inputs", async () => {
  expect(await estimateDelivery("", new Date())).toBeNull();
  expect(await estimateDelivery("US", "invalid")).toBeNull();
  expect(await estimateDelivery("USX", new Date())).toBeNull();
});

test("estimateDelivery uses today when fromDate missing/invalid", async () => {
  getJson.mockResolvedValue([]);

  // Override Date.now() so "today" is a known Monday.
  const FIXED_MON = new Date("2026-06-29").getTime();
  const origNow = Date.now;
  const origCtor = global.Date;

  // Provide a named cross-env "now" accessor the service can use.
  global.Date = class extends Date {
    constructor(...args) {
      if (args.length === 0) {
        return new origCtor(FIXED_MON);
      }
      return new origCtor(...args);
    }
    static now() {
      return FIXED_MON;
    }
  };
  // polyfill for code doing `new Date(today)` where today = new Date()
  global.Date.prototype.constructor = global.Date;

  try {
    const result = await estimateDelivery("US", undefined, 1);
    expect(result.toISOString().slice(0, 10)).toBe("2026-06-30");
  } finally {
    global.Date = origCtor;
    global.Date.now = origNow;
  }
});
