"use strict";
const request = require("supertest");
const app     = require("../app");
describe("Product API", () => {
  it("GET /api/v1/products returns 200", async () => {
    const res = await request(app).get("/api/v1/products");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("products");
  });
  it("GET /api/v1/product/:id returns 404 for unknown id", async () => {
    const res = await request(app).get("/api/v1/product/000000000000000000000000");
    expect(res.status).toBe(404);
  });
});
