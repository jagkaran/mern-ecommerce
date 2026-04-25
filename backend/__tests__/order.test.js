"use strict";
const request = require("supertest");
const app     = require("../app");
describe("Order API (auth guard)", () => {
  it("GET /api/v1/orders/me returns 401 without auth", async () => {
    const res = await request(app).get("/api/v1/orders/me");
    expect(res.status).toBe(401);
  });
  it("POST /api/v1/order/new returns 401 without auth", async () => {
    const res = await request(app).post("/api/v1/order/new").send({});
    expect(res.status).toBe(401);
  });
});
