#!/usr/bin/env node
/**
 * Coverage Agent -- mern-ecommerce
 * Runs Jest with --coverage and fails if line coverage < threshold.
 */
"use strict";
const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const THRESHOLD = 50; // % line coverage minimum

console.log(`\n📊  [coverage-agent] Running Jest with coverage (threshold: ${THRESHOLD}%) ...\n`);

try {
  execSync(
    `npx jest --runInBand --forceExit --passWithNoTests --coverage --coverageThreshold='{"global":{"lines":${THRESHOLD}}}'`,
    { cwd: ROOT, stdio: "inherit" }
  );
  console.log("\n  ✅  Coverage threshold met.\n");
} catch (_) {
  // Coverage report still written even on threshold failure
  const summaryPath = path.join(ROOT, "coverage", "coverage-summary.json");
  if (fs.existsSync(summaryPath)) {
    const s = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    const lines = s?.total?.lines?.pct ?? "unknown";
    console.error(`\n  ❌  Coverage ${lines}% is below threshold of ${THRESHOLD}%.\n`);
  } else {
    console.error("\n  ❌  Coverage failed or threshold not met.\n");
  }
  process.exit(1);
}
