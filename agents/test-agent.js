#!/usr/bin/env node
/**
 * Test Agent -- mern-ecommerce
 * Ensures test files exist with correct imports, then runs Jest.
 *
 * Test file layout:
 *   backend/__tests__/
 *     globalSetup.js      <- mongoose connect  (jest globalSetup)
 *     globalTeardown.js   <- mongoose close    (jest globalTeardown)
 *     product.test.js     <- require('../app')
 *     auth.test.js        <- require('../app')
 *     order.test.js       <- require('../app')
 */

const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");

const ROOT   = path.resolve(__dirname, "..");
const TESTS  = path.join(ROOT, "backend", "__tests__");

function ensure(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

// Always overwrite test files so stale imports are replaced
function overwrite(file, content) {
  fs.writeFileSync(file, content, "utf8");
  console.log("  written: " + path.relative(ROOT, file));
}

ensure(TESTS);

// globalSetup
overwrite(path.join(TESTS, "globalSetup.js"),
  '"use strict";\n' +
  'const mongoose = require("mongoose");\n' +
  'module.exports = async function globalSetup() {\n' +
  '  const uri = process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/mern_test";\n' +
  '  await mongoose.connect(uri);\n' +
  '};\n'
);

// globalTeardown
overwrite(path.join(TESTS, "globalTeardown.js"),
  '"use strict";\n' +
  'const mongoose = require("mongoose");\n' +
  'module.exports = async function globalTeardown() {\n' +
  '  await mongoose.connection.dropDatabase();\n' +
  '  await mongoose.connection.close();\n' +
  '};\n'
);

// product tests
overwrite(path.join(TESTS, "product.test.js"),
  '"use strict";\n' +
  'const request = require("supertest");\n' +
  'const app     = require("../app");\n' +
  '\n' +
  'describe("Product API", () => {\n' +
  '  it("GET /api/v1/products returns 200", async () => {\n' +
  '    const res = await request(app).get("/api/v1/products");\n' +
  '    expect(res.status).toBe(200);\n' +
  '    expect(res.body).toHaveProperty("products");\n' +
  '  });\n' +
  '  it("GET /api/v1/product/:id 404 for missing id", async () => {\n' +
  '    const res = await request(app).get("/api/v1/product/000000000000000000000000");\n' +
  '    expect(res.status).toBe(404);\n' +
  '  });\n' +
  '});\n'
);

// auth tests
overwrite(path.join(TESTS, "auth.test.js"),
  '"use strict";\n' +
  'const request = require("supertest");\n' +
  'const app     = require("../app");\n' +
  'const testUser = {\n' +
  '  name: "Test User",\n' +
  '  email: "test_" + Date.now() + "@example.com",\n' +
  '  password: process.env.TEST_USER_PASSWORD || "Test@12345",\n' +
  '};\n' +
  'let authCookie = "";\n' +
  'describe("Auth API", () => {\n' +
  '  it("POST /api/v1/register returns 201", async () => {\n' +
  '    const res = await request(app).post("/api/v1/register").send(testUser);\n' +
  '    expect(res.status).toBe(201);\n' +
  '  });\n' +
  '  it("POST /api/v1/login returns 200 and sets cookie", async () => {\n' +
  '    const res = await request(app).post("/api/v1/login")\n' +
  '      .send({ email: testUser.email, password: testUser.password });\n' +
  '    expect(res.status).toBe(200);\n' +
  '    if (res.headers["set-cookie"]) authCookie = res.headers["set-cookie"][0];\n' +
  '  });\n' +
  '  it("GET /api/v1/me returns 200 with valid session", async () => {\n' +
  '    if (!authCookie) return;\n' +
  '    const res = await request(app).get("/api/v1/me").set("Cookie", authCookie);\n' +
  '    expect(res.status).toBe(200);\n' +
  '  });\n' +
  '  it("GET /api/v1/logout returns 200", async () => {\n' +
  '    const res = await request(app).get("/api/v1/logout").set("Cookie", authCookie);\n' +
  '    expect(res.status).toBe(200);\n' +
  '  });\n' +
  '});\n'
);

// order tests
overwrite(path.join(TESTS, "order.test.js"),
  '"use strict";\n' +
  'const request = require("supertest");\n' +
  'const app     = require("../app");\n' +
  'describe("Order API (unauthenticated guard)", () => {\n' +
  '  it("GET /api/v1/orders/me returns 401 without auth", async () => {\n' +
  '    const res = await request(app).get("/api/v1/orders/me");\n' +
  '    expect(res.status).toBe(401);\n' +
  '  });\n' +
  '  it("POST /api/v1/order/new returns 401 without auth", async () => {\n' +
  '    const res = await request(app).post("/api/v1/order/new").send({});\n' +
  '    expect(res.status).toBe(401);\n' +
  '  });\n' +
  '});\n'
);

// Sync package.json jest config
const pkgPath = path.join(ROOT, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.jest = {
  testEnvironment:  "node",
  testMatch:        ["**/backend/__tests__/**/*.test.js"],
  globalSetup:      "<rootDir>/backend/__tests__/globalSetup.js",
  globalTeardown:   "<rootDir>/backend/__tests__/globalTeardown.js",
  coverageDirectory: "coverage",
  collectCoverageFrom: ["backend/**/*.js", "!backend/node_modules/**", "!backend/__tests__/**"],
};
if (pkg.scripts && !pkg.scripts.test.includes("jest")) {
  pkg.scripts.test = "jest --runInBand --forceExit";
}
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
console.log("  synced package.json jest config");

// Install deps if needed
console.log("\n[test-agent] Checking test dependencies ...");
try { require.resolve("jest"); require.resolve("supertest"); console.log("   ok"); }
catch (_) { execSync("npm install --save-dev jest supertest", { cwd: ROOT, stdio: "inherit" }); }

// Run tests
console.log("\n[test-agent] Running test suite ...\n");
try {
  execSync(
    "npx jest --runInBand --forceExit --passWithNoTests",
    { cwd: ROOT, stdio: "inherit" }
  );
  console.log("\n  All tests passed.\n");
} catch (_e) {
  console.error("\n  Tests failed.\n");
  process.exit(1);
}
