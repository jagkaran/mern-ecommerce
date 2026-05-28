"use strict";
/**
 * health.test.js
 * Covers GET /api/v1/health — both the 200 (db connected) and
 * the 503 (db disconnected / degraded) branches in healthRoute.js.
 */
const request  = require("supertest");
const app      = require("../app");
const mongoose = require("mongoose");

describe("Health Route", () => {
  it("GET /api/v1/health → 200 with db=connected when mongoose is up", async () => {
    // dbSetup.js ensures mongoose is connected before tests run
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.db).toBe("connected");
    expect(typeof res.body.uptime).toBe("number");
    expect(res.body).toHaveProperty("memory");
    expect(typeof res.body.memory.heapUsedMB).toBe("number");
  });

  it("GET /api/v1/health → 503 with db=disconnected when mongoose is down", async () => {
    // Temporarily stub readyState to simulate a disconnected DB
    const originalReadyState = Object.getOwnPropertyDescriptor(
      mongoose.connection,
      "readyState"
    );
    Object.defineProperty(mongoose.connection, "readyState", {
      get: () => 0,  // 0 = disconnected
      configurable: true,
    });

    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(503);
    expect(res.body.status).toBe("degraded");
    expect(res.body.db).toBe("disconnected");

    // Restore original descriptor
    if (originalReadyState) {
      Object.defineProperty(mongoose.connection, "readyState", originalReadyState);
    } else {
      // readyState is a prototype property on Connection — just delete our override
      delete mongoose.connection.readyState;
    }
  });

  it("GET /api/v1/health → has correct response shape", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.body).toMatchObject({
      status:    expect.any(String),
      uptime:    expect.any(Number),
      timestamp: expect.any(String),
      db:        expect.any(String),
      memory: {
        heapUsedMB:  expect.any(Number),
        heapTotalMB: expect.any(Number),
        rssMB:       expect.any(Number),
      },
    });
  });
});
