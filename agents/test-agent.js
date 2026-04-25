#!/usr/bin/env node
/**
 * Test Agent -- mern-ecommerce SDLC
 * - Uses MongoMemoryServer (no local MongoDB needed)
 * - Mocks Stripe + Cloudinary so tests run without real credentials
 * - Always rewrites test files to keep them in sync with agent
 */
"use strict";
const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");

const ROOT  = path.resolve(__dirname, "..");
const TESTS = path.join(ROOT, "backend", "__tests__");
if (!fs.existsSync(TESTS)) fs.mkdirSync(TESTS, { recursive: true });

const w = (f, c) => {
  fs.writeFileSync(f, c, "utf8");
  console.log("  written: " + path.relative(ROOT, f));
};

// ── setup.js (setupFiles) ─────────────────────────────────────────────────────
w(path.join(TESTS, "setup.js"),
`"use strict";
// setupFiles: runs before modules load — mock Stripe + Cloudinary
jest.mock("stripe", () => () => ({
  paymentIntents: { create: jest.fn().mockResolvedValue({ client_secret: "test_secret" }) },
}));
jest.mock("cloudinary", () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload:  jest.fn().mockResolvedValue({ public_id: "test_id", secure_url: "http://test.url/img.jpg" }),
      destroy: jest.fn().mockResolvedValue({ result: "ok" }),
    },
  },
}));
process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.JWT_SECRET        = "test_jwt_secret_for_jest_only";
process.env.JWT_EXPIRE        = "7d";
process.env.COOKIE_EXPIRE     = "7";
`);

// ── globalSetup.js ────────────────────────────────────────────────────────────
w(path.join(TESTS, "globalSetup.js"),
`"use strict";
const { MongoMemoryServer } = require("mongodb-memory-server");
const fs   = require("fs");
const path = require("path");
module.exports = async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  global.__MONGOD__ = mongod;
  fs.writeFileSync(path.join(__dirname, ".mongo-uri"), mongod.getUri(), "utf8");
};
`);

// ── globalTeardown.js ─────────────────────────────────────────────────────────
w(path.join(TESTS, "globalTeardown.js"),
`"use strict";
const mongoose = require("mongoose");
const fs   = require("fs");
const path = require("path");
module.exports = async function globalTeardown() {
  try {
    const uri = fs.readFileSync(path.join(__dirname, ".mongo-uri"), "utf8");
    if (mongoose.connection.readyState === 0) await mongoose.connect(uri);
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  } catch (_) {}
  try { fs.unlinkSync(path.join(__dirname, ".mongo-uri")); } catch (_) {}
};
`);

// ── dbSetup.js (setupFilesAfterFramework) ────────────────────────────────────
w(path.join(TESTS, "dbSetup.js"),
`"use strict";
// Connects mongoose inside the test worker using the URI written by globalSetup
const mongoose = require("mongoose");
const fs   = require("fs");
const path = require("path");
beforeAll(async () => {
  const uri = fs.readFileSync(path.join(__dirname, ".mongo-uri"), "utf8");
  process.env.DB_URI = uri;
  if (mongoose.connection.readyState === 0) await mongoose.connect(uri);
});
afterAll(async () => {
  for (const name of Object.keys(mongoose.connection.collections)) {
    await mongoose.connection.collections[name].deleteMany({});
  }
});
`);

// ── product.test.js ───────────────────────────────────────────────────────────
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
  it("GET /api/v1/product/:id returns 404 for unknown id", async () => {
    const res = await request(app).get("/api/v1/product/000000000000000000000000");
    expect(res.status).toBe(404);
  });
});
`);

// ── auth.test.js ──────────────────────────────────────────────────────────────
w(path.join(TESTS, "auth.test.js"),
`"use strict";
const request  = require("supertest");
const app      = require("../app");
const testUser = { name:"Test User", email:"test_"+Date.now()+"@example.com", password:"Test@12345" };
let authCookie = "";
describe("Auth API", () => {
  it("POST /api/v1/register returns 201", async () => {
    const res = await request(app).post("/api/v1/register").send(testUser);
    expect(res.status).toBe(201);
  });
  it("POST /api/v1/login returns 200", async () => {
    const res = await request(app).post("/api/v1/login").send({ email:testUser.email, password:testUser.password });
    expect(res.status).toBe(200);
    if (res.headers["set-cookie"]) authCookie = res.headers["set-cookie"][0];
  });
  it("GET /api/v1/me returns 200", async () => {
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

// ── order.test.js ─────────────────────────────────────────────────────────────
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

// ── Sync package.json jest config ────────────────────────────────────────────
const pkgPath = path.join(ROOT, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.jest = {
  testEnvironment:          "node",
  testMatch:                ["**/backend/__tests__/**/*.test.js"],
  setupFiles:               ["<rootDir>/backend/__tests__/setup.js"],
  setupFilesAfterFramework: ["<rootDir>/backend/__tests__/dbSetup.js"],
  globalSetup:              "<rootDir>/backend/__tests__/globalSetup.js",
  globalTeardown:           "<rootDir>/backend/__tests__/globalTeardown.js",
  testTimeout:              30000,
  coverageDirectory:        "coverage",
  collectCoverageFrom:      ["backend/**/*.js", "!backend/node_modules/**", "!backend/__tests__/**"],
};
if (!pkg.scripts.test || !pkg.scripts.test.includes("jest")) {
  pkg.scripts.test = "jest --runInBand --forceExit";
}
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
console.log("  synced package.json jest config");

// ── Install deps ─────────────────────────────────────────────────────────────
console.log("\n\uD83D\uDD0D  [test-agent] Checking test dependencies ...");
const freshPkg  = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const allDeps   = Object.assign({}, freshPkg.dependencies, freshPkg.devDependencies);
const toInstall = ["jest", "supertest", "mongodb-memory-server"].filter((d) => !allDeps[d]);
if (toInstall.length > 0) {
  console.log("   installing: " + toInstall.join(", "));
  execSync("npm install --save-dev " + toInstall.join(" "), { cwd: ROOT, stdio: "inherit" });
} else {
  console.log("   \u2705  All test deps present.");
}

// ── Run ───────────────────────────────────────────────────────────────────────
console.log("\n\uD83E\uDDEA  [test-agent] Running test suite ...\n");
try {
  execSync("npx jest --runInBand --forceExit --passWithNoTests", { cwd: ROOT, stdio: "inherit" });
  console.log("\n  \u2705  All tests passed.\n");
} catch (_) {
  console.error("\n  \u274C  Tests failed.\n");
  process.exit(1);
}
