// @ts-check
const { defineConfig, devices } = require("@playwright/test");

/**
 * Playwright E2E configuration.
 *
 * npm run e2e          → auto-starts backend + frontend, runs tests
 * E2E_NO_WEBSERVER=1  → skip auto-start (use when servers already running)
 * BASE_URL=https://... → pointing at deployed app (skips webServer)
 *
 * Authenticated tests need test credentials in .env.e2e:
 *   TEST_ADMIN_EMAIL, TEST_ADMIN_PASS, TEST_USER_EMAIL, TEST_USER_PASS
 */

require("dotenv").config({ path: ".env.e2e" });

const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || "3000", 10);
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || "10000", 10);
const BASE_URL =
  process.env.BASE_URL || `http://localhost:${FRONTEND_PORT}`;
const skipWebServer =
  !!process.env.E2E_NO_WEBSERVER || !!process.env.BASE_URL;

module.exports = defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: BASE_URL,
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  ...(skipWebServer
    ? {}
    : {
        webServers: [
          {
            command: `node backend/server.js`,
            url: `http://localhost:${BACKEND_PORT}${process.env.BASE_URL ? "" : "/api/v1/health"}`,
            reuseExistingServer: true,
            timeout: 60_000,
            stdout: "pipe",
            stderr: "pipe",
          },
          {
            command: `npm start --prefix frontend`,
            url: BASE_URL,
            reuseExistingServer: true,
            timeout: 180_000,
            stdout: "pipe",
            stderr: "pipe",
          },
        ],
      }),
});
