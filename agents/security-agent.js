#!/usr/bin/env node
/**
 * Security Agent -- mern-ecommerce
 * Checks: npm audit, required middleware, JWT cookie flags, hardcoded secrets.
 */
"use strict";
const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");

const ROOT    = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
const issues  = [];
const warn    = (m) => issues.push({ level: "WARN",     msg: m });
const fail    = (m) => issues.push({ level: "CRITICAL", msg: m });

// 0. Auto-install missing security packages
const REQUIRED = ["helmet","cors","express-rate-limit","express-mongo-sanitize","xss-clean","compression"];
console.log("\n[security] Checking & installing required security packages ...");
const pkg     = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const allDeps = Object.assign({}, pkg.dependencies, pkg.devDependencies);
const missing = REQUIRED.filter((p) => !allDeps[p]);
if (missing.length > 0) {
  console.log("   installing: " + missing.join(", "));
  execSync("npm install " + missing.join(" "), { cwd: ROOT, stdio: "inherit" });
} else {
  console.log("   ✅  All required security packages already present.");
}

// 1. npm audit
console.log("\n🔍  [security] Running npm audit ...");
try {
  execSync("npm audit --audit-level=high --json", { cwd: ROOT, stdio: "pipe" });
  console.log("   ✅  No high/critical npm vulnerabilities.");
} catch (e) {
  try {
    const a  = JSON.parse(e.stdout ? e.stdout.toString() : "{}");
    const hi = a?.metadata?.vulnerabilities?.high     || 0;
    const cr = a?.metadata?.vulnerabilities?.critical || 0;
    if (cr > 0) fail(`npm audit: ${cr} critical vulnerabilities`);
    if (hi > 0) warn(`npm audit: ${hi} high vulnerabilities`);
  } catch (_) { warn("npm audit returned non-zero exit"); }
}

// 2. Required middleware in app.js
console.log("\n🔍  [security] Checking required security middleware ...");
const appFile = path.join(BACKEND, "app.js");
if (fs.existsSync(appFile)) {
  const src = fs.readFileSync(appFile, "utf8");
  if (!src.includes("helmet"))        fail("Missing helmet middleware in app.js");
  if (!src.includes("rateLimit"))     fail("Missing express-rate-limit in app.js");
  if (!src.includes("mongoSanitize")) fail("Missing express-mongo-sanitize in app.js");
  if (!src.includes("xss"))          fail("Missing xss-clean middleware in app.js");
  if (!src.includes("cors"))         fail("Missing cors middleware in app.js");
  if (!src.includes("compression"))  warn("Missing compression middleware in app.js");
}

// 3. JWT cookie flags
console.log("\n🔍  [security] Checking JWT cookie flags ...");
const jwtFile = path.join(BACKEND, "utils", "jwtToken.js");
if (fs.existsSync(jwtFile)) {
  const src = fs.readFileSync(jwtFile, "utf8");
  if (!src.includes("secure:"))        fail("JWT cookie missing 'secure' flag");
  if (!src.includes("sameSite"))       fail("JWT cookie missing 'sameSite' flag");
  if (!src.includes("httpOnly: true")) fail("JWT cookie missing 'httpOnly: true'");
}

// 4. Secret scan — skip test files, only flag real credential patterns
console.log("\n🔍  [security] Scanning for hardcoded secrets ...");
const SECRET_PATTERNS = [
  /(['"`])sk_(live|test)_[A-Za-z0-9]{20,}\1/,
  /(['"`])AKIA[0-9A-Z]{16}\1/,
];
function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules",".git","dist","build","__tests__"].includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { scanDir(full); continue; }
    if (!/\.(js|ts|jsx|tsx)$/.test(e.name)) continue;
    const src = fs.readFileSync(full, "utf8");
    for (const p of SECRET_PATTERNS)
      if (p.test(src)) warn("Possible hardcoded secret in " + path.relative(ROOT, full));
  }
}
scanDir(BACKEND);

// Report
console.log("\n─── Security Agent Report ───────────────────────────");
if (issues.length === 0) {
  console.log("  ✅  No security issues found.");
} else {
  for (const i of issues) console.log(`  ${i.level === "CRITICAL" ? "❌" : "⚠️ "}  [${i.level}] ${i.msg}`);
}
console.log("─────────────────────────────────────────────────────\n");
if (issues.filter((i) => i.level === "CRITICAL").length > 0) process.exit(1);
