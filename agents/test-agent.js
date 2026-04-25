#!/usr/bin/env node
/**
 * Test Agent -- mern-ecommerce
 * Scaffolds Jest + Supertest test suite if missing, then runs tests.
 *
 * Directory layout produced:
 *   backend/__tests__/
 *     setup.js          <- Jest globalSetup / global teardown via jest config
 *     product.test.js
 *     auth.test.js
 *     order.test.js
 *
 * testServer.js is intentionally NOT used as a shared module.
 * Each test file directly requires the app and handles DB setup via
 * jest.config globalSetup / setupFilesAfterFramework.
 */

const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");

const ROOT    = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
const TESTS   = path.join(BACKEND, "__tests__");

function ensure(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
function write(file, content) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, content, "utf8");
    console.log("  📝  Created " + path.relative(ROOT, file));
  } else {
    console.log("  ✔   Exists  " + path.relative(ROOT, file));
  }
}

ensure(TESTS);

// -- Jest setup file (runs once before all suites) ----------------------------
write(path.join(TESTS, "setup.js"),
"const mongoose = require('mongoose');\n" +
"\n" +
"beforeAll(async () => {\n" +
"  const uri = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/mern_test';\n" +
"  if (mongoose.connection.readyState === 0) {\n" +
"    await mongoose.connect(uri);\n" +
"  }\n" +
"});\n" +
"\n" +
"afterAll(async () => {\n" +
"  await mongoose.connection.dropDatabase();\n" +
"  await mongoose.connection.close();\n" +
"});\n"
);

// -- Product API tests --------------------------------------------------------
write(path.join(TESTS, "product.test.js"),
"const request  = require('supertest');\n" +
"const app      = require('../app');\n" +
"\n" +
"describe('Product API', () => {\n" +
"  it('GET /api/v1/products returns 200 with products array', async () => {\n" +
"    const res = await request(app).get('/api/v1/products');\n" +
"    expect(res.status).toBe(200);\n" +
"    expect(res.body).toHaveProperty('products');\n" +
"    expect(Array.isArray(res.body.products)).toBe(true);\n" +
"  });\n" +
"\n" +
"  it('GET /api/v1/product/:id returns 404 for non-existent product', async () => {\n" +
"    const res = await request(app).get('/api/v1/product/000000000000000000000000');\n" +
"    expect(res.status).toBe(404);\n" +
"  });\n" +
"});\n"
);

// -- Auth API tests -----------------------------------------------------------
write(path.join(TESTS, "auth.test.js"),
"const request  = require('supertest');\n" +
"const app      = require('../app');\n" +
"\n" +
"const testUser = {\n" +
"  name:     'Test User',\n" +
"  email:    'test_' + Date.now() + '@example.com',\n" +
"  password: 'Test@12345',\n" +
"};\n" +
"let authCookie = '';\n" +
"\n" +
"describe('Auth API', () => {\n" +
"  it('POST /api/v1/register creates user and returns 201', async () => {\n" +
"    const res = await request(app).post('/api/v1/register').send(testUser);\n" +
"    expect(res.status).toBe(201);\n" +
"    expect(res.body).toHaveProperty('user');\n" +
"  });\n" +
"\n" +
"  it('POST /api/v1/login returns 200 and sets cookie', async () => {\n" +
"    const res = await request(app)\n" +
"      .post('/api/v1/login')\n" +
"      .send({ email: testUser.email, password: testUser.password });\n" +
"    expect(res.status).toBe(200);\n" +
"    expect(res.headers['set-cookie']).toBeDefined();\n" +
"    authCookie = res.headers['set-cookie'][0];\n" +
"  });\n" +
"\n" +
"  it('GET /api/v1/me returns 200 with valid session', async () => {\n" +
"    if (!authCookie) return;\n" +
"    const res = await request(app).get('/api/v1/me').set('Cookie', authCookie);\n" +
"    expect(res.status).toBe(200);\n" +
"    expect(res.body.user.email).toBe(testUser.email);\n" +
"  });\n" +
"\n" +
"  it('GET /api/v1/logout returns 200', async () => {\n" +
"    const res = await request(app).get('/api/v1/logout').set('Cookie', authCookie);\n" +
"    expect(res.status).toBe(200);\n" +
"  });\n" +
"});\n"
);

// -- Order API tests ----------------------------------------------------------
write(path.join(TESTS, "order.test.js"),
"const request = require('supertest');\n" +
"const app     = require('../app');\n" +
"\n" +
"describe('Order API (unauthenticated guard)', () => {\n" +
"  it('GET /api/v1/orders/me returns 401 without auth', async () => {\n" +
"    const res = await request(app).get('/api/v1/orders/me');\n" +
"    expect(res.status).toBe(401);\n" +
"  });\n" +
"\n" +
"  it('POST /api/v1/order/new returns 401 without auth', async () => {\n" +
"    const res = await request(app).post('/api/v1/order/new').send({});\n" +
"    expect(res.status).toBe(401);\n" +
"  });\n" +
"});\n"
);

// -- Update package.json with jest config ------------------------------------
const pkgPath = path.join(ROOT, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
let pkgChanged = false;

if (!pkg.scripts || !pkg.scripts.test || pkg.scripts.test.includes("echo")) {
  pkg.scripts = pkg.scripts || {};
  pkg.scripts.test = "jest --runInBand --forceExit";
  pkgChanged = true;
}

if (!pkg.jest) {
  pkg.jest = {
    testEnvironment:     "node",
    testMatch:           ["**/backend/__tests__/**/*.test.js"],
    setupFilesAfterFramework: ["<rootDir>/backend/__tests__/setup.js"],
    coverageDirectory:   "coverage",
    collectCoverageFrom: ["backend/**/*.js", "!backend/node_modules/**"],
  };
  pkgChanged = true;
} else if (!pkg.jest.setupFilesAfterFramework) {
  pkg.jest.setupFilesAfterFramework = ["<rootDir>/backend/__tests__/setup.js"];
  pkgChanged = true;
}

if (pkgChanged) {
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
  console.log("  📝  Updated package.json with jest config");
}

// -- Install deps if needed --------------------------------------------------
console.log("\n🔍  [test-agent] Checking test dependencies ...");
try {
  require.resolve("jest");
  require.resolve("supertest");
  console.log("   ✅  jest + supertest already installed.");
} catch (_) {
  console.log("   📦  Installing jest + supertest ...");
  execSync("npm install --save-dev jest supertest", { cwd: ROOT, stdio: "inherit" });
}

// -- Run tests ---------------------------------------------------------------
console.log("\n🧪  [test-agent] Running test suite ...\n");
try {
  execSync(
    "npx jest --runInBand --forceExit --passWithNoTests --testPathPattern=backend/__tests__",
    { cwd: ROOT, stdio: "inherit" }
  );
  console.log("\n✅  All tests passed.\n");
} catch (_e) {
  console.error("\n❌  Tests failed.\n");
  process.exit(1);
}
