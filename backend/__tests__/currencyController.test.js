/**
 * Currency route tests. Stripe/Cloudinary/_ already mocked in setup.js;
 * httpClient is mocked here so Frankfurter / REST Countries are not needed.
 */

const request = require("supertest");
const app = require("../app");
const { getJson } = require("../services/httpClient");

jest.mock("../services/httpClient", () => ({ getJson: jest.fn() }));

beforeEach(() => {
  getJson.mockReset();
});

test("GET /api/v1/currency/rates returns rates payload", async () => {
  getJson.mockResolvedValue({ base: "USD", date: "2026-01-01", rates: { EUR: 0.9 } });

  const res = await request(app).get("/api/v1/currency/rates?base=USD");
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.rates.EUR).toBe(0.9);
  expect(res.body.rates.USD).toBe(1);
  expect(res.body.fallback).toBe(false);
});

test("GET /api/v1/currency/rates returns USD-only fallback on upstream failure", async () => {
  getJson.mockResolvedValue(null);

  const res = await request(app).get("/api/v1/currency/rates");
  expect(res.status).toBe(200);
  expect(res.body.fallback).toBe(true);
  expect(res.body.rates).toEqual({ USD: 1 });
});

test("GET /api/v1/currency/rates rejects malformed base code", async () => {
  const res = await request(app).get("/api/v1/currency/rates?base=USDD");
  expect(res.status).toBe(400);
});

test("GET /api/v1/currency/countries returns compacted shape", async () => {
  getJson.mockResolvedValue([
    { cca2: "IE", currencies: { EUR: {} }, flags: { png: "https://ie.png" } },
  ]);

  const res = await request(app).get("/api/v1/currency/countries");
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.countries).toEqual([{ cca2: "IE", currency: "EUR", flag: "https://ie.png" }]);
});
