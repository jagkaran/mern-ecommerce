"use strict";
/**
 * error-middleware.test.js
 * Drives the error-handler branches in backend/middleware/error.js that
 * are not reachable from the happy-path routes already tested.
 *
 * Covered:
 *  - CastError   → 400 "Resource not found"
 *  - Duplicate key (code 11000) → 400 "Duplicate field value"
 *  - JsonWebTokenError → 400 "Invalid token"
 *  - TokenExpiredError → 400 "Token has expired"
 *  - Generic error passthrough (statusCode + message preserved)
 */
const request  = require("supertest");
const express  = require("express");
const errorMiddleware = require("../middleware/error");
const ErrorHandler    = require("../utils/errorHandler");

/** Build a minimal Express app that throws a specific error on GET /test */
function makeApp(errorFactory) {
  const a = express();
  a.get("/test", (_req, _res, next) => next(errorFactory()));
  a.use(errorMiddleware);
  return a;
}

describe("Error middleware — error type branches", () => {
  it("CastError → 400 Resource not found", async () => {
    const err = Object.assign(new Error("Cast failed"), {
      name: "CastError",
      path: "_id",
    });
    const res = await request(makeApp(() => err)).get("/test");
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Resource not found/i);
  });

  it("Duplicate key (11000) → 400 Duplicate field value", async () => {
    const err = Object.assign(new Error("Duplicate"), {
      code: 11000,
      keyValue: { email: "dup@example.com" },
    });
    const res = await request(makeApp(() => err)).get("/test");
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Duplicate/i);
  });

  it("JsonWebTokenError → 400 Invalid token", async () => {
    const err = Object.assign(new Error("jwt malformed"), {
      name: "JsonWebTokenError",
    });
    const res = await request(makeApp(() => err)).get("/test");
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/token/i);
  });

  it("TokenExpiredError → 400 Token has expired", async () => {
    const err = Object.assign(new Error("jwt expired"), {
      name: "TokenExpiredError",
    });
    const res = await request(makeApp(() => err)).get("/test");
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expired/i);
  });

  it("Generic ErrorHandler preserves statusCode and message", async () => {
    const res = await request(
      makeApp(() => new ErrorHandler("Custom error message", 422))
    ).get("/test");
    expect(res.status).toBe(422);
    expect(res.body.message).toBe("Custom error message");
  });

  it("Unknown error defaults to 500", async () => {
    const res = await request(
      makeApp(() => new Error("Something exploded"))
    ).get("/test");
    expect(res.status).toBe(500);
  });
});
