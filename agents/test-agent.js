#!/usr/bin/env node
/**
 * Test Agent -- mern-ecommerce
 * Uses mongodb-memory-server (no local MongoDB needed).
 * Mocks Stripe so tests run without STRIPE_SECRET_KEY.
 * Always overwrites test files so stale imports are never left behind.
 */
"use strict";
const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");
const ROOT  = path.resolve(__dirname, "..");
const TESTS = path.join(ROOT, "backend", "__tests__");

if (!fs.existsSync(TESTS)) fs.mkdirSync(TESTS, { recursive: true });
const w = (f, c) => { fs.writeFileSync(f, c, "utf8"); console.log("  written: " + path.relative(ROOT, f)); };

// Stripe mock — loaded before app.js via jest setupFiles
w(path.join(TESTS, "setup.js"),
`"use strict";
// Mock Stripe so tests run without STRIPE_SECRET_KEY
jest.mock("stripe", () => {
  return () => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ client_secret: "test_secret" }),
    },
  });
});
`);

w(path.join(TESTS, "globalSetup.js"),
`"use strict";
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
module.exports = async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  const uri    = mongod.getUri();
  process.env.MONGO_URI_TEST  = uri;
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
  global.__MONGOD__ = mongod;
  await mongoose.connect(uri);
};
`);

w(path.join(TESTS, "globalTeardown.js"),
`"use strict";
const mongoose = require("mongoose");
module.exports = async function globalTeardown() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (global.__MONGOD__) await global.__MONGOD__.stop();
};
`);

w(path.join(TESTS, "product.test.js"),
`"use strict";
const request = require("supertest");
const app     = require("../app");
describe("Product API", () => {
  it("GET /api/v1/products returns 200", async () => {
    const res = await request(app).get("/api/v1/products");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("products");
  });
  it("GET /api/v1/product/:id returns 404 for missing id", async () => {
    const res = await request(app).get("/api/v1/product/000000000000000000000000");
    expect(res.status).toBe(404);
  });
});
`);

w(path.join(TESTS, "auth.test.js"),
`"use strict";
const request  = require("supertest");
const app      = require("../app");
const testUser = { name:"Test User", email:"test_"+Date.now()+"@example.com", password: process.env.TEST_USER_PASSWORD||"Test@12345" };
let authCookie = "";
describe("Auth API", () => {
  it("POST /api/v1/register returns 201", async () => {
    const res = await request(app).post("/api/v1/register").send(testUser);
    expect(res.status).toBe(201);
  });
  it("POST /api/v1/login returns 200 and sets cookie", async () => {
    const res = await request(app).post("/api/v1/login").send({ email:testUser.email, password:testUser.password });
    expect(res.status).toBe(200);
    if (res.headers["set-cookie"]) authCookie = res.headers["set-cookie"][0];
  });
  it("GET /api/v1/me returns 200 with valid session", async () => {
    if (!authCookie) return;
    const res = await request(app).get("/api/v1/me").set("Cookie", authCookie);
    expect(res.status).toBe(200);
  });
  it("GET /api/v1/logout returns 200", async () => {
    const res = await request(app).get("/api/v1/logout").set("Cookie", authCookie);
    expect(res.status).toBe(200);
  });
});
`);

w(path.join(TESTS, "order.test.js"),
`"use strict";
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
`);

// Sync package.json jest config — add setupFiles for Stripe mock
const pkgPath = path.join(ROOT, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.jest = {
  testEnvironment:   "node",
  testMatch:         ["**/backend/__tests__/**/*.test.js"],
  setupFiles:        ["<rootDir>/backend/__tests__/setup.js"],
  globalSetup:       "<rootDir>/backend/__tests__/globalSetup.js",
  globalTeardown:    "<rootDir>/backend/__tests__/globalTeardown.js",
  testTimeout:       30000,
  coverageDirectory: "coverage",
  collectCoverageFrom: ["backend/**/*.js","!backend/node_modules/**","!backend/__tests__/**"],
};
if (!pkg.scripts.test.includes("jest")) pkg.scripts.test = "jest --runInBand --forceExit";
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
console.log("  synced package.json jest config");

// Install deps
console.log("\n🔍  [test-agent] Checking test dependencies ...");
const latest    = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const all       = Object.assign({}, latest.dependencies, latest.devDependencies);
const toInstall = ["jest","supertest","mongodb-memory-server"].filter((d) => !all[d]);
if (toInstall.length > 0) {
  console.log("   installing: " + toInstall.join(", "));
  execSync("npm install --save-dev " + toInstall.join(" "), { cwd:ROOT, stdio:"inherit" });
} else { console.log("   ✅  All test deps present."); }

// Run
console.log("\n🧪  [test-agent] Running test suite ...\n");
try {
  execSync("npx jest --runInBand --forceExit --passWithNoTests", { cwd:ROOT, stdio:"inherit" });
  console.log("\n  ✅  All tests passed.\n");
} catch (_) { console.error("\n  ❌  Tests failed.\n"); process.exit(1); }
