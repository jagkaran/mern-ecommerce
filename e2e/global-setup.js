// e2e/global-setup.js
// Playwright globalSetup — exports a single async function.
// Waits for backend + frontend, then seeds E2E test users.

const http = require("http");

const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || "10000", 10);
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || "3000", 10);
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "admin@test.com";
const ADMIN_PASS = process.env.TEST_ADMIN_PASS || "Admin@1234";
const USER_EMAIL = process.env.TEST_USER_EMAIL || "user@test.com";
const USER_PASS = process.env.TEST_USER_PASS || "User@1234";

function httpRequest(opts, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(opts, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        let data;
        try {
          data = JSON.parse(Buffer.concat(chunks).toString());
        } catch {
          data = Buffer.concat(chunks).toString();
        }
        resolve({ status: res.statusCode, data, cookies: res.headers["set-cookie"] || [] });
      });
    });
    req.on("error", reject);
    if (body) req.write(typeof body === "string" ? body : JSON.stringify(body));
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function waitFor(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    function check() {
      const remaining = deadline - Date.now();
      if (remaining <= 0) return reject(new Error(`Timed out waiting for ${url}`));
      httpRequest({ hostname: "localhost", port: BACKEND_PORT, path: "/api/v1/health", method: "GET" }, null)
        .then((res) => {
          if (res.status < 400) return resolve();
          retry();
        })
        .catch(retry);
    }
    function retry() {
      if (Date.now() + 500 >= deadline) {
        return reject(new Error(`Timed out waiting for ${url}`));
      }
      setTimeout(check, 500);
    }
    check();
  });
}

async function fetchCsrfToken(cookieJar) {
  const res = await httpRequest({
    hostname: "localhost",
    port: BACKEND_PORT,
    path: "/api/v1/csrf-token",
    method: "GET",
    headers: { cookie: cookieJar.join("; ") },
  });
  const newCookies = res.cookies;
  if (newCookies) cookieJar.push(...newCookies);
  return { token: res.data?.csrfToken, cookieJar };
}

async function registerUser(cookieJar, email, password, name, role) {
  let { token, cookieJar: jar } = await fetchCsrfToken(cookieJar);
  cookieJar = jar;

  const body = JSON.stringify({
    name,
    email,
    password,
    role,
  });
  const cookieHeader = cookieJar.join("; ");

  const res = await httpRequest({
    hostname: "localhost",
    port: BACKEND_PORT,
    path: "/api/v1/register",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
      cookie: cookieHeader,
    },
  }, body);

  const newCookies = res.cookies;
  if (newCookies) cookieJar.push(...newCookies);

  return { status: res.status, data: res.data, cookieJar };
}

async function seedUsers() {
  const cookieJar = [];

  // Register admin user
  let res = await registerUser(cookieJar, ADMIN_EMAIL, ADMIN_PASS, "Test Admin", "admin");
  if (res.status === 201) {
    console.log(`[global-setup] Registered admin: ${ADMIN_EMAIL}`);
  } else if (res.status === 409 || res.data?.message?.toLowerCase().includes("already")) {
    console.log(`[global-setup] Admin already exists: ${ADMIN_EMAIL}`);
  } else {
    console.warn(`[global-setup] Admin register status=${res.status}:`, res.data);
  }

  // Small delay between requests
  await sleep(300);

  // Register normal user
  res = await registerUser(cookieJar, USER_EMAIL, USER_PASS, "Test User", "user");
  if (res.status === 201) {
    console.log(`[global-setup] Registered user: ${USER_EMAIL}`);
  } else if (res.status === 409 || res.data?.message?.toLowerCase().includes("already")) {
    console.log(`[global-setup] User already exists: ${USER_EMAIL}`);
  } else {
    console.warn(`[global-setup] User register status=${res.status}:`, res.data);
  }
}

module.exports = async () => {
  await waitFor(`http://localhost:${BACKEND_PORT}/api/v1/health`, 120_000);

  // Frontend is not needed for backend-only setup, but record that it is available
  try {
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("frontend timeout")), 180_000);
      httpRequest({ hostname: "localhost", port: FRONTEND_PORT, path: "/", method: "GET" }, null)
        .then(() => { clearTimeout(t); resolve(); })
        .catch((e) => { clearTimeout(t); reject(e); });
    });
    console.log(`[global-setup] Frontend (port ${FRONTEND_PORT}) healthy`);
  } catch (e) {
    console.warn(`[global-setup] Frontend not reachable on port ${FRONTEND_PORT}: ${e.message}`);
  }

  // Seed test users with proper CSRF double-cookie pattern
  await seedUsers();

  console.log("[global-setup] Done");
};
