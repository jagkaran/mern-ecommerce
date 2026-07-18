/**
 * Currency service tests. Network is mocked.
 */

const currencyService = require("../services/currencyService");
const { getJson } = require("../services/httpClient");
const cache = require("../middleware/cache");

jest.mock("../services/httpClient", () => ({ getJson: jest.fn() }));

beforeEach(() => {
  getJson.mockReset();
  cache.clearAll();
});

test("getRates returns parsed rates + always includes base=1", async () => {
  getJson.mockResolvedValue({
    amount: 1,
    base: "USD",
    date: "2026-01-01",
    rates: { EUR: 0.9, GBP: 0.8 },
  });

  const out = await currencyService.getRates("USD");
  expect(out.base).toBe("USD");
  expect(out.rates.USD).toBe(1); // eagerly added
  expect(out.rates.EUR).toBe(0.9);
  expect(getJson).toHaveBeenCalledWith(
    expect.stringContaining("from=USD"),
    expect.objectContaining({ cacheKey: "rates:USD" })
  );
});

test("getRates passes cacheKey for 12h TTL", async () => {
  getJson.mockResolvedValue({ base: "USD", rates: { EUR: 0.9 } });
  const first = await currencyService.getRates("USD");
  const second = await currencyService.getRates("USD");
  // httpClient mock bypasses real caching; verify cacheKey is passed correctly
  expect(first.rates.EUR).toBe(0.9);
  expect(second.rates.EUR).toBe(0.9);
  expect(getJson).toHaveBeenCalledWith(
    expect.stringContaining("from=USD"),
    expect.objectContaining({ cacheKey: "rates:USD" })
  );
});

test("getRates returns null when upstream fails (falls open)", async () => {
  getJson.mockResolvedValue(null);
  const out = await currencyService.getRates("USD");
  expect(out).toBeNull();
});

test("getCountries compacts to {cca2,currency,flag} only", async () => {
  getJson.mockResolvedValue([
    {
      cca2: "DE",
      currencies: { EUR: { name: "Euro", symbol: "€" } },
      flags: { png: "https://flag/de.png" },
    },
    { cca2: "ZZ" }, // missing currency — should be filtered out
    {
      cca2: "JP",
      currencies: { JPY: { name: "Yen", symbol: "¥" } },
      flags: { png: "https://flag/jp.png" },
    },
  ]);

  const out = await currencyService.getCountries();
  expect(out).toEqual([
    { cca2: "DE", currency: "EUR", flag: "https://flag/de.png" },
    { cca2: "JP", currency: "JPY", flag: "https://flag/jp.png" },
  ]);
});

test("getCountries returns [] when upstream is down", async () => {
  getJson.mockResolvedValue(null);
  const out = await currencyService.getCountries();
  expect(out).toEqual([]);
});
