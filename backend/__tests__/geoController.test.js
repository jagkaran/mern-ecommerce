/**
 * Zippopotam proxy tests. Network is mocked.
 */

const request = require("supertest");
const app = require("../app");
const { getJson } = require("../services/httpClient");

jest.mock("../services/httpClient", () => ({ getJson: jest.fn() }));

beforeEach(() => {
  getJson.mockReset();
});

test("GET /api/v1/geo/postal/US/10001 returns city/state when upstream hits", async () => {
  getJson.mockResolvedValue({
    "country abbreviation": "US",
    places: [
      {
        "place name": "New York City",
        "state abbreviation": "NY",
        state: "New York",
      },
    ],
  });

  const res = await request(app).get("/api/v1/geo/postal/US/10001");
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.hit).toBe(true);
  expect(res.body.city).toBe("New York City");
  expect(res.body.state).toBe("NY");
});

test("GET /api/v1/geo/postal returns empty hit when upstream misses", async () => {
  getJson.mockResolvedValue({ places: [] });

  const res = await request(app).get("/api/v1/geo/postal/US/00000");
  expect(res.status).toBe(200);
  expect(res.body.hit).toBe(false);
});

test("GET /api/v1/geo/postal returns 200 with hit=false when upstream is down", async () => {
  getJson.mockResolvedValue(null);
  const res = await request(app).get("/api/v1/geo/postal/US/10001");
  expect(res.status).toBe(200);
  expect(res.body.hit).toBe(false);
});

test("GET /api/v1/geo/postal rejects malformed country", async () => {
  const res = await request(app).get("/api/v1/geo/postal/USA/10001");
  expect(res.status).toBe(400);
});

test("GET /api/v1/geo/postal rejects malformed code", async () => {
  const res = await request(app).get("/api/v1/geo/postal/US/%24%24BAD%24");
  expect(res.status).toBe(400);
});
