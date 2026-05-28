// @ts-check
const { defineConfig, devices } = require("@playwright/test");

/**
 * Playwright configuration.
 *
 * LOCAL USAGE (fully automatic — no manual app startup needed):
 *   npm run e2e
 *
 * If you already have the app running separately, skip the auto-start:
 *   E2E_NO_WEBSERVER=1 npm run e2e
 *
 * Authenticated review tests also need:
 *   E2E_USER_EMAIL=you@example.com E2E_USER_PASSWORD=yourpass npm run e2e
 *
 * CI:
 *   npm run e2e:ci   (BASE_URL env var points to the deployed app)
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const skipWebServer = !!process.env.E2E_NO_WEBSERVER || !!process.env.BASE_URL;

// webServer boots the React dev server (which proxies /api/* to :10000 via
// the proxy field in frontend/package.json). The backend must already be
// running OR you can use E2E_NO_WEBSERVER=1 and start both manually.
const webServerConfig = skipWebServer
  ? undefined
  : {
      // Start the React dev server; it proxies API calls to the backend.
      // The backend should already be running (`npm run dev` in another terminal),
      // OR set E2E_NO_WEBSERVER=1 and manage both processes yourself.
      command: "npm start --prefix frontend",
      url: BASE_URL,
      reuseExistingServer: true, // reuse if already running (avoids double-start)
      timeout: 120_000,          // up to 2 min for CRA to compile on first boot
      stdout: "pipe",
      stderr: "pipe",
    };

module.exports = defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // run sequentially — tests share app state via API
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: BASE_URL,
    headless: true,   // always headless — never pass --headed unless debugging
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
  ...(webServerConfig ? { webServer: webServerConfig } : {}),
});
