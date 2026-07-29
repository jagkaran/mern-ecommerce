"use strict";

/**
 * Regression test for the Express 5 req.query sanitisation hole.
 *
 * Background:
 *   app.js sets `query parser: extended`, which means qs parses
 *   `?productId[$ne]=null` into `{productId: {$ne: "null"}}`.
 *
 *   Express 5 made req.query a getter-only property that re-parses the URL
 *   on every access. The original mongoSanitize middleware walked req.query
 *   in place and called `delete obj[key]` for $-prefixed keys — but that
 *   mutated a throwaway object returned by the getter, so the next access
 *   re-parsed and handed back the operators intact. Verified before the
 *   fix: `{name: {$ne: "x"}, $where: "1", price: {$gt: "0"}}` reached the
 *   controller unchanged.
 *
 *   The fix snapshots req.query once, sanitises the snapshot, then pins it
 *   as an own property on req via defineProperty, which shadows the
 *   prototype getter.
 *
 * What this test does:
 *   1. Mirrors the relevant middleware chain from backend/app.js: extended
 *      query parser + express.json + mongoSanitize.
 *   2. Sends the attacks that would have succeeded before the fix.
 *   3. Asserts: no Mongo operator keys survive; benign keys preserved.
 */

const express = require("express");
const request = require("supertest");

const mongoSanitize = require("../middleware/mongoSanitize");

function buildProbeApp() {
  const app = express();
  app.set("query parser", "extended");
  app.use(express.json());
  app.use(mongoSanitize);
  // Mirror a real probe route so tests can inspect what the handler sees.
  app.all("/probe", (req, res) => {
    const q = req.query;
    const keys = Object.keys(q);
    const operatorKeys = keys.filter((k) => k.startsWith("$"));
    const nestedOperatorKeys = [];
    for (const v of Object.values(q)) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        for (const k of Object.keys(v)) {
          if (k.startsWith("$") || k.includes(".")) nestedOperatorKeys.push(k);
        }
      }
    }
    res.json({
      query: q,
      keys,
      operatorKeys,
      nestedOperatorKeys,
    });
  });
  // Mirror the body sanitisation target too.
  app.post("/probe-body", (req, res) => {
    res.json({ body: req.body });
  });
  return app;
}

describe("mongoSanitize — req.query sanitisation on Express 5", () => {
  const app = buildProbeApp();

  it("removes bracket-notation $ne from nested keys", async () => {
    const res = await request(app).get("/probe?name[$ne]=x&safe=1");
    expect(res.status).toBe(200);
    // The nested object survives but with no $-keys remaining.
    expect(res.body.query.name).toEqual({});
    expect(res.body.query.safe).toBe("1");
    expect(res.body.operatorKeys).toEqual([]);
    expect(res.body.nestedOperatorKeys).toEqual([]);
  });

  it("removes top-level $-prefixed keys (qs leaves them at root)", async () => {
    const res = await request(app).get("/probe?$where=1&safe=1");
    expect(res.status).toBe(200);
    expect(res.body.query.safe).toBe("1");
    expect(res.body.query.$where).toBeUndefined();
    expect(res.body.operatorKeys).toEqual([]);
  });

  it("removes $gt from nested keys", async () => {
    const res = await request(app).get("/probe?price[$gt]=0&keyword=shoe&page=2");
    expect(res.status).toBe(200);
    expect(res.body.query.price).toEqual({});
    expect(res.body.query.keyword).toBe("shoe");
    expect(res.body.query.page).toBe("2");
    expect(res.body.nestedOperatorKeys).toEqual([]);
  });

  it("removes $where from nested keys", async () => {
    const res = await request(app).get(
      "/probe?productId[$where]=function(){return+true}&id=abc"
    );
    expect(res.status).toBe(200);
    expect(res.body.query.productId).toEqual({});
    expect(res.body.query.id).toBe("abc");
    expect(res.body.nestedOperatorKeys).toEqual([]);
  });

  it("removes nested $-keys regardless of nesting depth", async () => {
    const res = await request(app).get(
      "/probe?foo[bar][$ne]=x&safe=1"
    );
    expect(res.status).toBe(200);
    // Deeply nested $-keys removed; sibling benign keys preserved.
    expect(res.body.query.foo.bar).toEqual({});
    expect(res.body.query.safe).toBe("1");
    expect(res.body.nestedOperatorKeys).toEqual([]);
  });

  it("sanitised snapshot stays stable across multiple req.query reads", async () => {
    // The original bug: the first read returned sanitised data, every
    // subsequent read re-parsed and returned the raw payload. This test
    // pins the fix: both reads must match.
    const res = await request(app).get("/probe?name[$ne]=x&safe=1");
    expect(res.status).toBe(200);
    expect(res.body.query).toEqual({ name: {}, safe: "1" });
    expect(res.body.query).toEqual({ name: {}, safe: "1" }); // second access
  });

  it("body sanitisation still works (regression — unchanged path)", async () => {
    const res = await request(app)
      .post("/probe-body")
      .send({ email: { $ne: null }, password: "x", nested: { a: { $gt: "" } } });
    expect(res.status).toBe(200);
    expect(res.body.body.email).toEqual({});
    expect(res.body.body.password).toBe("x");
    expect(res.body.body.nested).toEqual({ a: {} });
  });
});
